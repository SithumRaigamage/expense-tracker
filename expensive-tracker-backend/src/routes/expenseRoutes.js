const express = require('express');
const router = express.Router();

// Import controller methods (to be created)
// const {
//   getExpenses,
//   getExpense,
//   createExpense,
//   updateExpense,
//   deleteExpense,
//   getExpenseStats
// } = require('../controllers/expenseController');

// Routes
router.route('/')
  .get((req, res) => res.json({ message: 'Get all expenses' }))
  .post((req, res) => res.json({ message: 'Create expense' }));

router.route('/:id')
  .get((req, res) => res.json({ message: `Get expense ${req.params.id}` }))
  .put((req, res) => res.json({ message: `Update expense ${req.params.id}` }))
  .delete((req, res) => res.json({ message: `Delete expense ${req.params.id}` }));

router.get('/stats/summary', (req, res) => res.json({ message: 'Get expense statistics' }));

module.exports = router;
