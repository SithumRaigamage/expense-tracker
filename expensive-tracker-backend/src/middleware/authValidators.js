const { body, validationResult } = require('express-validator');
const { BadRequestError } = require('../utils/errors');

/**
 * Turns express-validator failures into the API's standard error shape.
 */
const handleValidation = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const message = result
    .array()
    .map(error => error.msg)
    .join(', ');

  next(new BadRequestError(message));
};

/**
 * `isEmail()`/`isString()` also pin these fields to strings, which is what stops
 * an object such as {"$gt": ""} from ever reaching the user lookup.
 */
const validateRegister = [
  body('name')
    .isString().withMessage('Name must be text').bail()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isString().withMessage('Email must be text').bail()
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isString().withMessage('Password must be text').bail()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  handleValidation
];

const validateLogin = [
  body('email')
    .isString().withMessage('Please provide a valid email address').bail()
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isString().withMessage('Please provide a password').bail()
    .notEmpty().withMessage('Please provide a password'),
  handleValidation
];

const validatePasswordChange = [
  body('currentPassword')
    .isString().withMessage('Please provide your current password').bail()
    .notEmpty().withMessage('Please provide your current password'),
  body('newPassword')
    .isString().withMessage('Password must be text').bail()
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  handleValidation
];

module.exports = {
  handleValidation,
  validateRegister,
  validateLogin,
  validatePasswordChange
};
