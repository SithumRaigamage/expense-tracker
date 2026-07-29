const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const logger = require('../utils/logger');

const WINDOW_MINUTES = parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15;

// A single dashboard load fans out to roughly ten endpoints (metrics, wallets,
// transactions, flow, budgets, bills…), so a per-IP budget of 100 would cut off
// an ordinary session after about ten page views — and cut off everyone behind
// one office NAT far sooner. This ceiling still stops scripted abuse.
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX, 10) || 1000;

// Tests fire many requests in a row; limiting them turns real assertions into
// 429s. Keyed off its own flag rather than NODE_ENV so the suite covering this
// middleware can switch it back on (see tests/integration/auth.test.js).
const skip = () => process.env.RATE_LIMIT_DISABLED === 'true';

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

/**
 * Every assistant message is a paid model call, so this is budgeted per user
 * rather than left to the general API limit. Keyed by account, not IP, so one
 * user on a shared network can't exhaust everyone else's allowance.
 *
 * The unauthenticated fallback goes through ipKeyGenerator rather than using
 * req.ip directly. A home IPv6 allocation is a whole block, not one address, so
 * keying on the raw address let a caller spend the budget, move one address
 * along and start again — billions of times over. ipKeyGenerator collapses the
 * address to its /56 block so the whole allocation shares one bucket, and
 * leaves IPv4 addresses untouched. express-rate-limit refuses to accept a
 * custom keyGenerator without it, which is why this warned at every startup.
 */
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  message: 'You are sending messages too quickly. Please wait a moment.',
  skip,
  handler
});

module.exports = { apiLimiter, authLimiter, chatLimiter };
