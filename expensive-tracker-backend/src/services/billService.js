const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const Category = require('../models/Category');
const WalletService = require('./walletService');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');
const { runInTransaction } = require('../utils/transaction');
const { getNextRunDate } = require('../utils/recurrence');

/** The billing anchor for a due date (see Bill.billingDay). */
const billingDayOf = (dueDate) => {
  const date = new Date(dueDate);
  return Number.isNaN(date.getTime()) ? null : date.getUTCDate();
};

/**
 * Service layer for bills.
 *
 * Paying a bill moves money, so `payBill` runs in a transaction like wallet
 * transfers and goal contributions (see utils/transaction.js), and debits the
 * wallet with an atomic, funds-guarded increment.
 */
class BillService {
  static async getBills(userId) {
    return Bill.find({ user: userId, isActive: true }).sort({ dueDate: 1 });
  }

  static async getBill(billId, userId) {
    const bill = await Bill.findOne({ _id: billId, user: userId, isActive: true });
    if (!bill) {
      throw new NotFoundError('Bill not found');
    }
    return bill;
  }

  static async createBill(billData, userId) {
    return Bill.create({ ...billData, billingDay: billingDayOf(billData.dueDate), user: userId });
  }

  static async updateBill(billId, userId, updates) {
    // Ownership and payment state are the server's to decide, not the caller's.
    // The bindings are unused by design — destructuring is what drops them.
    const { user: _user, paidAt: _paidAt, isActive: _isActive, ...safeUpdates } = updates;

    // A due date the user sets is the new billing anchor.
    if (safeUpdates.dueDate !== undefined) {
      safeUpdates.billingDay = billingDayOf(safeUpdates.dueDate);
    }

    const bill = await Bill.findOneAndUpdate(
      { _id: billId, user: userId, isActive: true },
      safeUpdates,
      { new: true, runValidators: true }
    );

    if (!bill) {
      throw new NotFoundError('Bill not found');
    }

    return bill;
  }

  /** Soft delete, matching how wallets are removed. */
  static async deleteBill(billId, userId) {
    const bill = await Bill.findOneAndUpdate(
      { _id: billId, user: userId, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!bill) {
      throw new NotFoundError('Bill not found');
    }

    return bill;
  }

  /**
   * Pays a bill from a wallet: debits the balance and records an expense, so
   * the payment shows up in transactions and the analytics that read them.
   *
   * A subscription rolls forward to next month rather than being marked paid,
   * which is what makes the "Upcoming" list keep working month to month. That
   * also means "already paid" can't be read off the bill, so the caller says
   * which due date it's paying (`expectedDueDate`). The payment is claimed with
   * a conditional update that only matches the bill while it still has that
   * due date, so a double-submit (or a transaction retried after a write
   * conflict) can pay a period once (audit M7). This is optimistic concurrency
   * with a client-supplied version, like an HTTP If-Match.
   *
   * @param {string} billId
   * @param {string} userId
   * @param {string} [walletId] - Defaults to the bill's own wallet
   * @param {string|Date} [expectedDueDate] - The due date being paid; required for a subscription
   */
  static async payBill(billId, userId, walletId, expectedDueDate) {
    return runInTransaction(async (opts) => {
      const bill = await Bill.findOne({ _id: billId, user: userId, isActive: true }, null, opts);
      if (!bill) {
        throw new NotFoundError('Bill not found');
      }
      if (bill.paidAt) {
        throw new BadRequestError('This bill has already been paid');
      }

      let paying = bill.dueDate;
      if (expectedDueDate !== undefined && expectedDueDate !== null) {
        paying = new Date(expectedDueDate);
        if (Number.isNaN(paying.getTime())) {
          throw new BadRequestError('dueDate must be a valid date');
        }
      } else if (bill.isSubscription) {
        throw new BadRequestError('dueDate (the due date being paid) is required for a subscription');
      }

      const targetWalletId = walletId || bill.wallet;
      if (!targetWalletId) {
        throw new BadRequestError('A wallet is required to pay this bill');
      }

      const category = await Category.ensure(
        userId, { name: 'Bills', type: 'expense', icon: '🧾', color: '#f59e0b' }, opts
      );

      const now = new Date();
      const settled = bill.isSubscription
        ? {
          // Stays unpaid so it reappears next period; see Bill.billingDay.
          dueDate: getNextRunDate(paying, 'monthly', { anchorDay: bill.billingDay || undefined }),
          paidAt: null,
          lastPaidDate: now
        }
        : { paidAt: now, lastPaidDate: now };

      // Without a transaction nothing rolls back on its own, so each completed
      // step registers how to undo itself; on failure they run in reverse.
      const undo = [];
      try {
        // Claim first: only one request can move the bill off this due date.
        const claimed = await Bill.findOneAndUpdate(
          { _id: bill._id, user: userId, isActive: true, paidAt: null, dueDate: paying },
          { $set: settled },
          { new: true, runValidators: true, ...opts }
        );
        if (!claimed) {
          throw new ConflictError('This bill was already paid for that due date. Refresh to see its current status.');
        }
        undo.push(() => Bill.updateOne(
          { _id: bill._id },
          { $set: { dueDate: bill.dueDate, paidAt: bill.paidAt, lastPaidDate: bill.lastPaidDate } }
        ));

        // The funds check is inside the same atomic write as the debit.
        const wallet = await WalletService.updateBalance(
          targetWalletId, userId, -bill.amount, { ...opts, requireFunds: true }
        );
        undo.push(() => WalletService.updateBalance(targetWalletId, userId, bill.amount, { includeInactive: true }));

        const Expense = mongoose.model('Expense');
        const [expense] = await Expense.create([{
          title: bill.name,
          amount: bill.amount,
          description: `${bill.name} — ${bill.provider}`,
          category: category._id,
          wallet: wallet._id,
          user: userId,
          date: now
        }], opts);

        return { bill: claimed, walletBalance: wallet.balance, expense };
      } catch (error) {
        if (!opts.session) {
          for (const step of undo.reverse()) {
            await step();
          }
        }
        throw error;
      }
    });
  }

}

module.exports = BillService;
