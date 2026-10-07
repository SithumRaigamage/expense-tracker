/**
 * Session cookie handling.
 *
 * The token used to be handed to the browser in the response body and kept in
 * localStorage, where any injected script could read it. It travels as an
 * httpOnly cookie now, so JavaScript cannot see it at all.
 *
 * SameSite=Strict is what stands in for a CSRF token here: the browser simply
 * won't attach the cookie to a request originating from another site, so a
 * forged form post arrives unauthenticated. That holds because the API is
 * served from the same origin as the app (environment.prod.ts already points at
 * a relative /api/v1). Splitting them across domains would force SameSite=None
 * and this file would need a real CSRF token to go with it.
 */

const COOKIE_NAME = 'token';

/**
 * Session lifetime from JWT_EXPIRE (JWT_EXPIRES_IN is accepted as an alias).
 *
 * This is the single source for BOTH the cookie's maxAge and the token's `exp`.
 * They used to read different variables — the token only JWT_EXPIRES_IN, which
 * nothing set — so JWT_EXPIRE=1h shortened the cookie while the token inside
 * stayed valid for 30 days (audit finding H6).
 */
const parseMaxAgeMs = () => {
  const raw = (process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '30d').trim();
  const match = /^(\d+)([smhd])?$/.exec(raw);

  if (!match) {
    return 30 * 24 * 60 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2] || 's';
  const multiplier = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];

  return value * multiplier;
};

/** Token lifetime in whole seconds, for jwt.sign's `expiresIn`. */
const tokenLifetimeSeconds = () => Math.floor(parseMaxAgeMs() / 1000);

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'strict',
  // Secure would make the cookie undeliverable over plain http, which is what
  // local development and the test suite run on.
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: parseMaxAgeMs()
});

const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, cookieOptions());
};

const clearAuthCookie = (res) => {
  const options = cookieOptions();
  delete options.maxAge;
  res.clearCookie(COOKIE_NAME, options);
};

module.exports = { COOKIE_NAME, setAuthCookie, clearAuthCookie, parseMaxAgeMs, tokenLifetimeSeconds };
