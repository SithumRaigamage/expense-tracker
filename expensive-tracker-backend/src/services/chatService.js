const Anthropic = require('@anthropic-ai/sdk');
const Wallet = require('../models/Wallet');
const Expense = require('../models/Expense');
const ProductBudget = require('../models/ProductBudget');
const { BadRequestError } = require('../utils/errors');

const MODEL = 'claude-opus-5';

/**
 * `max_tokens` caps thinking *and* visible text together, and thinking is on by
 * default on this model — a tight budget truncates the answer mid-sentence.
 */
const MAX_TOKENS = 8000;

/** Chat answers should be quick; the reasoning here is light. */
const EFFORT = 'medium';

const MAX_HISTORY_TURNS = 20;
const MAX_MESSAGE_CHARS = 4000;

let client = null;

/** True when the server is configured to talk to the API at all. */
const isConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

const getClient = () => {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
};

/**
 * Builds the grounding context: the user's own balances, recent spending and
 * goals.
 *
 * Without this the assistant can only give generic advice, which the user could
 * get anywhere. It is deliberately aggregated rather than raw — the model needs
 * totals and categories to reason about, not 500 individual rows.
 */
const buildFinancialContext = async (userId) => {
  const since = new Date();
  since.setMonth(since.getMonth() - 3);

  const [wallets, goals, spendByCategory, recent] = await Promise.all([
    Wallet.find({ user: userId, isActive: true }).select('name type balance currency').lean(),
    ProductBudget.find({ user: userId, isActive: true })
      .select('name targetAmount savedAmount targetDate').lean(),
    Expense.aggregate([
      { $match: { user: userId, date: { $gte: since } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 12 },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $project: { name: { $arrayElemAt: ['$category.name', 0] }, total: 1, count: 1 } }
    ]),
    Expense.find({ user: userId }).sort({ date: -1 }).limit(15)
      .select('title amount date').lean()
  ]);

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  return [
    '<financial_context>',
    `Total across all wallets: ${totalBalance.toLocaleString()}`,
    '',
    'Wallets:',
    ...(wallets.length
      ? wallets.map(w => `- ${w.name} (${w.type}): ${w.balance.toLocaleString()} ${w.currency}`)
      : ['- none yet']),
    '',
    'Spending by category, last 3 months:',
    ...(spendByCategory.length
      ? spendByCategory.map(c => `- ${c.name || 'Uncategorised'}: ${c.total.toLocaleString()} across ${c.count} transactions`)
      : ['- no transactions recorded']),
    '',
    'Savings goals:',
    ...(goals.length
      ? goals.map(g => {
        const pct = g.targetAmount ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0;
        return `- ${g.name}: ${g.savedAmount.toLocaleString()} of ${g.targetAmount.toLocaleString()} (${pct}%), target ${new Date(g.targetDate).toISOString().slice(0, 10)}`;
      })
      : ['- none set']),
    '',
    'Most recent transactions:',
    ...(recent.length
      ? recent.map(t => `- ${new Date(t.date).toISOString().slice(0, 10)}: ${t.title || 'untitled'} — ${t.amount.toLocaleString()}`)
      : ['- none']),
    '</financial_context>'
  ].join('\n');
};

const SYSTEM_PROMPT = `You are the assistant inside a personal expense tracker. The user's own financial data is given to you below; ground every answer in it rather than speaking generally.

Answer the question that was asked, briefly. Lead with the number or the direct answer, then a sentence of context if it helps. Do not restate the whole financial picture back to the user — they can see it on screen.

When the data does not support an answer, say what is missing rather than estimating. If the user has no transactions in a category they ask about, say so.

You cannot make changes on the user's behalf — no adding transactions, moving money, or editing goals. If they ask for that, tell them which screen does it.

You are not a licensed financial adviser. For tax, investment or legal questions, answer what you reasonably can and suggest a professional for the rest. Never invent figures.`;

/**
 * Streams an assistant reply as Server-Sent Events.
 *
 * Streaming rather than a single response because a reply can take several
 * seconds to compose — buffering it means the user watches a spinner, and long
 * requests risk an HTTP timeout.
 */
const streamReply = async ({ userId, messages, res }) => {
  if (!isConfigured()) {
    throw new BadRequestError('The assistant is not configured on this server.');
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new BadRequestError('At least one message is required');
  }

  // Trim before sending: an unbounded history is unbounded cost, and an
  // oversized single message is almost always a paste accident.
  const history = messages
    .slice(-MAX_HISTORY_TURNS)
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));

  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    throw new BadRequestError('The last message must be from the user');
  }

  const context = await buildFinancialContext(userId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const stream = getClient().messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    output_config: { effort: EFFORT },
    system: [
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: context }
    ],
    messages: history
  });

  // If the browser navigates away mid-answer, stop paying for the rest of it.
  res.on('close', () => stream.abort());

  stream.on('text', (delta) => send('delta', { text: delta }));

  const message = await stream.finalMessage();

  // A refusal comes back as a normal 200 with empty or partial content, so it
  // has to be checked explicitly rather than caught.
  if (message.stop_reason === 'refusal') {
    send('error', { message: 'I can\'t help with that request.' });
  } else if (message.stop_reason === 'max_tokens') {
    send('error', { message: 'That answer ran long and was cut short. Try a narrower question.' });
  }

  send('done', { stopReason: message.stop_reason });
  res.end();
};

module.exports = { streamReply, isConfigured, buildFinancialContext, MODEL };
