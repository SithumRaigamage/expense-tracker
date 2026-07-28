jest.mock('../../src/models/Expense');
jest.mock('../../src/services/expenseService');
jest.mock('../../src/utils/logger', () => ({ info: jest.fn(), error: jest.fn() }));

const Expense = require('../../src/models/Expense');
const ExpenseService = require('../../src/services/expenseService');
const RecurringService = require('../../src/services/recurringService');

// Build a fake template document with the mongoose-ish surface the service uses.
const makeTemplate = (overrides = {}) => {
  const doc = {
    _id: 'template-1',
    user: 'user-1',
    title: 'Rent',
    amount: 1000,
    description: 'Monthly rent',
    category: 'cat-1',
    wallet: 'wallet-1',
    paymentMethod: 'bank_transfer',
    tags: ['fixed'],
    isRecurring: true,
    recurringFrequency: 'daily',
    date: new Date('2026-01-01T00:00:00.000Z'),
    nextRunDate: new Date('2026-01-08T00:00:00.000Z'),
    _modified: new Set(),
    isModified(field) { return this._modified.has(field); },
    save: jest.fn(function saveImpl() { this._modified.clear(); return Promise.resolve(this); }),
    ...overrides
  };
  return doc;
};

beforeEach(() => {
  jest.clearAllMocks();
  ExpenseService.createExpense.mockResolvedValue({});
});

describe('RecurringService.processDueRecurringExpenses', () => {
  it('back-fills one occurrence per missed period and advances nextRunDate past now', async () => {
    const template = makeTemplate();
    Expense.find.mockResolvedValue([template]);
    const now = new Date('2026-01-10T00:00:00.000Z'); // due dates: Jan 8, 9, 10

    const summary = await RecurringService.processDueRecurringExpenses({ now });

    expect(ExpenseService.createExpense).toHaveBeenCalledTimes(3);
    const dates = ExpenseService.createExpense.mock.calls.map(([data]) => data.date.toISOString());
    expect(dates).toEqual([
      '2026-01-08T00:00:00.000Z',
      '2026-01-09T00:00:00.000Z',
      '2026-01-10T00:00:00.000Z'
    ]);
    expect(summary.occurrencesCreated).toBe(3);
    expect(summary.templatesWithNewOccurrences).toBe(1);
    // nextRunDate advanced beyond now so a re-run creates nothing more.
    expect(template.nextRunDate.getTime()).toBeGreaterThan(now.getTime());
  });

  it('generated occurrences are plain expenses linked to their template', async () => {
    const template = makeTemplate({ nextRunDate: new Date('2026-01-09T00:00:00.000Z') });
    Expense.find.mockResolvedValue([template]);

    await RecurringService.processDueRecurringExpenses({ now: new Date('2026-01-09T00:00:00.000Z') });

    const [data, userId] = ExpenseService.createExpense.mock.calls[0];
    expect(data.isRecurring).toBe(false);
    expect(data.parentExpense).toBe('template-1');
    expect(data.amount).toBe(1000);
    expect(userId).toBe('user-1');
  });

  it('persists progress after every occurrence so re-runs are idempotent', async () => {
    const template = makeTemplate();
    Expense.find.mockResolvedValue([template]);

    await RecurringService.processDueRecurringExpenses({ now: new Date('2026-01-10T00:00:00.000Z') });
    // One save per created occurrence (3), guaranteeing no double-create on retry.
    expect(template.save).toHaveBeenCalledTimes(3);
  });

  it('creates nothing when no occurrence is due yet', async () => {
    const template = makeTemplate({ nextRunDate: new Date('2026-02-01T00:00:00.000Z') });
    Expense.find.mockResolvedValue([template]);

    const summary = await RecurringService.processDueRecurringExpenses({ now: new Date('2026-01-10T00:00:00.000Z') });

    expect(ExpenseService.createExpense).not.toHaveBeenCalled();
    expect(summary.occurrencesCreated).toBe(0);
  });

  it('self-heals a missing nextRunDate from the template date and persists it', async () => {
    const template = makeTemplate({
      nextRunDate: null,
      date: new Date('2026-01-09T00:00:00.000Z'),
      recurringFrequency: 'monthly'
    });
    template._modified.add('nextRunDate'); // service sets this, then flags modified
    Expense.find.mockResolvedValue([template]);

    // next run = Feb 9, which is after `now`, so nothing is created but the
    // healed nextRunDate must still be saved.
    await RecurringService.processDueRecurringExpenses({ now: new Date('2026-01-10T00:00:00.000Z') });

    expect(ExpenseService.createExpense).not.toHaveBeenCalled();
    expect(template.nextRunDate).toEqual(new Date('2026-02-09T00:00:00.000Z'));
    expect(template.save).toHaveBeenCalledTimes(1);
  });

  it('isolates a failing template so others still process', async () => {
    const bad = makeTemplate({ _id: 'bad', nextRunDate: new Date('2026-01-09T00:00:00.000Z') });
    const good = makeTemplate({ _id: 'good', nextRunDate: new Date('2026-01-09T00:00:00.000Z') });
    Expense.find.mockResolvedValue([bad, good]);
    ExpenseService.createExpense
      .mockRejectedValueOnce(new Error('wallet inactive')) // bad
      .mockResolvedValue({}); // good

    const summary = await RecurringService.processDueRecurringExpenses({ now: new Date('2026-01-09T00:00:00.000Z') });

    expect(summary.errors).toBe(1);
    expect(summary.occurrencesCreated).toBe(1);
    // The failed template did not advance its nextRunDate, so it retries next run.
    expect(bad.nextRunDate).toEqual(new Date('2026-01-09T00:00:00.000Z'));
  });
});
