const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const Wallet = require('../models/Wallet');
const WalletService = require('./walletService');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');
const { runInTransaction } = require('../utils/transaction');

/** Signed change an entry makes to its wallet: income adds, expense subtracts. */
const balanceEffect = (categoryType, amount) => (categoryType === 'income' ? amount : -amount);

// Entries whose category was deleted before deletes were guarded (audit M2).
// Nothing records whether they were income or expense, so their effect on the
// balance can't be reverted; they have to be given a category first.
const ORPHANED_MESSAGE =
  "This transaction's category no longer exists. Assign it a category first, " +
  'so its effect on the wallet balance is known.';

/**
 * Service layer for expense operations
 */
class ExpenseService {
  /**
   * Get all expenses with filtering, sorting and pagination
   * @param {string} userId - User ID
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} Expenses and pagination info
   */
  static async getExpenses(userId, query) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'date',
      sortOrder = 'desc',
      startDate,
      endDate,
      category,
      minAmount,
      maxAmount
    } = query;

    // Build filter object
    const filter = { user: userId };

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const total = await Expense.countDocuments(filter);
    const expenses = await Expense.find(filter)
      .populate('category', 'name color icon type')
      .sort(sort)
      .skip(startIndex)
      .limit(limitNum);

    return {
      expenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  /**
   * Get single expense by ID
   * @param {string} expenseId - Expense ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Expense object
   */
  static async getExpense(expenseId, userId) {
    const expense = await Expense.findOne({
      _id: expenseId,
      user: userId
    }).populate('category', 'name color icon type');

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    return expense;
  }

  /**
   * Create a new expense
   * @param {Object} expenseData - Expense data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created expense
   */
  static async createExpense(expenseData, userId) {
    // Verify category exists and belongs to user
    const category = await Category.findOne({
      _id: expenseData.category,
      user: userId
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Determine wallet if not provided
    if (!expenseData.wallet) {
      expenseData.wallet = await this.determineWallet(userId, expenseData.category);
    } else {
      // Verify wallet exists and belongs to user
      const wallet = await Wallet.findOne({
        _id: expenseData.wallet,
        user: userId,
        isActive: true
      });

      if (!wallet) {
        throw new NotFoundError('Wallet not found');
      }
    }

    expenseData.user = userId;

    // The record and the balance change land together or not at all.
    const expense = await runInTransaction(async (opts) => {
      const [created] = await Expense.create([expenseData], opts);
      await WalletService.updateBalance(created.wallet, userId, balanceEffect(category.type, created.amount), opts);
      return created;
    });

    // Populate info for response
    return Expense.findById(expense._id)
      .populate('category', 'name color icon type')
      .populate('wallet', 'name type currency');
  }

  /**
   * Determine which wallet to use based on category
   * @param {string} userId - User ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<string>} Wallet ID
   */
  static async determineWallet(userId, categoryId) {
    const category = await Category.findById(categoryId);
    const categoryName = category.name.toLowerCase();
    
    // 1. Check for Emergency Fund
    const emergencyKeywords = ['health', 'medical', 'emergency', 'hospital', 'doctor'];
    const isEmergency = emergencyKeywords.some(keyword => categoryName.includes(keyword));
    
    if (isEmergency) {
      const emergencyWallet = await Wallet.findOne({ user: userId, type: 'emergencyfund', isActive: true });
      if (emergencyWallet) return emergencyWallet._id;
    }
    
    // 2. Check for Bank Account (Salary or Rent)
    if (categoryName.includes('salary') || categoryName.includes('rent') || categoryName.includes('housing')) {
      const bankWallet = await Wallet.findOne({ user: userId, type: 'bank', isActive: true });
      if (bankWallet) return bankWallet._id;
    }
    
    // 3. Fallback: Use any cash or bank wallet
    const defaultWallet = await Wallet.findOne({ user: userId, isActive: true, type: { $in: ['cash', 'bank'] } });
    if (defaultWallet) return defaultWallet._id;
    
    // 4. Last resort: any active wallet
    const anyWallet = await Wallet.findOne({ user: userId, isActive: true });
    if (!anyWallet) {
      throw new BadRequestError('No active wallets found. Please create a wallet first.');
    }
    
    return anyWallet._id;
  }

  /**
   * Update an expense
   * @param {string} expenseId - Expense ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated expense
   */
  static async updateExpense(expenseId, userId, updateData) {
    const oldExpense = await Expense.findOne({ _id: expenseId, user: userId }).populate('category');
    if (!oldExpense) {
      throw new NotFoundError('Expense not found');
    }

    const orphaned = !oldExpense.category;
    if (orphaned && !updateData.category) {
      throw new ConflictError(ORPHANED_MESSAGE);
    }

    // If updating category, verify it exists/belongs to user
    let category = oldExpense.category;
    if (updateData.category && (orphaned || updateData.category.toString() !== oldExpense.category._id.toString())) {
      category = await Category.findOne({
        _id: updateData.category,
        user: userId
      });

      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    // Validate before any money moves: arithmetic on "abc" is NaN, and $inc by
    // NaN would write NaN into the balance.
    if (updateData.amount !== undefined) {
      const amount = Number(updateData.amount);
      if (!Number.isFinite(amount) || amount < 0.01) {
        throw new BadRequestError('Amount must be a number greater than 0');
      }
      updateData.amount = amount;
    }

    const walletChanged = updateData.wallet !== undefined && updateData.wallet.toString() !== oldExpense.wallet.toString();

    // Check the destination wallet before touching any balance. Otherwise an
    // unknown or foreign wallet id reverted the old balance and *then* failed,
    // leaving the money removed from one wallet and added to none.
    if (walletChanged) {
      const newWallet = await Wallet.findOne({ _id: updateData.wallet, user: userId, isActive: true });
      if (!newWallet) {
        throw new NotFoundError('Wallet not found');
      }
    }

    // An expense's effect on its wallet is its amount, signed by category type.
    // Amount, wallet and category can each change that effect, so compare the
    // whole effect rather than checking which fields changed: a category moving
    // between an expense and an income type flips the sign on its own (M1).
    //
    // An orphan's original type is unknown. Giving it a category is a label
    // repair that assumes that type, so only an amount or wallet change moves money.
    const oldType = orphaned ? category.type : oldExpense.category.type;
    const oldEffect = balanceEffect(oldType, oldExpense.amount);
    const newEffect = balanceEffect(category.type, updateData.amount ?? oldExpense.amount);

    const updated = await runInTransaction(async (opts) => {
      // The entry's current wallet may have been deleted since (M3): it can still
      // be edited or moved out. Only the destination must be active.
      const existing = { ...opts, includeInactive: true };
      if (walletChanged) {
        await WalletService.updateBalance(oldExpense.wallet, userId, -oldEffect, existing);
        await WalletService.updateBalance(updateData.wallet, userId, newEffect, opts);
      } else if (newEffect !== oldEffect) {
        await WalletService.updateBalance(oldExpense.wallet, userId, newEffect - oldEffect, existing);
      }

      return Expense.findOneAndUpdate(
        { _id: expenseId, user: userId },
        updateData,
        { new: true, runValidators: true, ...opts }
      );
    });

    return Expense.findById(updated._id)
      .populate('category', 'name color icon type')
      .populate('wallet', 'name type currency');
  }

  /**
   * Delete an expense
   * @param {string} expenseId - Expense ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async deleteExpense(expenseId, userId) {
    const expense = await Expense.findOne({ _id: expenseId, user: userId }).populate('category');
    if (!expense) {
      throw new NotFoundError('Expense not found');
    }
    if (!expense.category) {
      throw new ConflictError(ORPHANED_MESSAGE);
    }

    await runInTransaction(async (opts) => {
      // Revert wallet balance
      // Allowed for a deleted wallet too: the entry is its history (M3).
      await WalletService.updateBalance(
        expense.wallet, userId, -balanceEffect(expense.category.type, expense.amount),
        { ...opts, includeInactive: true }
      );

      await Expense.deleteOne({ _id: expenseId }, opts);
    });

    return true;
  }

  /**
   * Get expense statistics
   * @param {string} userId - User ID
   * @param {Object} dates - Start and end dates
   * @returns {Promise<Object>} Statistics object
   */
  static async getExpenseStats(userId, { startDate, endDate }) {
    const matchStage = { user: new mongoose.Types.ObjectId(userId) };

    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    // Aggregation pipeline
    const stats = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' }
        }
      }
    ]);

    // Stats by category
    const categoryStats = await Expense.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$category',
          name: { $first: '$categoryInfo.name' },
          color: { $first: '$categoryInfo.color' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    return {
      summary: stats[0] || { totalAmount: 0, count: 0, avgAmount: 0, minAmount: 0, maxAmount: 0 },
      byCategory: categoryStats
    };
  }

  /**
   * Get monthly expenses breakdown
   * @param {string} userId - User ID
   * @param {number} year - Year to get data for
   * @returns {Promise<Array>} Monthly data
   */
  static async getMonthlyStats(userId, year) {
    const currentYear = year || new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

    const monthlyStats = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing months with 0
    const result = [];
    for (let i = 1; i <= 12; i++) {
      const existing = monthlyStats.find(s => s._id === i);
      result.push({
        month: i,
        total: existing ? existing.total : 0,
        count: existing ? existing.count : 0
      });
    }

    return result;
  }
}

module.exports = ExpenseService;
