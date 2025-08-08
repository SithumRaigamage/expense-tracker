const ProductBudget = require('../models/ProductBudget');
const { validateProductBudget, validateProductBudgetUpdate } = require('../validators/productBudgetValidator');
const ProductBudgetService = require('../services/productBudgetService');

/**
 * @desc    Create a new product budget
 * @route   POST /api/productbudgets
 * @access  Private
 */
const createProductBudget = async (req, res) => {
  try {
    // Validate request data
    const { error } = validateProductBudget(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Add user ID to request body
    req.body.user = req.user.id;

    // Create new product budget
    const productBudget = await ProductBudget.create(req.body);

    res.status(201).json({
      success: true,
      data: productBudget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create product budget',
      error: error.message
    });
  }
};

/**
 * @desc    Get all product budgets for current user
 * @route   GET /api/productbudgets
 * @access  Private
 */
const getProductBudgets = async (req, res) => {
  try {
    const query = { user: req.user.id };
    
    // Add active/inactive filter if provided
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const productBudgets = await ProductBudget.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: productBudgets.length,
      data: productBudgets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product budgets',
      error: error.message
    });
  }
};

/**
 * @desc    Get product budget by ID
 * @route   GET /api/productbudgets/:id
 * @access  Private
 */
const getProductBudgetById = async (req, res) => {
  try {
    const productBudget = await ProductBudget.findOne({ 
      _id: req.params.id,
      user: req.user.id
    });

    if (!productBudget) {
      return res.status(404).json({
        success: false,
        message: 'Product budget not found'
      });
    }

    res.status(200).json({
      success: true,
      data: productBudget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product budget',
      error: error.message
    });
  }
};

/**
 * @desc    Update product budget
 * @route   PUT /api/productbudgets/:id
 * @access  Private
 */
const updateProductBudget = async (req, res) => {
  try {
    // Validate request data
    const { error } = validateProductBudgetUpdate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Find product budget by ID and user ID
    let productBudget = await ProductBudget.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!productBudget) {
      return res.status(404).json({
        success: false,
        message: 'Product budget not found or you are not authorized to update it'
      });
    }

    // Update product budget
    productBudget = await ProductBudget.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: productBudget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update product budget',
      error: error.message
    });
  }
};

/**
 * @desc    Delete product budget
 * @route   DELETE /api/productbudgets/:id
 * @access  Private
 */
const deleteProductBudget = async (req, res) => {
  try {
    // Find product budget by ID and user ID
    const productBudget = await ProductBudget.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!productBudget) {
      return res.status(404).json({
        success: false,
        message: 'Product budget not found or you are not authorized to delete it'
      });
    }

    // Remove product budget
    await productBudget.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product budget deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete product budget',
      error: error.message
    });
  }
};

/**
 * @desc    Update saved amount for a product budget
 * @route   PATCH /api/productbudgets/:id/amount
 * @access  Private
 */
const updateSavedAmount = async (req, res) => {
  try {
    // Validate request data
    if (req.body.savedAmount === undefined || isNaN(Number(req.body.savedAmount))) {
      return res.status(400).json({ message: 'Valid saved amount is required' });
    }

    const savedAmount = Number(req.body.savedAmount);
    
    // Find product budget by ID and user ID
    let productBudget = await ProductBudget.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!productBudget) {
      return res.status(404).json({
        success: false,
        message: 'Product budget not found or you are not authorized to update it'
      });
    }

    // Update saved amount
    productBudget = await ProductBudget.findByIdAndUpdate(
      req.params.id,
      { savedAmount },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: productBudget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update saved amount',
      error: error.message
    });
  }
};

/**
 * @desc    Get summary statistics for all product budgets of a user
 * @route   GET /api/productbudgets/summary
 * @access  Private
 */
const getProductBudgetsSummary = async (req, res) => {
  try {
    const summary = await ProductBudgetService.getProductBudgetsSummary(req.user.id);
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product budgets summary',
      error: error.message
    });
  }
};

module.exports = {
  createProductBudget,
  getProductBudgets,
  getProductBudgetById,
  updateProductBudget,
  deleteProductBudget,
  updateSavedAmount,
  getProductBudgetsSummary
};
