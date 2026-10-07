const mongoose = require('mongoose');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errors');
const { runInTransaction } = require('../utils/transaction');

/**
 * Service layer for category operations
 */
class CategoryService {
  /**
   * Get all categories for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of categories
   */
  static async getCategories(userId, options = {}) {
    const { type, isActive, sortBy = 'name', sortOrder = 1 } = options;
    
    const query = { user: userId };
    
    if (type) {
      query.type = type;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    return Category.find(query).sort(sortOptions);
  }

  /**
   * Get single category by ID
   * @param {string} categoryId - Category ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Category object
   */
  static async getCategory(categoryId, userId) {
    const category = await Category.findOne({
      _id: categoryId,
      user: userId
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  }

  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created category
   */
  static async createCategory(categoryData, userId) {
    // Check if category with same name already exists for this user
    const existingCategory = await Category.findOne({
      name: categoryData.name,
      user: userId
    });

    if (existingCategory) {
      throw new ConflictError('A category with this name already exists');
    }

    categoryData.user = userId;
    return Category.create(categoryData);
  }

  /**
   * Update a category
   * @param {string} categoryId - Category ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated category
   */
  static async updateCategory(categoryId, userId, updateData) {
    // If updating name, check for duplicates
    if (updateData.name) {
      const existingCategory = await Category.findOne({
        name: updateData.name,
        user: userId,
        _id: { $ne: categoryId }
      });

      if (existingCategory) {
        throw new ConflictError('A category with this name already exists');
      }
    }

    const category = await Category.findOneAndUpdate(
      { _id: categoryId, user: userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  }

  /**
   * Delete a category.
   *
   * Deleting a category that transactions still use left them pointing at
   * nothing (audit M2): updating or deleting one of them failed with a 500,
   * and the frontend's list crashed. A category in use can only be deleted
   * together with moving its transactions to another category, and only one of
   * the same type: moving entries between expense and income would flip their
   * effect on wallet balances.
   *
   * @param {string} categoryId - Category ID
   * @param {string} userId - User ID
   * @param {Object} [options]
   * @param {string} [options.reassignTo] - Category to move this one's transactions to
   * @returns {Promise<{ reassigned: number }>} How many transactions were moved
   */
  static async deleteCategory(categoryId, userId, { reassignTo } = {}) {
    return runInTransaction(async (opts) => {
      const category = await Category.findOne({ _id: categoryId, user: userId }, null, opts);
      if (!category) {
        throw new NotFoundError('Category not found');
      }

      const inUse = await Expense.countDocuments({ category: categoryId, user: userId }, opts);

      if (inUse > 0) {
        if (!reassignTo) {
          throw new ConflictError(
            `This category is used by ${inUse} transaction${inUse === 1 ? '' : 's'}. ` +
            `Choose another ${category.type} category to move them to (reassignTo).`
          );
        }
        if (!mongoose.Types.ObjectId.isValid(reassignTo) || String(reassignTo) === String(categoryId)) {
          throw new BadRequestError('reassignTo must be a different, valid category id');
        }

        const target = await Category.findOne({ _id: reassignTo, user: userId }, null, opts);
        if (!target) {
          throw new NotFoundError('The category to move transactions to was not found');
        }
        if (target.type !== category.type) {
          throw new BadRequestError(
            `Transactions can only move to another ${category.type} category: ` +
            'changing their type would change your wallet balances.'
          );
        }

        await Expense.updateMany({ category: categoryId, user: userId }, { category: target._id }, opts);
      }

      await Category.deleteOne({ _id: categoryId }, opts);
      return { reassigned: inUse };
    });
  }

  /**
   * Create default categories for a new user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of created categories
   */
  static async createDefaultCategories(userId) {
    const defaultCategories = [
      { name: 'Salary', color: '#4CAF50', icon: '💰', type: 'income' },
      { name: 'Extra Income', color: '#2196F3', icon: '➕', type: 'income' },
      { name: 'Bonus', color: '#FF9800', icon: '🎁', type: 'income' },
      { name: 'Food', color: '#FF5722', icon: '🍔', type: 'expense' },
      { name: 'Housing', color: '#9C27B0', icon: '🏠', type: 'expense' },
      { name: 'Utilities', color: '#607D8B', icon: '⚡', type: 'expense' },
      { name: 'Transportation', color: '#3F51B5', icon: '🚗', type: 'expense' },
      { name: 'Healthcare', color: '#E91E63', icon: '❤️', type: 'expense' },
      { name: 'Education', color: '#00BCD4', icon: '🎓', type: 'expense' },
      { name: 'Entertainment', color: '#FFEB3B', icon: '🎬', type: 'expense' },
      { name: 'Shopping', color: '#795548', icon: '🛍️', type: 'expense' },
      { name: 'Electronics', color: '#9E9E9E', icon: '💻', type: 'expense' }
    ];

    const categoriesWithUser = defaultCategories.map(cat => ({
      ...cat,
      user: userId
    }));

    return Category.insertMany(categoriesWithUser);
  }
}

module.exports = CategoryService;
