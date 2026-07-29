const mongoose = require('mongoose');
const ProductBudget = require('../models/ProductBudget');
const Wallet = require('../models/Wallet');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * Service layer for product budget operations
 */
class ProductBudgetService {
  /**
   * Create a new product budget
   * @param {Object} budgetData - Product budget data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created product budget
   */
  static async createProductBudget(budgetData, userId) {
    budgetData.user = userId;
    return ProductBudget.create(budgetData);
  }

  /**
   * Get all product budgets for a user
   * @param {string} userId - User ID
   * @param {Object} query - Query parameters
   * @returns {Promise<Array>} Array of product budgets
   */
  static async getProductBudgets(userId, query = {}) {
    const filter = { user: userId };
    
    // Add active/inactive filter if provided
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    return ProductBudget.find(filter).sort({ createdAt: -1 });
  }

  /**
   * Get product budget by ID for a specific user
   * @param {string} budgetId - Product budget ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Product budget
   */
  static async getProductBudgetById(budgetId, userId) {
    const budget = await ProductBudget.findOne({ _id: budgetId, user: userId });
    
    if (!budget) {
      throw new NotFoundError('Product budget not found');
    }

    return budget;
  }

  /**
   * Update product budget for a specific user
   * @param {string} budgetId - Product budget ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated product budget
   */
  static async updateProductBudget(budgetId, userId, updateData) {
    const budget = await ProductBudget.findOneAndUpdate(
      { _id: budgetId, user: userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!budget) {
      throw new NotFoundError('Product budget not found');
    }
    
    return budget;
  }

  /**
   * Delete product budget for a specific user
   * @param {string} budgetId - Product budget ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async deleteProductBudget(budgetId, userId) {
    const budget = await ProductBudget.findOneAndDelete({ 
      _id: budgetId, 
      user: userId 
    });

    if (!budget) {
      throw new NotFoundError('Product budget not found');
    }

    return true;
  }

  /**
   * Update saved amount for a product budget
   * @param {string} budgetId - Product budget ID
   * @param {string} userId - User ID
   * @param {number} savedAmount - New saved amount
   * @returns {Promise<Object>} Updated product budget
   */
  static async updateSavedAmount(budgetId, userId, savedAmount) {
    const budget = await ProductBudget.findOneAndUpdate(
      { _id: budgetId, user: userId },
      { savedAmount },
      { new: true, runValidators: true }
    );

    if (!budget) {
      throw new NotFoundError('Product budget not found');
    }

    return budget;
  }

  /**
   * Move money from a wallet into a savings goal.
   *
   * The browser used to do this as two independent writes — debit the wallet,
   * then credit the goal, and try to undo the debit if the credit failed. A
   * closed tab or a dropped connection between them left the money deducted and
   * nowhere, with no record of where it went. The debit also wrote a balance the
   * client had computed from a possibly stale read, so a concurrent transaction
   * was silently overwritten.
   *
   * Both halves happen here in one transaction, against balances read inside it.
   *
   * @param {string} budgetId - Product budget ID
   * @param {string} userId - User ID
   * @param {string} walletId - Wallet to draw the contribution from
   * @param {number} amount - Requested contribution
   * @returns {Promise<Object>} The updated budget, wallet balance and applied amount
   */
  static async contribute(budgetId, userId, walletId, amount) {
    const requested = Number(amount);

    if (!Number.isFinite(requested) || requested <= 0) {
      throw new BadRequestError('Contribution amount must be greater than zero');
    }

    if (!mongoose.Types.ObjectId.isValid(walletId)) {
      throw new BadRequestError('A valid wallet is required');
    }

    // Standalone MongoDB rejects transactions ("Transaction numbers are only
    // allowed on a replica set…"), so fall back to sequential writes there —
    // same approach walletService.transferFunds already takes.
    let session = null;
    try {
      session = await mongoose.startSession();
      await session.startTransaction();
      await mongoose.connection.db.command({ ping: 1 }, { session });
    } catch {
      if (session) {
        try {
          await session.abortTransaction();
        } catch {
          // Ignore abort errors
        }
        await session.endSession();
      }
      session = null;
    }

    const sessionOptions = session ? { session } : {};

    try {
      const budget = await ProductBudget.findOne({ _id: budgetId, user: userId }, null, sessionOptions);
      if (!budget) {
        throw new NotFoundError('Product budget not found');
      }

      const wallet = await Wallet.findOne({ _id: walletId, user: userId, isActive: true }, null, sessionOptions);
      if (!wallet) {
        throw new NotFoundError('Wallet not found');
      }

      const remaining = Math.max(budget.targetAmount - budget.savedAmount, 0);
      if (remaining === 0) {
        throw new BadRequestError('This goal is already fully funded');
      }

      // Clamp server-side. The client caps the input too, but that check runs
      // against numbers it fetched earlier and cannot be trusted on its own.
      const applied = Math.min(requested, remaining);

      if (wallet.balance < applied) {
        throw new BadRequestError('Insufficient funds in the selected wallet');
      }

      wallet.balance -= applied;
      budget.savedAmount += applied;

      await wallet.save(sessionOptions);
      await budget.save(sessionOptions);

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      return {
        budget,
        walletBalance: wallet.balance,
        appliedAmount: applied,
        isFullyFunded: budget.savedAmount >= budget.targetAmount
      };
    } catch (error) {
      if (session) {
        try {
          await session.abortTransaction();
        } catch {
          // Ignore abort errors
        }
        session.endSession();
      }
      throw error;
    }
  }

  /**
   * Get summary statistics for product budgets
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Summary statistics
   */
  static async getProductBudgetsSummary(userId) {
    const activeBudgets = await ProductBudget.find({ user: userId, isActive: true });
    
    const totalTargetAmount = activeBudgets.reduce((sum, budget) => sum + budget.targetAmount, 0);
    const totalSavedAmount = activeBudgets.reduce((sum, budget) => sum + budget.savedAmount, 0);
    const averageProgress = activeBudgets.length > 0 
      ? activeBudgets.reduce((sum, budget) => sum + budget.progress, 0) / activeBudgets.length
      : 0;

    return {
      totalBudgets: activeBudgets.length,
      totalTargetAmount,
      totalSavedAmount,
      totalRemainingAmount: Math.max(totalTargetAmount - totalSavedAmount, 0),
      averageProgress: Math.round(averageProgress)
    };
  }
}

module.exports = ProductBudgetService;
