const Category = require('../models/Category');

// @desc    Get all categories for user
// @route   GET /api/v1/categories
// @access  Private
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ user: req.user.id })
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category
// @route   GET /api/v1/categories/:id
// @access  Private
const getCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new category
// @route   POST /api/v1/categories
// @access  Private
const createCategory = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.user = req.user.id;

    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/v1/categories/:id
// @access  Private
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create default categories for new user
// @route   POST /api/v1/categories/defaults
// @access  Private
const createDefaultCategories = async (req, res, next) => {
  try {
    const defaultCategories = [
      { name: 'Salary', color: '#4CAF50', icon: 'fas fa-money-bill-wave', type: 'income' },
      { name: 'Extra Income', color: '#2196F3', icon: 'fas fa-plus-circle', type: 'income' },
      { name: 'Bonus', color: '#FF9800', icon: 'fas fa-gift', type: 'income' },
      { name: 'Food', color: '#FF5722', icon: 'fas fa-utensils', type: 'expense' },
      { name: 'Housing', color: '#9C27B0', icon: 'fas fa-home', type: 'expense' },
      { name: 'Utilities', color: '#607D8B', icon: 'fas fa-bolt', type: 'expense' },
      { name: 'Transportation', color: '#3F51B5', icon: 'fas fa-car', type: 'expense' },
      { name: 'Healthcare', color: '#E91E63', icon: 'fas fa-heart', type: 'expense' },
      { name: 'Education', color: '#00BCD4', icon: 'fas fa-graduation-cap', type: 'expense' },
      { name: 'Entertainment', color: '#FFEB3B', icon: 'fas fa-film', type: 'expense' },
      { name: 'Shopping', color: '#795548', icon: 'fas fa-shopping-bag', type: 'expense' },
      { name: 'Electronics', color: '#9E9E9E', icon: 'fas fa-laptop', type: 'expense' },
    ];

    const categoriesWithUser = defaultCategories.map(cat => ({
      ...cat,
      user: req.user.id
    }));

    const categories = await Category.insertMany(categoriesWithUser);

    res.status(201).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  createDefaultCategories
};
