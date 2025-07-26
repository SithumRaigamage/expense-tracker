const express = require('express');
const router = express.Router();
const { 
  createProductBudget, 
  getProductBudgets, 
  getProductBudgetById, 
  updateProductBudget, 
  deleteProductBudget,
  updateSavedAmount,
  getProductBudgetsSummary
} = require('../controllers/productBudgetController');
const { protect } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

router.route('/')
  .post(createProductBudget)
  .get(getProductBudgets);
  
router.route('/summary')
  .get(getProductBudgetsSummary);

router.route('/:id')
  .get(getProductBudgetById)
  .put(updateProductBudget)
  .delete(deleteProductBudget);

router.route('/:id/amount')
  .patch(updateSavedAmount);

module.exports = router;
