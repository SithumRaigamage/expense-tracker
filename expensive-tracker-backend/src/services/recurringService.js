const Expense = require('../models/Expense');
const ExpenseService = require('./expenseService');
const { getNextRunDate } = require('../utils/recurrence');
const logger = require('../utils/logger');

/**
 * Safety cap on how many missed occurrences a single template can back-fill in
 * one run. Prevents a runaway loop if a template's nextRunDate is far in the past.
 */
const MAX_CATCHUP_PER_TEMPLATE = 366;

/**
 * Service layer for auto-generating recurring expenses.
 *
 * A "template" is any expense with isRecurring: true. Each run finds templates
 * whose nextRunDate is due (<= now) and creates one concrete expense per missed
 * period, advancing nextRunDate as it goes. Generated occurrences are plain
 * expenses (isRecurring: false) linked back via parentExpense.
 */
class RecurringService {
  /**
   * Process all recurring templates that have occurrences due up to `now`.
   * Idempotent: nextRunDate is persisted after every generated occurrence, so a
   * crash or partial failure never double-creates an occurrence on the next run.
   *
   * @param {Object} [options]
   * @param {Date} [options.now] - The moment to generate up to (defaults to now)
   * @returns {Promise<Object>} Summary counts for the run
   */
  static async processDueRecurringExpenses({ now = new Date() } = {}) {
    const templates = await Expense.find({
      isRecurring: true,
      recurringFrequency: { $ne: null }
    });

    let created = 0;
    let templatesWithNewOccurrences = 0;
    let errors = 0;

    for (const template of templates) {
      try {
        // Self-heal templates that never got a nextRunDate (e.g. rows updated
        // via findOneAndUpdate, or data created before this engine existed).
        if (!template.nextRunDate) {
          template.nextRunDate = getNextRunDate(template.date, template.recurringFrequency);
        }

        let generatedForTemplate = 0;
        let cursor = new Date(template.nextRunDate);

        while (cursor <= now && generatedForTemplate < MAX_CATCHUP_PER_TEMPLATE) {
          // Reuse the normal creation path so wallet balances update correctly
          // and category/wallet ownership is validated.
          await ExpenseService.createExpense(
            {
              title: template.title,
              amount: template.amount,
              description: template.description,
              category: template.category,
              wallet: template.wallet,
              date: new Date(cursor),
              paymentMethod: template.paymentMethod,
              tags: template.tags,
              isRecurring: false,
              parentExpense: template._id
            },
            template.user
          );

          cursor = getNextRunDate(cursor, template.recurringFrequency);

          // Persist progress immediately so a later failure in this loop can't
          // cause the just-created occurrence to be generated again.
          template.nextRunDate = cursor;
          await template.save();

          created += 1;
          generatedForTemplate += 1;
        }

        // Persist a self-healed nextRunDate even when nothing was due yet.
        if (generatedForTemplate === 0 && template.isModified('nextRunDate')) {
          await template.save();
        }

        if (generatedForTemplate > 0) {
          templatesWithNewOccurrences += 1;
        }
      } catch (err) {
        errors += 1;
        logger.error('Failed to process recurring expense template', {
          templateId: template._id ? template._id.toString() : null,
          message: err.message
        });
      }
    }

    const summary = {
      totalTemplates: templates.length,
      templatesWithNewOccurrences,
      occurrencesCreated: created,
      errors,
      ranAt: now
    };

    logger.info('Recurring expense run complete', summary);
    return summary;
  }
}

module.exports = RecurringService;
