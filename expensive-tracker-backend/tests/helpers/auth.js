const { COOKIE_NAME } = require('../../src/utils/authCookie');

/**
 * Pulls the session token out of a register/login response.
 *
 * The token is no longer in the response body — it is set as an httpOnly
 * cookie, which is the point. Reading it from Set-Cookie keeps the existing
 * bearer-header suites working while also asserting, on every call, that the
 * cookie was issued at all.
 */
const tokenFromResponse = (res) => {
  const raw = res.headers['set-cookie'] || [];
  const cookie = raw.find(c => c.startsWith(`${COOKIE_NAME}=`));

  if (!cookie) {
    throw new Error(`No ${COOKIE_NAME} cookie on the response (status ${res.status})`);
  }

  return decodeURIComponent(cookie.split(';')[0].split('=')[1]);
};

/** The raw `name=value` pair, for tests that want to send the cookie back. */
const cookieFromResponse = (res) => {
  const raw = res.headers['set-cookie'] || [];
  const cookie = raw.find(c => c.startsWith(`${COOKIE_NAME}=`));
  return cookie ? cookie.split(';')[0] : null;
};

module.exports = { tokenFromResponse, cookieFromResponse };
