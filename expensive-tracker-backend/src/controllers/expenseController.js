const asyncHandler = require('express-async-handler');
const ExpenseService = require('../services/expenseService');
const { successResponse, createdResponse } = require('../utils/responseFormatter');

/**
 * @desc    Get all expenses
 * @route   GET /api/v1/expenses
 * @access  Private
 */
const getExpenses = asyncHandler(async (req, res) => {
  const result = await ExpenseService.getExpenses(req.user.id, req.query);
  
  // successResponse handles meta/pagination if valid format
  successResponse(res, result.expenses, 200, 'Expenses retrieved successfully', result.pagination);
});

/**
 * @desc    Get single expense
 * @route   GET /api/v1/expenses/:id
 * @access  Private
 */
const getExpense = asyncHandler(async (req, res) => {
  const expense = await ExpenseService.getExpense(req.params.id, req.user.id);
  
  successResponse(res, expense);
});

/**
 * @desc    Create new expense
 * @route   POST /api/v1/expenses
 * @access  Private
 */
const createExpense = asyncHandler(async (req, res) => {
  const expense = await ExpenseService.createExpense(req.body, req.user.id);
  
  createdResponse(res, expense, 'Expense created successfully');
});

/**
 * @desc    Update expense
 * @route   PUT /api/v1/expenses/:id
 * @access  Private
 */
const updateExpense = asyncHandler(async (req, res) => {
  const expense = await ExpenseService.updateExpense(
    req.params.id,
    req.user.id,
    req.body
  );
  
  successResponse(res, expense, 200, 'Expense updated successfully');
});

/**
 * @desc    Delete expense
 * @route   DELETE /api/v1/expenses/:id
 * @access  Private
 */
const deleteExpense = asyncHandler(async (req, res) => {
  await ExpenseService.deleteExpense(req.params.id, req.user.id);
  
  successResponse(res, {}, 200, 'Expense deleted successfully');
});

/**
 * @desc    Get expense summary statistics
 * @route   GET /api/v1/expenses/stats/summary
 * @access  Private
 */
const getExpenseStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await ExpenseService.getExpenseStats(req.user.id, { startDate, endDate });
  
  successResponse(res, stats);
});

/**
 * @desc    Get expenses for a specific month
 * @route   GET /api/v1/expenses/monthly
 * @access  Private
 */
const getMonthlyExpenses = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  const currentYear = year || new Date().getFullYear();
  const currentMonth = month ? parseInt(month) - 1 : new Date().getMonth(); // 0-based
  
  // Create start and end date for that month
  const startDate = new Date(currentYear, currentMonth, 1);
  const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59); // Last day of month
  
  // Reuse getExpenses with forced date range
  const query = {
    ...req.query,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
  
  const result = await ExpenseService.getExpenses(req.user.id, query);
  
  successResponse(res, result.expenses, 200, `Expenses for ${startDate.toLocaleString('default', { month: 'long', year: 'numeric' })} retrieved`, result.pagination);
});

/**
 * @desc    Get monthly stats (breakdown by month for a year)
 * @route   GET /api/v1/expenses/monthly-stats
 * @access  Private
 */
const getMonthlyStats = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const stats = await ExpenseService.getMonthlyStats(req.user.id, year);
  
  successResponse(res, stats);
});

module.exports = {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getMonthlyExpenses,
  getMonthlyStats
};
