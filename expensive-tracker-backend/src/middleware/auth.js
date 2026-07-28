const jwt = require('jsonwebtoken');
const User = require('../models/User');

const UNAUTHORIZED = {
  success: false,
  error: 'Not authorized to access this route'
};

/**
 * Verifies the bearer token and attaches the owning user to the request.
 *
 * The lookup can legitimately come back empty: a token stays valid for its full
 * lifetime, so one issued before an account was deleted still verifies. Every
 * controller then reads `req.user.id` — 44 call sites — which throws on null and
 * surfaces as a 500 rather than the 401 it actually is. Deactivated accounts had
 * the mirror-image problem: `isActive` was never checked here, so clearing the
 * flag did nothing until the token expired. Both are unauthenticated requests.
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json(UNAUTHORIZED);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || user.isActive === false) {
      return res.status(401).json(UNAUTHORIZED);
    }

    req.user = user;

    next();
  } catch {
    return res.status(401).json(UNAUTHORIZED);
  }
};

// Check if user has admin role
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Admin privileges required'
    });
  }
  next();
};

module.exports = { protect, adminOnly };