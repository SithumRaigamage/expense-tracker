const ProductBudget = require('../models/ProductBudget');
const { NotFoundError } = require('../utils/errors');

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
