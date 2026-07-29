const { body, validationResult } = require('express-validator');
const { FEEDBACK_CATEGORIES } = require('../config/constants');

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

const validateFeedbackCreate = [
  body('category')
    .isIn(FEEDBACK_CATEGORIES)
    .withMessage(`Category must be one of: ${FEEDBACK_CATEGORIES.join(', ')}`),
  body('title')
    .trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 120 }).withMessage('Title cannot be more than 120 characters'),
  // Mirrors the form's own rule, so the client and server agree on "too short".
  body('description')
    .trim()
    .isLength({ min: 20 }).withMessage('Description must be at least 20 characters')
    .isLength({ max: 4000 }).withMessage('Description cannot be more than 4000 characters'),
  body('sentiment')
    .isInt({ min: 1, max: 5 }).withMessage('Sentiment must be between 1 and 5'),
  body('rating')
    .optional().isInt({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
  handleValidationErrors
];

module.exports = { validateFeedbackCreate };
