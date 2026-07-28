const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const Wallet = require('../models/Wallet');
const WalletService = require('./walletService');
const { NotFoundError, BadRequestError } = require('../utils/errors');

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
    
    // Create expense
    const expense = await Expense.create(expenseData);

    // Update wallet balance
    const multiplier = category.type === 'income' ? 1 : -1;
    await WalletService.updateBalance(expense.wallet, userId, expense.amount * multiplier);
    
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

    // If updating category, verify it exists/belongs to user
    let category = oldExpense.category;
    if (updateData.category && updateData.category.toString() !== oldExpense.category._id.toString()) {
      category = await Category.findOne({
        _id: updateData.category,
        user: userId
      });

      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    // Handle wallet change or amount change
    const amountChanged = updateData.amount !== undefined && updateData.amount !== oldExpense.amount;
    const walletChanged = updateData.wallet !== undefined && updateData.wallet.toString() !== oldExpense.wallet.toString();

    if (amountChanged || walletChanged) {
      // Revert old balance
      const oldMultiplier = oldExpense.category.type === 'income' ? -1 : 1;
      await WalletService.updateBalance(oldExpense.wallet, userId, oldExpense.amount * oldMultiplier);

      // Apply new balance (using new amount if provided, else old)
      const newAmount = updateData.amount !== undefined ? updateData.amount : oldExpense.amount;
      const newWalletId = updateData.wallet !== undefined ? updateData.wallet : oldExpense.wallet;
      const newMultiplier = category.type === 'income' ? 1 : -1;
      await WalletService.updateBalance(newWalletId, userId, newAmount * newMultiplier);
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: expenseId, user: userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name color icon type').populate('wallet', 'name type currency');

    return expense;
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

    // Revert wallet balance
    const multiplier = expense.category.type === 'income' ? -1 : 1;
    await WalletService.updateBalance(expense.wallet, userId, expense.amount * multiplier);

    await Expense.deleteOne({ _id: expenseId });

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
