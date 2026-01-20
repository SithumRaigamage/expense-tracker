/**
 * Standardized response formatting utilities
 */

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Optional success message
 */
const successResponse = (res, data, statusCode = 200, message = null) => {
  const response = {
    success: true
  };

  if (message) {
    response.message = message;
  }

  if (data !== undefined && data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Response data array
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const paginatedResponse = (res, data, page, limit, total, statusCode = 200) => {
  const totalPages = Math.ceil(total / limit);

  return res.status(statusCode).json({
    success: true,
    count: data.length,
    total,
    pagination: {
      page,
      limit,
      pages: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    data
  });
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} error - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} details - Optional error details
 */
const errorResponse = (res, error, statusCode = 500, details = null) => {
  const response = {
    success: false,
    error
  };

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a created response
 * @param {Object} res - Express response object
 * @param {Object} data - Created resource data
 * @param {string} message - Optional success message
 */
const createdResponse = (res, data, message = 'Resource created successfully') => {
  return successResponse(res, data, 201, message);
};

/**
 * Send a no content response
 * @param {Object} res - Express response object
 */
const noContentResponse = (res) => {
  return res.status(204).send();
};

module.exports = {
  successResponse,
  paginatedResponse,
  errorResponse,
  createdResponse,
  noContentResponse
};
