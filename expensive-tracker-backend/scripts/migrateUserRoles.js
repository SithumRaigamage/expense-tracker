/**
 * One-off migration for audit finding C1 (docs/audit/01-critical-security.md).
 *
 * `role` used to double as a free-text job title, so existing users may hold
 * values like "Software Engineer". `role` is now an enum ('user' | 'admin'), and
 * documents with any other value fail validation on their next save() — which
 * would break, for example, changing a password.
 *
 * This script:
 *   1. moves every non-enum role into `occupation` (unless one is already set)
 *      and resets the role to 'user';
 *   2. lists every account that currently holds 'admin', because anyone could
 *      self-assign it before the fix. Review that list by hand and demote any
 *      account that should not be there:
 *        db.users.updateOne({ email: "..." }, { $set: { role: "user" } })
 *
 * Safe to run more than once. Use --dry-run to preview without writing.
 *
 *   node scripts/migrateUserRoles.js [--dry-run]
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { USER_ROLES } = require('../src/config/constants');

const dryRun = process.argv.includes('--dry-run');

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  // Raw collection access: the model's enum would reject the very documents
  // this script exists to repair.
  const users = mongoose.connection.collection('users');

  const legacy = await users
    .find({ role: { $nin: USER_ROLES } }, { projection: { email: 1, role: 1, occupation: 1 } })
    .toArray();

  console.log(`${legacy.length} user(s) with a non-standard role${dryRun ? ' (dry run)' : ''}`);

  for (const user of legacy) {
    const occupation = user.occupation || (typeof user.role === 'string' ? user.role.slice(0, 50) : '');
    console.log(`  ${user.email}: role "${user.role}" -> occupation "${occupation}", role "user"`);

    if (!dryRun) {
      await users.updateOne({ _id: user._id }, { $set: { role: 'user', occupation } });
    }
  }

  const admins = await users.find({ role: 'admin' }, { projection: { email: 1, updatedAt: 1 } }).toArray();
  console.log(`\n${admins.length} admin account(s) — verify each one is legitimate:`);
  admins.forEach(a => console.log(`  ${a.email} (last updated ${a.updatedAt ? a.updatedAt.toISOString() : 'unknown'})`));
};

run()
  .catch(err => {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
