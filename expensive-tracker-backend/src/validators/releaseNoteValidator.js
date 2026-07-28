const { body } = require('express-validator');
const { handleValidation } = require('../middleware/authValidators');

/**
 * Admin-only endpoints, but "admin" is not the same as "trusted to send a
 * well-formed body" — an unvalidated version string or date reaches Mongoose and
 * fails as a 500-shaped error instead of a 400 naming the field.
 */
const validateReleaseNoteCreate = [
  body('version')
    .isString().withMessage('Version must be text').bail()
    .trim()
    .matches(/^\d+\.\d+\.\d+([-+][\w.]+)?$/).withMessage('Version must look like 1.2.3'),
  body('releaseDate')
    .isISO8601().withMessage('Release date must be a valid date'),
  body('title')
    .optional()
    .isString().withMessage('Title must be text').bail()
    .trim()
    .isLength({ max: 120 }).withMessage('Title is too long'),
  body('description')
    .optional()
    .isString().withMessage('Description must be text'),
  handleValidation
];

const validateReleaseNoteUpdate = [
  body('version')
    .optional()
    .isString().withMessage('Version must be text').bail()
    .trim()
    .matches(/^\d+\.\d+\.\d+([-+][\w.]+)?$/).withMessage('Version must look like 1.2.3'),
  body('releaseDate')
    .optional()
    .isISO8601().withMessage('Release date must be a valid date'),
  body('title')
    .optional()
    .isString().withMessage('Title must be text').bail()
    .trim()
    .isLength({ max: 120 }).withMessage('Title is too long'),
  handleValidation
];

module.exports = { validateReleaseNoteCreate, validateReleaseNoteUpdate };
