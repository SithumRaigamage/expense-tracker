const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

const GENERIC_SERVER_ERROR = 'Server Error';

/**
 * Maps a thrown error to an HTTP status and a client-safe message.
 *
 * Order matters: the most specific signal wins.
 */
const classify = (err, res) => {
  if (err instanceof AppError) {
    return { statusCode: err.statusCode, message: err.message };
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return { statusCode: 404, message: 'Resource not found' };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return { statusCode: 400, message: `Duplicate field value: ${field}. Please use another value` };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    return {
      statusCode: 400,
      message: Object.values(err.errors).map(val => val.message).join(', ')
    };
  }

  if (err.name === 'JsonWebTokenError') {
    return { statusCode: 401, message: 'Invalid token' };
  }

  if (err.name === 'TokenExpiredError') {
    return { statusCode: 401, message: 'Token expired' };
  }

  if (err.name === 'MulterError') {
    return {
      statusCode: 400,
      message: err.code === 'LIMIT_FILE_SIZE'
        ? 'File size is too large. Maximum size is 5MB'
        : 'File upload error'
    };
  }

  // http-errors from Express/body-parser, e.g. malformed JSON (400) or an
  // oversized body (413). `expose` is their own flag for "safe to show".
  const httpStatus = err.status || err.statusCode;
  if (Number.isInteger(httpStatus) && httpStatus >= 400 && httpStatus < 500 && err.expose !== false) {
    return { statusCode: httpStatus, message: err.message };
  }

  // A handler that set a 4xx before throwing — `res.status(404); throw new
  // Error(...)` in notFound and the release-note controller. This used to be
  // ignored, so every unknown route and missing release note answered 500.
  if (res.statusCode >= 400 && res.statusCode < 500) {
    return { statusCode: res.statusCode, message: err.message };
  }

  return { statusCode: 500, message: err.message };
};

// Express identifies error middleware by its four-argument signature, so
// `next` must stay even though it is unused.
const errorHandler = (err, req, res, next) => {
  const { statusCode, message } = classify(err, res);
  const isServerError = statusCode >= 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  const logMeta = {
    message: err.message,
    statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  };

  if (isServerError) {
    // The full detail stays on the server, where it belongs.
    logger.error('Unhandled error', { ...logMeta, stack: err.stack });
  } else {
    logger.warn('Request failed', logMeta);
  }

  res.status(statusCode).json({
    success: false,
    // Unexpected errors carry internals ("Cannot read properties of null…",
    // driver messages, paths). Outside development the client gets a generic
    // message; 4xx messages are written for users and are always returned.
    error: isServerError && !isDevelopment ? GENERIC_SERVER_ERROR : (message || GENERIC_SERVER_ERROR),
    ...(isDevelopment && { stack: err.stack })
  });
};

module.exports = errorHandler;
