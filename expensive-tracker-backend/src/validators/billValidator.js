const { body, validationResult } = require('express-validator');
const { BILL_CATEGORIES } = require('../config/constants');

// Same shape the other validators use: the reasons go in `error` so the UI can
// show them, with the structured list alongside.
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array().map(e => e.msg).join(', '),
      details: errors.array()
    });
  }
  next();
};

const name = body('name')
  .trim().notEmpty().withMessage('Bill name is required')
  .isLength({ max: 80 }).withMessage('Bill name cannot be more than 80 characters');

const provider = body('provider')
  .trim().notEmpty().withMessage('Provider is required')
  .isLength({ max: 80 }).withMessage('Provider cannot be more than 80 characters');

const category = body('category')
  .isIn(BILL_CATEGORIES).withMessage(`Category must be one of: ${BILL_CATEGORIES.join(', ')}`);

const amount = body('amount')
  .isFloat({ gt: 0 }).withMessage('Amount must be greater than 0');

const dueDate = body('dueDate')
  .isISO8601().withMessage('A valid due date is required');

const validateBillCreate = [name, provider, category, amount, dueDate, handleValidationErrors];

const validateBillUpdate = [
  name.optional(),
  provider.optional(),
  category.optional(),
  amount.optional(),
  dueDate.optional(),
  handleValidationErrors
];

module.exports = { validateBillCreate, validateBillUpdate };
