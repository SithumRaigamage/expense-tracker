const mongoose = require('mongoose');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * Middleware to validate MongoDB ObjectId
 * @param {string} paramName - Name of the parameter to validate (default: 'id')
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError(`Invalid ${paramName} format`);
    }
    
    next();
  };
};

/**
 * Middleware to check if a resource belongs to the authenticated user
 * @param {Object} Model - Mongoose model to query
 * @param {string} paramName - Name of the parameter containing resource ID (default: 'id')
 * @param {string} errorMessage - Custom error message if resource not found
 */
const checkResourceOwnership = (Model, paramName = 'id', errorMessage = 'Resource not found or access denied') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const userId = req.user.id;

      const resource = await Model.findOne({
        _id: resourceId,
        user: userId
      });

      if (!resource) {
        throw new NotFoundError(errorMessage);
      }

      // Attach resource to request for use in controller
      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to sanitize user input
 * Removes potentially dangerous characters
 */
const sanitizeValue = value => {
  if (typeof value === 'string') {
    return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
  }
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, sanitizeValue(child)]));
  }
  return value;
};

const sanitizeInput = (req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);

  next();
};

module.exports = {
  validateObjectId,
  checkResourceOwnership,
  sanitizeInput,
  sanitizeValue
};
