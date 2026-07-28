const { body } = require('express-validator');
const { CATEGORY_TYPES } = require('../config/constants');
const { handleValidation } = require('../middleware/authValidators');

/**
 * These routes previously accepted any body at all, leaving Mongoose schema
 * errors as the only guard — which surface as 500-shaped failures rather than a
 * clear 400 naming the field.
 */
const validateCategoryCreate = [
  body('name')
    .isString().withMessage('Category name must be text').bail()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Category name must be between 1 and 50 characters'),
  body('type')
    .isIn(CATEGORY_TYPES).withMessage(`Category type must be one of: ${CATEGORY_TYPES.join(', ')}`),
  body('color')
    .optional()
    .isString().withMessage('Colour must be text').bail()
    .matches(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i).withMessage('Colour must be a hex value such as #4CAF50'),
  body('icon')
    .optional()
    .isString().withMessage('Icon must be text').bail()
    .trim()
    .isLength({ max: 50 }).withMessage('Icon name is too long'),
  handleValidation
];

// Updates are partial: validate what is present, require nothing.
const validateCategoryUpdate = [
  body('name')
    .optional()
    .isString().withMessage('Category name must be text').bail()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Category name must be between 1 and 50 characters'),
  body('type')
    .optional()
    .isIn(CATEGORY_TYPES).withMessage(`Category type must be one of: ${CATEGORY_TYPES.join(', ')}`),
  body('color')
    .optional()
    .isString().withMessage('Colour must be text').bail()
    .matches(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i).withMessage('Colour must be a hex value such as #4CAF50'),
  handleValidation
];

module.exports = { validateCategoryCreate, validateCategoryUpdate };
