const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const WINDOW_MINUTES = parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15;
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100;

// Tests fire many requests in a row; limiting them turns real assertions into 429s.
const skip = () => process.env.NODE_ENV === 'test';

const handler = (req, res, next, options) => {
  logger.warn('Rate limit exceeded', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  res.status(options.statusCode).json({
    success: false,
    error: options.message
  });
};

/**
 * Baseline limit for the whole API. Generous enough that normal dashboard use
 * (several widgets loading at once) never trips it.
 */
const apiLimiter = rateLimit({
  windowMs: WINDOW_MINUTES * 60 * 1000,
  max: MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests. Please try again later.',
  skip,
  handler
});

/**
 * Credential endpoints get a much tighter budget — without it, login is an
 * unlimited password-guessing oracle. Successful logins are not counted, so a
 * legitimate user is never locked out by their own activity.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  skip,
  handler
});

module.exports = { apiLimiter, authLimiter };
