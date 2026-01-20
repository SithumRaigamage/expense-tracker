const { body, param, validationResult } = require('express-validator');
const { WALLET_TYPES, CURRENCIES } = require('../config/constants');

// Validation middleware to handle errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
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
  
  handleValidationErrors
];

// Wallet ID validation
const validateWalletId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid wallet ID'),
  
  handleValidationErrors
];

module.exports = {
  validateWalletCreation,
  validateWalletUpdate,
  validateWalletId
};
