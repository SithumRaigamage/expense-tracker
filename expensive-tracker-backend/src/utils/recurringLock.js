const crypto = require('crypto');
const mongoose = require('mongoose');

const LOCK_ID = 'recurring-expenses';
const LEASE_MS = 10 * 60 * 1000;

/**
 * Serialises recurring-expense runs across API processes and cron invocations.
 * The lease prevents a crashed process from blocking future runs forever.
 */
const withRecurringLock = async (work) => {
  const owner = crypto.randomUUID();
  const now = new Date();
  const lockUntil = new Date(now.getTime() + LEASE_MS);
  const collection = mongoose.connection.collection('scheduler_locks');
  let claimed;
  try {
    claimed = await collection.findOneAndUpdate(
      {
        _id: LOCK_ID,
        $or: [{ lockUntil: { $lte: now } }, { lockUntil: { $exists: false } }]
      },
      { $set: { owner, lockUntil } },
      { upsert: true, returnDocument: 'after' }
    );
  } catch (error) {
    // Two processes can race while creating the lock document; the unique _id
    // makes one lose that race, which is equivalent to a skipped run.
    if (error?.code !== 11000) throw error;
    return { skipped: true };
  }

  if (!claimed || claimed.owner !== owner) {
    return { skipped: true };
  }

  try {
    return await work();
  } finally {
    await collection.deleteOne({ _id: LOCK_ID, owner });
  }
};

module.exports = { withRecurringLock };
