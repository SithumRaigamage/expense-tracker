const express = require('express');
const router = express.Router();
const { 
  createProductBudget, 
  getProductBudgets, 
  getProductBudgetById, 
  updateProductBudget, 
  deleteProductBudget,
  updateSavedAmount,
  contributeToProductBudget,
  getProductBudgetsSummary
} = require('../controllers/productBudgetController');
const { protect } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(protect);

router.route('/')
  .post(createProductBudget)
  .get(getProductBudgets);

router.route('/summary')
  .get(getProductBudgetsSummary);

// Validate the id up front so a malformed one returns 400 like every other
// resource, instead of surfacing a Mongoose CastError as a misleading 404.
router.route('/:id')
  .get(validateObjectId(), getProductBudgetById)
  .put(validateObjectId(), updateProductBudget)
  .delete(validateObjectId(), deleteProductBudget);

router.route('/:id/amount')
  .patch(validateObjectId(), updateSavedAmount);

// Funding a goal moves money and must not be split across two client calls.
router.route('/:id/contribute')
  .post(validateObjectId(), contributeToProductBudget);

module.exports = router;
