/**
 * Financial education content.
 *
 * These replaced a two-item placeholder array ("Budgeting Basics", "Investment
 * Strategies") whose bodies didn't exist and whose thumbnails pointed at files
 * that were never in the repo. Everything below is written to be read: each
 * article has a real body, and the guidance is deliberately general and
 * mechanical (how a method works, what a number means) rather than advice about
 * what any particular person should do with their money.
 */

export type ArticleCategory = 'budgeting' | 'saving' | 'debt' | 'investing';
export type ArticleLevel = 'beginner' | 'intermediate';

export interface ArticleSection {
  heading: string;
  /** Paragraphs. Rendered as plain text — no markdown parser in the app. */
  body: string[];
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  category: ArticleCategory;
  level: ArticleLevel;
  /** Minutes, estimated at ~200 words per minute. */
  readingMinutes: number;
  sections: ArticleSection[];
}

export const ARTICLES: Article[] = [
  {
    id: 'track-before-you-budget',
    title: 'Track before you budget',
    summary:
      'A budget built on guesses fails in the first month. Spend a few weeks measuring what you actually spend, then set limits against real numbers.',
    category: 'budgeting',
    level: 'beginner',
    readingMinutes: 4,
    sections: [
      {
        heading: 'Why budgets collapse',
        body: [
          'Most abandoned budgets fail the same way. Someone estimates their categories from memory, sets limits that feel reasonable, and then blows through three of them in the first fortnight. The instinct is to conclude they lack discipline. Usually the limits were simply wrong.',
          'Memory is a poor instrument for this. Large, memorable payments — rent, a flight — are easy to recall. The recurring small ones are not, and they are where the money tends to go.'
        ]
      },
      {
        heading: 'Measure first',
        body: [
          'Record every transaction for one full month before setting a single limit. A full month matters because spending is lumpy: annual insurance, a quarterly bill, and the one week you ate out four times all need somewhere to land.',
          'Do not try to change your behaviour during the measuring month. You are taking a baseline. Changing what you spend while measuring it gives you a number you cannot budget against, because it reflects a month of unusual restraint rather than an ordinary one.'
        ]
      },
      {
        heading: 'Then set limits',
        body: [
          'With a month of real data, group your spending into categories and look at the totals. Set each limit slightly below what you actually spent rather than at some aspirational figure. A limit you miss every month stops being information and becomes noise you learn to ignore.',
          'Revisit after three months. Seasonal costs will have surfaced by then, and you will have a much better sense of which categories are fixed and which are genuinely discretionary.'
        ]
      }
    ]
  },
  {
    id: 'emergency-fund-sizing',
    title: 'How large an emergency fund actually needs to be',
    summary:
      'The common answer is three to six months of expenses. What that means depends on how quickly your income could be replaced.',
    category: 'saving',
    level: 'beginner',
    readingMinutes: 4,
    sections: [
      {
        heading: 'What it is for',
        body: [
          'An emergency fund exists to convert a financial shock into an inconvenience. Its job is to stop you reaching for high-interest credit when the car fails or the work dries up.',
          'It is sized in months of expenses, not months of income. What matters is what you must spend to keep the lights on, not what you normally earn.'
        ]
      },
      {
        heading: 'Working out the number',
        body: [
          'Start with your essential monthly outgoings: housing, utilities, food, transport, insurance, minimum debt payments. Deliberately exclude the discretionary spending you would cut in a genuine emergency — that is the point of the distinction.',
          'Multiply by the number of months your situation warrants. The usual range is three to six. Sit at the lower end if your income is stable and easily replaced, and toward the upper end if you are self-employed, on variable income, the sole earner, or work in a field where hiring is slow.'
        ]
      },
      {
        heading: 'Where to keep it',
        body: [
          'Somewhere you can reach within a day or two, and separate from your day-to-day account so it is not spent by accident. Accessibility beats return here: the fund is insurance, not an investment, and money you cannot get to during an emergency is not serving its purpose.'
        ]
      },
      {
        heading: 'Build it in stages',
        body: [
          'Six months of expenses is a daunting first target. A smaller milestone — one month, or a fixed round number — is reachable, and reaching it changes how the whole exercise feels. Most of the benefit arrives early: the difference between nothing and one month is far larger than the difference between five months and six.'
        ]
      }
    ]
  },
  {
    id: 'reading-your-spending',
    title: 'Reading your own spending data',
    summary:
      'Category totals tell you where money went. Trends tell you where it is going. They are different questions and are worth looking at separately.',
    category: 'budgeting',
    level: 'intermediate',
    readingMinutes: 5,
    sections: [
      {
        heading: 'Totals answer "where did it go"',
        body: [
          'A category breakdown for a single month is a snapshot. It is useful for spotting the obvious — a category far larger than you expected — but it says nothing about direction.',
          'One month is also easily distorted. An annual premium or a one-off repair can make a category look like a problem when it is simply infrequent.'
        ]
      },
      {
        heading: 'Trends answer "where is it going"',
        body: [
          'Comparing the same category across several months is where the useful signal is. A category that has climbed steadily for four months is telling you something a single total cannot.',
          'Watch for the slow ones. A subscription added here and there rarely registers as a decision, but the combined monthly figure grows quietly and is one of the most common sources of surprise in a spending review.'
        ]
      },
      {
        heading: 'Separate fixed from variable',
        body: [
          'Fixed costs — rent, insurance, subscriptions — are changed by renegotiating or cancelling, and rarely by daily willpower. Variable costs respond to day-to-day choices.',
          'This matters because effort spent on the wrong one is largely wasted. A single afternoon reviewing fixed costs often saves more per year than months of restraint on small variable purchases.'
        ]
      },
      {
        heading: 'Be careful with averages',
        body: [
          'An average pulled up by one unusual month will misrepresent a typical one. When a figure looks surprising, check whether a single large transaction is doing most of the work before drawing a conclusion from it.'
        ]
      }
    ]
  },
  {
    id: 'debt-repayment-order',
    title: 'Two ways to order debt repayment',
    summary:
      'Highest interest first costs the least. Smallest balance first is easier to stick to. The right answer depends on which failure you are more worried about.',
    category: 'debt',
    level: 'beginner',
    readingMinutes: 4,
    sections: [
      {
        heading: 'The setup',
        body: [
          'With several debts, you pay the minimum on all of them and direct whatever is left over at one. Which one is the only real question, and there are two established answers.'
        ]
      },
      {
        heading: 'Highest interest first',
        body: [
          'Target the debt with the highest interest rate, regardless of size. This is the mathematically cheaper route: you retire the most expensive borrowing first, so total interest paid is lower and you finish sooner.',
          'The drawback is motivational. If your highest-rate debt is also your largest, months can pass with visible progress on nothing, and plans that feel like they are not working tend to get abandoned.'
        ]
      },
      {
        heading: 'Smallest balance first',
        body: [
          'Target the smallest balance regardless of rate. Each cleared debt frees its minimum payment, which rolls into the next — so the pace accelerates as you go.',
          'This costs more in interest. Its argument is behavioural: an early, visible win makes the plan more likely to survive, and a slightly more expensive plan you finish beats a cheaper one you quit.'
        ]
      },
      {
        heading: 'Choosing',
        body: [
          'If the rates are close together, the cost difference is small and the easier-to-sustain option is reasonable. If one debt carries a much higher rate than the rest, that gap is expensive to ignore.',
          'Either way, keep paying every minimum. Missing one adds fees and damages your credit record, which costs more than the ordering choice ever saves.'
        ]
      }
    ]
  },
  {
    id: 'compound-growth',
    title: 'What compound growth actually does',
    summary:
      'Compounding is unremarkable early and dramatic late. Understanding the shape of the curve explains why starting date matters more than contribution size.',
    category: 'investing',
    level: 'beginner',
    readingMinutes: 4,
    sections: [
      {
        heading: 'The mechanism',
        body: [
          'Compound growth means returns are calculated on your returns as well as your original money. Simple growth adds the same amount each period; compound growth adds a little more each period, because the base it applies to keeps getting larger.',
          'Over short periods the difference is barely visible. Over long ones it is most of the outcome.'
        ]
      },
      {
        heading: 'Why the curve bends late',
        body: [
          'The early years of compounding feel disappointing, because a percentage of a small balance is a small number. The growth is real but slow, and this is where people conclude it is not working.',
          'The later years do most of the work. By then the same percentage applies to a much larger balance, so each period adds substantially more than the last — and this is exactly why time in the market is generally more valuable than the size of any individual contribution.'
        ]
      },
      {
        heading: 'The same maths on debt',
        body: [
          'Interest on borrowing compounds the same way, in the other direction. This is why high-interest debt carried for a long time becomes so expensive, and why paying it down early has an outsized effect compared with paying the same amount later.'
        ]
      },
      {
        heading: 'A caution',
        body: [
          'Compound projections assume a steady rate of return. Real investment returns are not steady — they vary year to year and can be negative. A projection is a way of understanding the shape of growth, not a forecast of what you will have.'
        ]
      }
    ]
  },
  {
    id: 'sinking-funds',
    title: 'Sinking funds: budgeting for costs that are not monthly',
    summary:
      'Annual and irregular expenses wreck monthly budgets. Setting aside a twelfth each month turns a shock into a line item.',
    category: 'saving',
    level: 'intermediate',
    readingMinutes: 3,
    sections: [
      {
        heading: 'The problem',
        body: [
          'A monthly budget handles monthly costs well and irregular ones badly. Insurance renewals, car servicing, annual subscriptions, holidays and gifts are all foreseeable, but they arrive in lumps — and in the month they land they look like overspending even though nothing went wrong.'
        ]
      },
      {
        heading: 'The method',
        body: [
          'List the irregular costs you can foresee over the next year with a rough figure for each. Total them, divide by twelve, and treat that as a monthly expense you set aside rather than spend.',
          'When the bill arrives, it comes from what you have already put aside. The cost has not changed; you have just spread it across the months instead of absorbing it in one.'
        ]
      },
      {
        heading: 'Keep it separate from the emergency fund',
        body: [
          'These serve different purposes. A sinking fund covers costs you know are coming; an emergency fund covers the ones you do not. Mixing them means an expected bill quietly drains the money meant for genuine surprises, and you discover the shortfall at the worst possible time.'
        ]
      }
    ]
  }
];

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    term: 'APR (Annual Percentage Rate)',
    definition:
      'The yearly cost of borrowing, including interest and standardised fees. Designed to make different loan offers comparable — a lower headline rate with heavy fees can carry the higher APR.'
  },
  {
    term: 'Compound interest',
    definition:
      'Interest calculated on both the original amount and the interest already added. Works in your favour when saving and against you when borrowing.'
  },
  {
    term: 'Emergency fund',
    definition:
      'Accessible money set aside for unexpected costs or loss of income, usually sized as three to six months of essential expenses.'
  },
  {
    term: 'Fixed cost',
    definition:
      'An expense that does not change month to month — rent, insurance, a subscription. Reduced by renegotiating or cancelling rather than by daily restraint.'
  },
  {
    term: 'Liquidity',
    definition:
      'How quickly something can be turned into spendable cash without losing value. A current account is highly liquid; property is not.'
  },
  {
    term: 'Net worth',
    definition:
      'Everything you own minus everything you owe. A single figure for overall financial position, more informative as a trend than as a snapshot.'
  },
  {
    term: 'Principal',
    definition:
      'The original amount borrowed or invested, before interest. Payments that reduce the principal lower all future interest.'
  },
  {
    term: 'Sinking fund',
    definition:
      'Money set aside monthly for a known future cost that does not arrive monthly, such as an annual renewal.'
  },
  {
    term: 'Variable cost',
    definition:
      'An expense that changes with behaviour — groceries, fuel, eating out. Responds to day-to-day decisions in a way fixed costs do not.'
  }
];
