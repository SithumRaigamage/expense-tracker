const Expense = require('../models/Expense');
const Category = require('../models/Category');
const ExpenseService = require('./expenseService');
const { matchCategory } = require('../utils/categoryMatcher');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

const MAX_TRANSACTIONS = 1000;

/**
 * Turns normalized transactions (from a CSV statement or SMS alerts) into
 * expenses. Reuses ExpenseService.createExpense so wallet balances and
 * validation stay consistent with manual entry.
 *
 * Credits are matched against income categories, debits against expense
 * categories. A transaction with no category match (and no default) is reported
 * as "unmatched" and skipped. Same-day/amount/description duplicates are skipped
 * so re-importing the same statement is idempotent.
 */
class BankImportService {
  /**
   * @param {Array} transactions - Normalized { date, description, amount, direction }
   * @param {string} userId
   * @param {Object} [options]
   * @param {string} [options.walletId] - Wallet to assign (else auto-determined)
   * @param {string} [options.defaultCategoryId] - Fallback expense category
   * @param {boolean} [options.dryRun] - Preview only; create nothing
   * @returns {Promise<Object>} Import summary with per-transaction outcomes
   */
  static async importTransactions(transactions, userId, options = {}) {
    if (!Array.isArray(transactions)) {
      throw new BadRequestError('No transactions to import');
    }
    if (transactions.length > MAX_TRANSACTIONS) {
      throw new BadRequestError(`Too many transactions (max ${MAX_TRANSACTIONS} per import)`);
    }

    const { walletId, defaultCategoryId, dryRun = false } = options;

    const categories = await Category.find({ user: userId, isActive: true });

    let defaultCategory = null;
    if (defaultCategoryId) {
      defaultCategory = categories.find((c) => c._id.toString() === defaultCategoryId.toString());
      if (!defaultCategory) {
        throw new NotFoundError('Default category not found');
      }
    }

    const summary = { total: transactions.length, created: 0, duplicates: 0, unmatched: 0, dryRun, results: [] };

    for (const tx of transactions) {
      const type = tx.direction === 'credit' ? 'income' : 'expense';

      // Resolve category: keyword match first, then the (expense-only) default.
      let category = matchCategory(tx.description, categories, { type });
      if (!category && type === 'expense' && defaultCategory) {
        category = defaultCategory;
      }

      if (!category) {
        summary.unmatched += 1;
        summary.results.push(outcome(tx, null, 'unmatched'));
        continue;
      }

      // Idempotency: skip an existing same-day, same-amount, same-description row.
      if (tx.date && (await this._isDuplicate(userId, tx, category._id))) {
        summary.duplicates += 1;
        summary.results.push(outcome(tx, category.name, 'duplicate'));
        continue;
      }

      if (dryRun) {
        summary.results.push(outcome(tx, category.name, 'preview'));
        continue;
      }

      try {
        await ExpenseService.createExpense(
          {
            title: tx.description ? tx.description.slice(0, 100) : 'Imported transaction',
            amount: tx.amount,
            description: tx.description,
            category: category._id,
            wallet: walletId,
            date: tx.date ? new Date(tx.date) : undefined,
            paymentMethod: 'bank_transfer',
            tags: ['imported']
          },
          userId
        );
        summary.created += 1;
        summary.results.push(outcome(tx, category.name, 'created'));
      } catch (err) {
        logger.error('Failed to import transaction', { message: err.message, description: tx.description });
        summary.results.push(outcome(tx, category.name, 'error', err.message));
      }
    }

    logger.info('Bank import complete', {
      userId, total: summary.total, created: summary.created,
      duplicates: summary.duplicates, unmatched: summary.unmatched, dryRun
    });
    return summary;
  }

  static async _isDuplicate(userId, tx, categoryId) {
    const day = new Date(tx.date);
    const start = new Date(day); start.setUTCHours(0, 0, 0, 0);
    const end = new Date(day); end.setUTCHours(23, 59, 59, 999);

    const existing = await Expense.findOne({
      user: userId,
      category: categoryId,
      amount: tx.amount,
      description: tx.description,
      date: { $gte: start, $lte: end }
    });
    return Boolean(existing);
  }
}

const outcome = (tx, categoryName, status, error) => ({
  description: tx.description,
  amount: tx.amount,
  direction: tx.direction,
  date: tx.date,
  category: categoryName,
  status,
  ...(error ? { error } : {})
});

module.exports = BankImportService;
