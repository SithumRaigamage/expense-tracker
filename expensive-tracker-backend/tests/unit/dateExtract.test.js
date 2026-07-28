const { extractDate } = require('../../src/utils/dateExtract');

describe('extractDate', () => {
  it('parses ISO dates', () => {
    expect(extractDate('Posted 2026-01-31 to your account')).toBe('2026-01-31T00:00:00.000Z');
  });

  it('parses day-first numeric dates (dd/mm/yyyy)', () => {
    expect(extractDate('on 31/01/2026')).toBe('2026-01-31T00:00:00.000Z');
    expect(extractDate('05-03-2026')).toBe('2026-03-05T00:00:00.000Z');
  });

  it('expands two-digit years', () => {
    expect(extractDate('12/01/26')).toBe('2026-01-12T00:00:00.000Z');
  });

  it('parses month-name dates in either order', () => {
    expect(extractDate('Jan 5, 2026')).toBe('2026-01-05T00:00:00.000Z');
    expect(extractDate('5 January 2026')).toBe('2026-01-05T00:00:00.000Z');
  });

  it('rejects impossible dates like 31/02', () => {
    // Numeric branch rejects it; no other pattern matches -> null.
    expect(extractDate('31/02/2026')).toBeNull();
  });

  it('returns null when no date is present', () => {
    expect(extractDate('KEELLS SUPER receipt total')).toBeNull();
    expect(extractDate('')).toBeNull();
    expect(extractDate(null)).toBeNull();
  });
});
