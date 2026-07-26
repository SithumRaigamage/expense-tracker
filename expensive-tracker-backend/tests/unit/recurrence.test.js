const { getNextRunDate } = require('../../src/utils/recurrence');

describe('getNextRunDate', () => {
  it('advances a daily frequency by one day', () => {
    const next = getNextRunDate('2026-01-10T00:00:00.000Z', 'daily');
    expect(next.toISOString()).toBe('2026-01-11T00:00:00.000Z');
  });

  it('advances a weekly frequency by seven days', () => {
    const next = getNextRunDate('2026-01-10T00:00:00.000Z', 'weekly');
    expect(next.toISOString()).toBe('2026-01-17T00:00:00.000Z');
  });

  it('advances a monthly frequency by one month', () => {
    const next = getNextRunDate('2026-01-15T00:00:00.000Z', 'monthly');
    expect(next.getUTCMonth()).toBe(1); // February (0-indexed)
    expect(next.getUTCDate()).toBe(15);
  });

  it('advances a yearly frequency by one year', () => {
    const next = getNextRunDate('2026-03-01T00:00:00.000Z', 'yearly');
    expect(next.getUTCFullYear()).toBe(2027);
  });

  it('rolls a month-end date forward without producing an invalid date', () => {
    // Jan 31 + 1 month has no "Feb 31"; JS rolls it into March, which is fine
    // for our engine as long as the result is a valid, strictly-later date.
    const from = new Date('2026-01-31T00:00:00.000Z');
    const next = getNextRunDate(from, 'monthly');
    expect(next.getTime()).toBeGreaterThan(from.getTime());
    expect(Number.isNaN(next.getTime())).toBe(false);
  });

  it('does not mutate the input date', () => {
    const from = new Date('2026-01-10T00:00:00.000Z');
    getNextRunDate(from, 'daily');
    expect(from.toISOString()).toBe('2026-01-10T00:00:00.000Z');
  });

  it('throws on an unsupported frequency', () => {
    expect(() => getNextRunDate('2026-01-10T00:00:00.000Z', 'hourly')).toThrow();
  });
});
