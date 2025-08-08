const express = require('express');
const router = express.Router();
const {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getMonthlyExpenses,
  getMonthlyStats
} = require('../controllers/expenseController');

const { protect } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

// Special routes (must come before /:id routes)
router.get('/stats/summary', getExpenseStats);
router.get('/monthly', getMonthlyExpenses);
router.get('/monthly-stats', getMonthlyStats);

// Main CRUD routes
router.route('/')
  .get(getExpenses)
  .post(createExpense);

router.route('/:id')
  .get(getExpense)
  .put(updateExpense)
  .delete(deleteExpense);

module.exports = router;
