/**
 * Recurrence helpers for recurring expenses.
 */

/**
 * Given a date and a frequency, return the next occurrence date.
 * Month/year math uses date arithmetic that safely rolls over
 * (e.g. Jan 31 + 1 month lands in February, not an invalid date).
 *
 * @param {Date|string|number} fromDate - The reference occurrence date
 * @param {'daily'|'weekly'|'monthly'|'yearly'} frequency
 * @returns {Date} The next occurrence date
 */
const getNextRunDate = (fromDate, frequency) => {
  const next = new Date(fromDate);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      throw new Error(`Unsupported recurring frequency: ${frequency}`);
  }

  return next;
};

module.exports = { getNextRunDate };
