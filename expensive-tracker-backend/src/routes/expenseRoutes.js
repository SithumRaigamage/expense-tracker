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
const { validateObjectId } = require('../middleware/validation');
const upload = require('../middleware/fileUpload');
const { scanReceipt } = require('../controllers/receiptController');

// Apply auth middleware to all routes
router.use(protect);

// Special routes (must come before /:id routes)
router.get('/stats/summary', getExpenseStats);
router.get('/monthly', getMonthlyExpenses);
router.get('/monthly-stats', getMonthlyStats);

// Receipt OCR: upload an image, get back pre-filled expense fields
router.post('/receipt/scan', upload.single('receipt'), scanReceipt);

// Main CRUD routes
router.route('/')
  .get(getExpenses)
  .post(createExpense);

// Validate the id first so a malformed one is a 400, matching wallets and
// product budgets, instead of a Mongoose CastError surfacing as a 404.
router.route('/:id')
  .get(validateObjectId(), getExpense)
  .put(validateObjectId(), updateExpense)
  .delete(validateObjectId(), deleteExpense);

module.exports = router;
