const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const Wallet = require('../models/Wallet');
const Category = require('../models/Category');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * Service layer for bills.
 *
 * Paying a bill moves money, so `payBill` follows the same transactional shape
 * as wallet transfers and goal contributions: read balances inside the
 * transaction, write both sides together, fall back to sequential writes on a
 * standalone MongoDB that can't do transactions.
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
    let session = null;
    try {
      session = await mongoose.startSession();
      await session.startTransaction();
      await mongoose.connection.db.command({ ping: 1 }, { session });
    } catch {
      if (session) {
        try {
          await session.abortTransaction();
        } catch {
          // Ignore abort errors
        }
        await session.endSession();
      }
      session = null;
    }

    const sessionOptions = session ? { session } : {};

    try {
      const bill = await Bill.findOne({ _id: billId, user: userId, isActive: true }, null, sessionOptions);
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

      const wallet = await Wallet.findOne(
        { _id: targetWalletId, user: userId, isActive: true }, null, sessionOptions
      );
      if (!wallet) {
        throw new NotFoundError('Wallet not found');
      }
      if (wallet.balance < bill.amount) {
        throw new BadRequestError('Insufficient funds in the selected wallet');
      }

      let category = await Category.findOne(
        { user: userId, name: 'Bills', type: 'expense' }, null, sessionOptions
      );
      if (!category) {
        const created = await Category.create([{
          user: userId, name: 'Bills', type: 'expense', icon: '🧾', color: '#f59e0b'
        }], sessionOptions);
        category = created[0];
      }

      const Expense = mongoose.model('Expense');
      const expense = await Expense.create([{
        title: bill.name,
        amount: bill.amount,
        description: `${bill.name} — ${bill.provider}`,
        category: category._id,
        wallet: wallet._id,
        user: userId,
        date: new Date()
      }], sessionOptions);

      wallet.balance -= bill.amount;
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

      await wallet.save(sessionOptions);
      await bill.save(sessionOptions);

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      return { bill, walletBalance: wallet.balance, expense: expense[0] };
    } catch (error) {
      if (session) {
        try {
          await session.abortTransaction();
        } catch {
          // Ignore abort errors
        }
        session.endSession();
      }
      throw error;
    }
  }
}

module.exports = BillService;
