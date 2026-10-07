const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Multi-document transactions for money operations.
 *
 * A transfer, a bill payment or an expense touches more than one document, and
 * either all of those writes should land or none. MongoDB only offers that on a
 * replica set (or sharded cluster); a standalone server rejects transactions.
 * The bundled compose files run a single-node replica set for this reason.
 *
 * On a standalone server the work still runs, without a transaction. It isn't
 * silent: a warning is logged once. Balances stay correct under concurrency
 * either way, because every balance change is a single atomic `$inc` with its
 * guard in the same filter (see WalletService.updateBalance), never a
 * read-modify-save.
 */

let transactionsSupported;

const supportsTransactions = async () => {
  if (transactionsSupported === undefined) {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    transactionsSupported = Boolean(hello.setName) || hello.msg === 'isdbgrid';

    if (!transactionsSupported) {
      logger.warn(
        'MongoDB is a standalone server, so multi-document money operations run without ' +
        'transactions. Run MongoDB as a replica set (the compose files do) for all-or-nothing writes.'
      );
    }
  }
  return transactionsSupported;
};

/**
 * Runs `work(options)` atomically where the server allows it.
 *
 * `options` is `{ session }` inside a transaction and `{}` without one. Pass it
 * to every read and write in `work`. `work` may run more than once: the driver
 * retries the whole transaction on transient errors such as write conflicts, so
 * it must not have side effects outside the database.
 *
 * @template T
 * @param {(options: { session?: import('mongoose').ClientSession }) => Promise<T>} work
 * @returns {Promise<T>} Whatever `work` returns
 */
const runInTransaction = async (work) => {
  if (!(await supportsTransactions())) {
    return work({});
  }
  return mongoose.connection.transaction(session => work({ session }));
};

module.exports = { runInTransaction };
