const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const Category = require('../models/Category');
const WalletService = require('./walletService');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { runInTransaction } = require('../utils/transaction');

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
    return Bill.create({ ...billData, user: userId });
  }

  static async updateBill(billId, userId, updates) {
    // Ownership and payment state are the server's to decide, not the caller's.
    // The bindings are unused by design — destructuring is what drops them.
    const { user: _user, paidAt: _paidAt, isActive: _isActive, ...safeUpdates } = updates;

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
   * which is what makes the "Upcoming" list keep working month to month.
   */
  static async payBill(billId, userId, walletId) {
    return runInTransaction(async (opts) => {
      const bill = await Bill.findOne({ _id: billId, user: userId, isActive: true }, null, opts);
      if (!bill) {
        throw new NotFoundError('Bill not found');
      }
      if (bill.paidAt) {
        throw new BadRequestError('This bill has already been paid');
      }

      const targetWalletId = walletId || bill.wallet;
      if (!targetWalletId) {
        throw new BadRequestError('A wallet is required to pay this bill');
      }

      const category = await Category.ensure(
        userId, { name: 'Bills', type: 'expense', icon: '🧾', color: '#f59e0b' }, opts
      );

      // Debit first, with the funds check inside the same atomic write, so a
      // rejected payment fails before anything else is written.
      const wallet = await WalletService.updateBalance(
        targetWalletId, userId, -bill.amount, { ...opts, requireFunds: true }
      );

      const Expense = mongoose.model('Expense');
      const [expense] = await Expense.create([{
        title: bill.name,
        amount: bill.amount,
        description: `${bill.name} — ${bill.provider}`,
        category: category._id,
        wallet: wallet._id,
        user: userId,
        date: new Date()
      }], opts);

      bill.lastPaidDate = new Date();

      if (bill.isSubscription) {
        // Roll to the same day next month; stays unpaid so it reappears.
        const next = new Date(bill.dueDate);
        next.setMonth(next.getMonth() + 1);
        bill.dueDate = next;
        bill.paidAt = null;
      } else {
        bill.paidAt = new Date();
      }

      await bill.save(opts);

      return { bill, walletBalance: wallet.balance, expense };
    });
  }
}

module.exports = BillService;
