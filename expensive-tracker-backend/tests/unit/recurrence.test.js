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

  // Audit M7: setMonth(+1) on Jan 31 produced Mar 3, skipping February.
  it('clamps a month-end date to the last day of a shorter month', () => {
    const next = getNextRunDate('2026-01-31T09:00:00.000Z', 'monthly');
    expect(next.toISOString()).toBe('2026-02-28T09:00:00.000Z');
  });

  it('uses Feb 29 in a leap year', () => {
    const next = getNextRunDate('2028-01-31T00:00:00.000Z', 'monthly');
    expect(next.toISOString()).toBe('2028-02-29T00:00:00.000Z');
  });

  it('returns to the anchor day after a short month instead of drifting', () => {
    // Feb 28 came from a Jan 31 series: March should be the 31st, not the 28th.
    const next = getNextRunDate('2026-02-28T00:00:00.000Z', 'monthly', { anchorDay: 31 });
    expect(next.toISOString()).toBe('2026-03-31T00:00:00.000Z');
  });

  it('keeps a whole year of month-end dates in their own months', () => {
    let date = '2026-01-31T00:00:00.000Z';
    const months = [];
    for (let i = 0; i < 12; i += 1) {
      date = getNextRunDate(date, 'monthly', { anchorDay: 31 });
      months.push(date.toISOString().slice(0, 10));
    }
    expect(months).toEqual([
      '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31', '2026-06-30', '2026-07-31',
      '2026-08-31', '2026-09-30', '2026-10-31', '2026-11-30', '2026-12-31', '2027-01-31'
    ]);
  });

  it('moves Feb 29 to Feb 28 in a yearly series that hits a common year', () => {
    const next = getNextRunDate('2028-02-29T00:00:00.000Z', 'yearly');
    expect(next.toISOString()).toBe('2029-02-28T00:00:00.000Z');
  });

  it('crosses a year boundary monthly', () => {
    const next = getNextRunDate('2026-12-15T00:00:00.000Z', 'monthly');
    expect(next.toISOString()).toBe('2027-01-15T00:00:00.000Z');
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
