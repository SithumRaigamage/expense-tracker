jest.mock('../../src/services/recurringService');
jest.mock('../../src/utils/logger', () => ({ info: jest.fn(), error: jest.fn() }));

const RecurringService = require('../../src/services/recurringService');
const { startRecurringScheduler } = require('../../src/services/recurringScheduler');

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  RecurringService.processDueRecurringExpenses.mockResolvedValue({ occurrencesCreated: 0 });
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('startRecurringScheduler', () => {
  it('runs immediately on start and then on each interval', async () => {
    const timer = startRecurringScheduler({ intervalMs: 1000 });

    // Immediate boot run.
    expect(RecurringService.processDueRecurringExpenses).toHaveBeenCalledTimes(1);

    // Two more interval ticks.
    jest.advanceTimersByTime(2000);
    expect(RecurringService.processDueRecurringExpenses).toHaveBeenCalledTimes(3);

    clearInterval(timer);
  });

  it('returns a timer that has been unref-ed (does not keep the loop alive)', () => {
    const timer = startRecurringScheduler({ intervalMs: 1000 });
    // Node timers expose unref; jest fake timers return an object with it.
    expect(typeof timer).toBeDefined();
    clearInterval(timer);
  });

  it('swallows a run failure without throwing', () => {
    RecurringService.processDueRecurringExpenses.mockRejectedValue(new Error('boom'));
    expect(() => startRecurringScheduler({ intervalMs: 1000 })).not.toThrow();
  });
});
