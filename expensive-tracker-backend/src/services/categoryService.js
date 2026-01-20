const Category = require('../models/Category');
const { NotFoundError, ConflictError } = require('../utils/errors');

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

    return await Category.find(query).sort(sortOptions);
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
    return await Category.create(categoryData);
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
   * Delete a category
   * @param {string} categoryId - Category ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async deleteCategory(categoryId, userId) {
    const category = await Category.findOneAndDelete({
      _id: categoryId,
      user: userId
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return true;
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

    return await Category.insertMany(categoriesWithUser);
  }
}

module.exports = CategoryService;
