const ProductBudget = require('../models/ProductBudget');

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
    return await ProductBudget.create(budgetData);
  }

  /**
   * Get all product budgets for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Array of product budgets
   */
  static async getProductBudgets(userId, filters = {}) {
    const query = { user: userId, ...filters };
    return await ProductBudget.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get product budget by ID for a specific user
   * @param {string} budgetId - Product budget ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Product budget
   */
  static async getProductBudgetById(budgetId, userId) {
    return await ProductBudget.findOne({ _id: budgetId, user: userId });
  }

  /**
   * Update product budget for a specific user
   * @param {string} budgetId - Product budget ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated product budget
   */
  static async updateProductBudget(budgetId, userId, updateData) {
    // First check if the product budget exists and belongs to the user
    const exists = await ProductBudget.findOne({ _id: budgetId, user: userId });
    if (!exists) {
      return null;
    }
    
    return await ProductBudget.findByIdAndUpdate(
      budgetId,
      updateData,
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete product budget for a specific user
   * @param {string} budgetId - Product budget ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if deleted, false otherwise
   */
  static async deleteProductBudget(budgetId, userId) {
    const result = await ProductBudget.deleteOne({ _id: budgetId, user: userId });
    return result.deletedCount > 0;
  }

  /**
   * Update saved amount for a product budget
   * @param {string} budgetId - Product budget ID
   * @param {string} userId - User ID
   * @param {number} savedAmount - New saved amount
   * @returns {Promise<Object>} Updated product budget
   */
  static async updateSavedAmount(budgetId, userId, savedAmount) {
    // First check if the product budget exists and belongs to the user
    const exists = await ProductBudget.findOne({ _id: budgetId, user: userId });
    if (!exists) {
      return null;
    }
    
    return await ProductBudget.findByIdAndUpdate(
      budgetId,
      { savedAmount },
      { new: true, runValidators: true }
    );
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
