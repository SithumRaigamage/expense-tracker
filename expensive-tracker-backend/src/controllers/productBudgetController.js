const asyncHandler = require('express-async-handler');
const ProductBudgetService = require('../services/productBudgetService');
const { validateProductBudget, validateProductBudgetUpdate } = require('../validators/productBudgetValidator');
const { successResponse, createdResponse } = require('../utils/responseFormatter');
const { BadRequestError } = require('../utils/errors');

/**
 * @desc    Create a new product budget
 * @route   POST /api/v1/productbudgets
 * @access  Private
 */
const createProductBudget = asyncHandler(async (req, res) => {
  // Validate request data
  const { error } = validateProductBudget(req.body);
  if (error) {
    throw new BadRequestError(error.details[0].message);
  }

  const productBudget = await ProductBudgetService.createProductBudget(req.body, req.user.id);

  createdResponse(res, productBudget);
});

/**
 * @desc    Get all product budgets for current user
 * @route   GET /api/v1/productbudgets
 * @access  Private
 */
const getProductBudgets = asyncHandler(async (req, res) => {
  const productBudgets = await ProductBudgetService.getProductBudgets(req.user.id, req.query);

  successResponse(res, productBudgets, 200, 'Product budgets retrieved successfully', { count: productBudgets.length });
});

/**
 * @desc    Get product budget by ID
 * @route   GET /api/v1/productbudgets/:id
 * @access  Private
 */
const getProductBudgetById = asyncHandler(async (req, res) => {
  const productBudget = await ProductBudgetService.getProductBudgetById(req.params.id, req.user.id);

  successResponse(res, productBudget);
});

/**
 * @desc    Update product budget
 * @route   PUT /api/v1/productbudgets/:id
 * @access  Private
 */
const updateProductBudget = asyncHandler(async (req, res) => {
  // Validate request data
  const { error } = validateProductBudgetUpdate(req.body);
  if (error) {
    throw new BadRequestError(error.details[0].message);
  }

  const productBudget = await ProductBudgetService.updateProductBudget(
    req.params.id,
    req.user.id,
    req.body
  );

  successResponse(res, productBudget, 200, 'Product budget updated successfully');
});

/**
 * @desc    Delete product budget
 * @route   DELETE /api/v1/productbudgets/:id
 * @access  Private
 */
const deleteProductBudget = asyncHandler(async (req, res) => {
  await ProductBudgetService.deleteProductBudget(req.params.id, req.user.id);

  successResponse(res, {}, 200, 'Product budget deleted successfully');
});

/**
 * @desc    Update saved amount for a product budget
 * @route   PATCH /api/v1/productbudgets/:id/amount
 * @access  Private
 */
const updateSavedAmount = asyncHandler(async (req, res) => {
  // Validate request data
  if (req.body.savedAmount === undefined || isNaN(Number(req.body.savedAmount))) {
    throw new BadRequestError('Valid saved amount is required');
  }

  const savedAmount = Number(req.body.savedAmount);
  
  const productBudget = await ProductBudgetService.updateSavedAmount(
    req.params.id,
    req.user.id,
    savedAmount
  );

  successResponse(res, productBudget, 200, 'Saved amount updated successfully');
});

/**
 * @desc    Move money from a wallet into a savings goal, atomically
 * @route   POST /api/v1/productbudgets/:id/contribute
 * @access  Private
 */
const contributeToProductBudget = asyncHandler(async (req, res) => {
  const { walletId, amount } = req.body;

  if (!walletId) {
    throw new BadRequestError('A source wallet is required');
  }

  const result = await ProductBudgetService.contribute(
    req.params.id,
    req.user.id,
    walletId,
    amount
  );

  successResponse(
    res,
    result,
    200,
    result.isFullyFunded ? 'Goal fully funded' : 'Contribution added successfully'
  );
});

/**
 * @desc    Get summary statistics for all product budgets of a user
 * @route   GET /api/v1/productbudgets/stats/summary
 * @access  Private
 */
const getProductBudgetsSummary = asyncHandler(async (req, res) => {
  const summary = await ProductBudgetService.getProductBudgetsSummary(req.user.id);
  
  successResponse(res, summary);
});

module.exports = {
  createProductBudget,
  getProductBudgets,
  getProductBudgetById,
  updateProductBudget,
  deleteProductBudget,
  updateSavedAmount,
  contributeToProductBudget,
  getProductBudgetsSummary
};
