jest.mock('../../src/models/Expense');
jest.mock('../../src/models/Category');
jest.mock('../../src/models/Wallet');
jest.mock('../../src/services/walletService');
// No database here: run the transactional work directly.
jest.mock('../../src/utils/transaction', () => ({ runInTransaction: (work) => work({}) }));

const Expense = require('../../src/models/Expense');
const Category = require('../../src/models/Category');
const Wallet = require('../../src/models/Wallet');
const WalletService = require('../../src/services/walletService');
const ExpenseService = require('../../src/services/expenseService');

beforeEach(() => {
  jest.clearAllMocks();
  WalletService.updateBalance.mockResolvedValue({});
});

describe('ExpenseService.createExpense', () => {
  it('throws NotFoundError when the category does not belong to the user', async () => {
    Category.findOne.mockResolvedValue(null);
    await expect(ExpenseService.createExpense({ category: 'c1', amount: 10 }, 'u1'))
      .rejects.toThrow('Category not found');
  });

  it('throws NotFoundError when a supplied wallet is invalid', async () => {
    Category.findOne.mockResolvedValue({ _id: 'c1', type: 'expense' });
    Wallet.findOne.mockResolvedValue(null);
    await expect(ExpenseService.createExpense({ category: 'c1', wallet: 'w1', amount: 10 }, 'u1'))
      .rejects.toThrow('Wallet not found');
  });

  it('creates an expense and debits the wallet for an expense category', async () => {
    Category.findOne.mockResolvedValue({ _id: 'c1', type: 'expense' });
    Wallet.findOne.mockResolvedValue({ _id: 'w1' });
    Expense.create.mockResolvedValue([{ _id: 'e1', wallet: 'w1', amount: 100 }]);
    // populate chain for the response
    const populate2 = jest.fn().mockResolvedValue({ _id: 'e1', amount: 100 });
    const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
    Expense.findById.mockReturnValue({ populate: populate1 });

    await ExpenseService.createExpense({ category: 'c1', wallet: 'w1', amount: 100 }, 'u1');

    // expense -> negative balance change
    expect(WalletService.updateBalance).toHaveBeenCalledWith('w1', 'u1', -100, {});
  });

  it('credits the wallet for an income category', async () => {
    Category.findOne.mockResolvedValue({ _id: 'c1', type: 'income' });
    Wallet.findOne.mockResolvedValue({ _id: 'w1' });
    Expense.create.mockResolvedValue([{ _id: 'e1', wallet: 'w1', amount: 200 }]);
    const populate2 = jest.fn().mockResolvedValue({ _id: 'e1' });
    Expense.findById.mockReturnValue({ populate: jest.fn().mockReturnValue({ populate: populate2 }) });

    await ExpenseService.createExpense({ category: 'c1', wallet: 'w1', amount: 200 }, 'u1');
    expect(WalletService.updateBalance).toHaveBeenCalledWith('w1', 'u1', 200, {});
  });
});

describe('ExpenseService.determineWallet', () => {
  it('routes health/medical categories to the emergency fund', async () => {
    Category.findById.mockResolvedValue({ name: 'Medical' });
    Wallet.findOne.mockResolvedValue({ _id: 'emergency' });
    const result = await ExpenseService.determineWallet('u1', 'c1');
    expect(Wallet.findOne).toHaveBeenCalledWith({ user: 'u1', type: 'emergencyfund', isActive: true });
    expect(result).toBe('emergency');
  });

  it('routes salary/rent to a bank wallet', async () => {
    Category.findById.mockResolvedValue({ name: 'Rent' });
    Wallet.findOne.mockResolvedValue({ _id: 'bank' });
    const result = await ExpenseService.determineWallet('u1', 'c1');
    expect(Wallet.findOne).toHaveBeenCalledWith({ user: 'u1', type: 'bank', isActive: true });
    expect(result).toBe('bank');
  });

  it('throws BadRequestError when the user has no active wallet', async () => {
    Category.findById.mockResolvedValue({ name: 'Misc' });
    Wallet.findOne.mockResolvedValue(null); // no default and no any-wallet
    await expect(ExpenseService.determineWallet('u1', 'c1')).rejects.toThrow('No active wallets');
  });
});

describe('ExpenseService.deleteExpense', () => {
  it('reverts the wallet balance and deletes', async () => {
    Expense.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ _id: 'e1', wallet: 'w1', amount: 100, category: { type: 'expense' } })
    });
    Expense.deleteOne.mockResolvedValue({});

    await ExpenseService.deleteExpense('e1', 'u1');
    // deleting an expense refunds the wallet (+100), even a deleted one (M3)
    expect(WalletService.updateBalance).toHaveBeenCalledWith('w1', 'u1', 100, { includeInactive: true });
    expect(Expense.deleteOne).toHaveBeenCalledWith({ _id: 'e1' }, {});
  });

  it('throws NotFoundError when the expense is missing', async () => {
    Expense.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    await expect(ExpenseService.deleteExpense('e1', 'u1')).rejects.toThrow('Expense not found');
  });
});

describe('ExpenseService.getExpenseStats', () => {
  it('separates income from expense totals and category breakdowns', async () => {
    Expense.aggregate
      .mockResolvedValueOnce([{
        totalIncome: 2500,
        totalExpenses: 900,
        expenseCount: 3,
        expenseAvg: 300,
        expenseMin: 100,
        expenseMax: 500
      }])
      .mockResolvedValueOnce([
        { _id: 'food', name: 'Food', color: '#fff', total: 600, count: 2 }
      ]);

    const result = await ExpenseService.getExpenseStats('507f1f77bcf86cd799439011', {});

    expect(result.summary).toEqual({
      totalAmount: 900,
      totalIncome: 2500,
      totalExpenses: 900,
      netSavings: 1600,
      count: 3,
      avgAmount: 300,
      minAmount: 100,
      maxAmount: 500
    });
    expect(result.byCategory).toHaveLength(1);
    expect(Expense.aggregate).toHaveBeenCalledTimes(2);
  });
});

describe('ExpenseService.getMonthlyStats', () => {
  it('returns income, expenses and net savings for one month', async () => {
    Expense.aggregate.mockResolvedValueOnce([{
      totalIncome: 2500,
      totalExpenses: 900,
      transactionCount: 4
    }]);

    await expect(ExpenseService.getMonthlyStats('507f1f77bcf86cd799439011', 2026, 1)).resolves.toEqual({
      totalIncome: 2500,
      totalExpenses: 900,
      netSavings: 1600,
      transactionCount: 4
    });
  });
});
