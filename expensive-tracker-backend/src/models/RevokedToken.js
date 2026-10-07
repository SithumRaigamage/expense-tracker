const mongoose = require('mongoose');

/**
 * Denylist of session tokens ended before their natural expiry (logout).
 *
 * A JWT is valid until its `exp` no matter what the server does, so logging out
 * used to only clear the browser's cookie — a copied token kept working for up
 * to 30 days (audit finding H6). Each token now carries a unique `jti`; logout
 * records it here and `protect` rejects any token whose `jti` is listed.
 *
 * Entries are only needed until the token would have expired anyway. The TTL
 * index lets MongoDB delete them at that moment, so the collection holds at
 * most one row per session that was logged out within the token lifetime.
 */
const revokedTokenSchema = new mongoose.Schema({
  jti: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RevokedToken', revokedTokenSchema);
