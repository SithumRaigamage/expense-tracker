const RecurringService = require('./recurringService');
const logger = require('../utils/logger');

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Opt-in in-process scheduler for the recurring-expense engine.
 *
 * Runs once on boot and then on a fixed interval (daily by default) for as long
 * as the server process is alive. Enable by setting ENABLE_RECURRING_SCHEDULER=true.
 * If the server does not run continuously, use scripts/processRecurring.js with an
 * external cron instead.
 *
 * @param {Object} [options]
 * @param {number} [options.intervalMs] - How often to run (defaults to daily)
 * @returns {NodeJS.Timeout} The interval timer
 */
const startRecurringScheduler = ({ intervalMs = DAY_MS } = {}) => {
  const run = async () => {
    try {
      await RecurringService.processDueRecurringExpenses({ now: new Date() });
    } catch (err) {
      logger.error('Recurring scheduler run failed', { message: err.message });
    }
  };

  // Kick off immediately so occurrences missed while the server was down get
  // generated right after startup.
  run();

  const timer = setInterval(run, intervalMs);
  // Don't keep the event loop alive solely for this timer.
  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  logger.info('Recurring expense scheduler started', { intervalMs });
  return timer;
};

module.exports = { startRecurringScheduler };
