const { body, param, validationResult } = require('express-validator');
const { CURRENCIES } = require('../config/constants');

// Validation middleware to handle errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Surface the actual reasons in `error`. It used to say "Validation failed"
    // with the useful text buried in `details`, so the UI showed users a message
    // that told them nothing about which field was wrong.
    return res.status(400).json({
      success: false,
      error: errors.array().map(e => e.msg).join(', '),
      details: errors.array()
    });
  }
  next();
};

// Wallet creation validation
const validateWalletCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Wallet name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Wallet name must be between 1 and 50 characters'),
  
  body('type')
    .isIn(['cash', 'bank', 'credit', 'savings', 'crypto', 'investment', 'loan', 'emergencyfund'])
    .withMessage('Invalid wallet type'),
  
  body('balance')
    .optional()
    .isNumeric()
    .withMessage('Balance must be a number')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Balance cannot be negative');
      }
      return true;
    }),
  
  body('currency')
    .optional()
    .isIn(CURRENCIES)
    .withMessage('Invalid currency'),
  
  body('paymentMethod')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Payment method cannot be more than 30 characters'),
  
  handleValidationErrors
];

// Wallet update validation
const validateWalletUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid wallet ID'),
  
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Wallet name cannot be empty')
    .isLength({ min: 1, max: 50 })
    .withMessage('Wallet name must be between 1 and 50 characters'),
  
  body('type')
    .optional()
    .isIn(['cash', 'bank', 'credit', 'savings', 'crypto', 'investment', 'loan', 'emergencyfund'])
    .withMessage('Invalid wallet type'),
  
  body('balance')
    .optional()
    .isNumeric()
    .withMessage('Balance must be a number')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Balance cannot be negative');
      }
      return true;
    }),
  
  body('currency')
    .optional()
    .isIn(CURRENCIES)
    .withMessage('Invalid currency'),
  
  body('paymentMethod')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Payment method cannot be more than 30 characters'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  body('targetAmount')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Target amount cannot be negative'),

  body('monthlyTarget')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Monthly target cannot be negative'),
  
  handleValidationErrors
];

// Wallet ID validation
const validateWalletId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid wallet ID'),
  
  handleValidationErrors
];

/**
 * Transfers move money between two balances, so every field is checked before
 * the service runs. `amount` in particular: it arrived unvalidated, and a JSON
 * string such as "100" was subtracted numerically from one wallet but
 * string-concatenated onto the other (500 + "100" = "500100"). toFloat()
 * hands the service a real number.
 */
const validateTransfer = [
  body('fromWalletId')
    .isMongoId()
    .withMessage('A valid source wallet is required'),

  body('toWalletId')
    .isMongoId()
    .withMessage('A valid destination wallet is required'),

  body('amount')
    .isFloat({ gt: 0, max: 1e12 })
    .withMessage('Transfer amount must be a number greater than zero')
    .bail()
    .toFloat(),

  // The dialog sends null or '' when the field is left empty.
  body('description')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Description must be text')
    .bail()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters'),

  handleValidationErrors
];

module.exports = {
  validateTransfer,
  validateWalletCreation,
  validateWalletUpdate,
  validateWalletId
};
