/**
 * Turns the TRUST_PROXY environment variable into Express's `trust proxy`
 * setting (https://expressjs.com/en/guide/behind-proxies.html).
 *
 * Behind nginx, an untrusted proxy makes every request look like it came from
 * nginx itself: `req.ip` is the proxy's address, so the per-IP rate limiters
 * collapse into one bucket shared by every user — ten failed logins from
 * anyone locked *everyone* out (audit finding H3). `req.protocol` also reads
 * `http` behind a TLS terminator.
 *
 * It stays off unless configured, because trusting a proxy that is not there
 * lets any client spoof its address with an X-Forwarded-For header.
 *
 * Accepted values:
 *   unset / "" / "false"   -> false (no proxy; direct connections)
 *   "true"                 -> true  (trust every hop — only behind a proxy you fully control)
 *   "1", "2", …            -> number of proxy hops to trust (recommended: 1 behind nginx)
 *   anything else          -> passed through, e.g. "loopback" or "10.0.0.0/8, uniquelocal"
 *
 * @param {string|undefined} value
 * @returns {boolean|number|string}
 */
const parseTrustProxy = (value) => {
  if (value === undefined) {
    return false;
  }

  const trimmed = String(value).trim();

  if (trimmed === '' || trimmed.toLowerCase() === 'false') {
    return false;
  }

  if (trimmed.toLowerCase() === 'true') {
    return true;
  }

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed;
};

module.exports = { parseTrustProxy };
