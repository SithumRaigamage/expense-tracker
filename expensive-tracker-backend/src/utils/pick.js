/**
 * Returns a copy of `source` containing only the listed keys that are actually
 * present (undefined values are dropped, so partial updates stay partial).
 *
 * Used at the HTTP boundary to allow-list client-writable fields. Passing
 * req.body straight to Mongoose let a client set fields the UI never exposes —
 * `user` most damagingly, which moved a record into another account
 * (audit finding H1).
 *
 * @param {Object} source - Usually req.body
 * @param {string[]} keys - Fields the client may write
 * @returns {Object}
 */
const pick = (source, keys) => {
  const result = {};
  if (!source || typeof source !== 'object') {
    return result;
  }

  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
      result[key] = source[key];
    }
  });

  return result;
};

module.exports = pick;
