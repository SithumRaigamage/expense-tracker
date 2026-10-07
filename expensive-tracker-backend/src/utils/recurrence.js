/**
 * Recurrence helpers for recurring expenses and subscription bills.
 *
 * Dates are computed in UTC so the result doesn't depend on the server's time
 * zone.
 */

const daysInMonthUTC = (year, month) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

/**
 * Adds whole months, keeping the time of day.
 *
 * `setMonth(+1)` overflows: Jan 31 becomes "Feb 31", i.e. Mar 3, and February
 * is skipped (audit M7). Here the day is clamped to the target month's last
 * day instead. `anchorDay` is the day of month the series was set up on, so a
 * Jan 31 series goes Feb 28 → Mar 31 rather than drifting to the 28th forever.
 *
 * @param {Date|string|number} fromDate
 * @param {number} months
 * @param {number} [anchorDay] - Day of month to aim for (1-31); defaults to fromDate's
 * @returns {Date}
 */
const addMonthsUTC = (fromDate, months, anchorDay) => {
  const from = new Date(fromDate);
  const day = anchorDay || from.getUTCDate();

  const next = new Date(from);
  next.setUTCDate(1); // so changing the month can't overflow
  next.setUTCMonth(from.getUTCMonth() + months);
  next.setUTCDate(Math.min(day, daysInMonthUTC(next.getUTCFullYear(), next.getUTCMonth())));
  return next;
};

/**
 * Given a date and a frequency, return the next occurrence date.
 *
 * @param {Date|string|number} fromDate - The reference occurrence date
 * @param {'daily'|'weekly'|'monthly'|'yearly'} frequency
 * @param {Object} [options]
 * @param {number} [options.anchorDay] - Day of month the series started on, for
 *   monthly and yearly series (see addMonthsUTC)
 * @returns {Date} The next occurrence date
 */
const getNextRunDate = (fromDate, frequency, { anchorDay } = {}) => {
  const next = new Date(fromDate);

  switch (frequency) {
    case 'daily':
      next.setUTCDate(next.getUTCDate() + 1);
      return next;
    case 'weekly':
      next.setUTCDate(next.getUTCDate() + 7);
      return next;
    case 'monthly':
      return addMonthsUTC(fromDate, 1, anchorDay);
    case 'yearly':
      return addMonthsUTC(fromDate, 12, anchorDay);
    default:
      throw new Error(`Unsupported recurring frequency: ${frequency}`);
  }
};

module.exports = { getNextRunDate, addMonthsUTC };
