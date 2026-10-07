const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RevokedToken = require('../models/RevokedToken');
const { COOKIE_NAME } = require('../utils/authCookie');

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
  // The cookie is how the browser authenticates now. The bearer header is kept
  // for non-browser callers — the test suite and any scripted API use — which
  // have no cookie jar and no CSRF exposure to speak of.
  let token = req.cookies?.[COOKIE_NAME];

  if (!token && req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json(UNAUTHORIZED);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Logged out: this exact token was revoked before it expired.
    if (decoded.jti && await RevokedToken.exists({ jti: decoded.jti })) {
      return res.status(401).json(UNAUTHORIZED);
    }

    const user = await User.findById(decoded.id).select('+tokenVersion');

    if (!user || user.isActive === false) {
      return res.status(401).json(UNAUTHORIZED);
    }

    // Issued before the last password change. Tokens minted before `tv`
    // existed count as version 0, so they keep working until they expire or
    // the password changes — whichever comes first.
    if ((decoded.tv || 0) !== (user.tokenVersion || 0)) {
      return res.status(401).json(UNAUTHORIZED);
    }

    req.user = user;
    // Verified claims, for handlers that act on the session itself (logout).
    req.auth = decoded;

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