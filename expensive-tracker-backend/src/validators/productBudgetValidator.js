const Joi = require('joi');

const validateProductBudget = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).required().messages({
      'string.base': 'Product name must be a string',
      'string.empty': 'Product name is required',
      'string.min': 'Product name must be at least 3 characters long',
      'any.required': 'Product name is required'
    }),
    imageUrl: Joi.string().allow('').optional(),
    targetAmount: Joi.number().positive().required().messages({
      'number.base': 'Target amount must be a number',
      'number.positive': 'Target amount must be greater than 0',
      'any.required': 'Target amount is required'
    }),
    savedAmount: Joi.number().min(0).default(0).messages({
      'number.base': 'Saved amount must be a number',
      'number.min': 'Saved amount cannot be negative'
    }),
    targetDate: Joi.date().required().messages({
      'date.base': 'Target date must be a valid date',
      'any.required': 'Target date is required'
    }),
    isActive: Joi.boolean().default(true)
  });

  return schema.validate(data);
};

const validateProductBudgetUpdate = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).optional().messages({
      'string.base': 'Product name must be a string',
      'string.min': 'Product name must be at least 3 characters long'
    }),
    imageUrl: Joi.string().allow('').optional(),
    targetAmount: Joi.number().positive().optional().messages({
      'number.base': 'Target amount must be a number',
      'number.positive': 'Target amount must be greater than 0'
    }),
    savedAmount: Joi.number().min(0).optional().messages({
      'number.base': 'Saved amount must be a number',
      'number.min': 'Saved amount cannot be negative'
    }),
    targetDate: Joi.date().optional().messages({
      'date.base': 'Target date must be a valid date'
    }),
    isActive: Joi.boolean().optional()
  });

  return schema.validate(data);
};

module.exports = {
  validateProductBudget,
  validateProductBudgetUpdate
};
