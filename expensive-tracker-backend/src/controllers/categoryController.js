const asyncHandler = require('express-async-handler');
const CategoryService = require('../services/categoryService');
const { successResponse, createdResponse } = require('../utils/responseFormatter');

/**
 * @desc    Get all categories for user
 * @route   GET /api/v1/categories
 * @access  Private
 */
const getCategories = asyncHandler(async (req, res) => {
  const options = {
    type: req.query.type,
    isActive: req.query.isActive,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder
  };

  const categories = await CategoryService.getCategories(req.user.id, options);

  successResponse(res, categories, 200);
});

/**
 * @desc    Get single category
 * @route   GET /api/v1/categories/:id
 * @access  Private
 */
const getCategory = asyncHandler(async (req, res) => {
  const category = await CategoryService.getCategory(req.params.id, req.user.id);
  
  successResponse(res, category);
});

/**
 * @desc    Create new category
 * @route   POST /api/v1/categories
 * @access  Private
 */
const createCategory = asyncHandler(async (req, res) => {
  const category = await CategoryService.createCategory(req.body, req.user.id);
  
  createdResponse(res, category, 'Category created successfully');
});

/**
 * @desc    Update category
 * @route   PUT /api/v1/categories/:id
 * @access  Private
 */
const updateCategory = asyncHandler(async (req, res) => {
  const category = await CategoryService.updateCategory(
    req.params.id,
    req.user.id,
    req.body
  );
  
  successResponse(res, category, 200, 'Category updated successfully');
});

/**
 * @desc    Delete category
 * @route   DELETE /api/v1/categories/:id
 * @access  Private
 */
const deleteCategory = asyncHandler(async (req, res) => {
  await CategoryService.deleteCategory(req.params.id, req.user.id);
  
  successResponse(res, {}, 200, 'Category deleted successfully');
});

/**
 * @desc    Create default categories for new user
 * @route   POST /api/v1/categories/defaults
 * @access  Private
 */
const createDefaultCategories = asyncHandler(async (req, res) => {
  const categories = await CategoryService.createDefaultCategories(req.user.id);
  
  createdResponse(res, categories, `${categories.length} default categories created successfully`);
});

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  createDefaultCategories
};
