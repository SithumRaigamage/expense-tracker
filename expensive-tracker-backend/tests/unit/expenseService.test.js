jest.mock('../../src/models/Expense');
jest.mock('../../src/models/Category');
jest.mock('../../src/models/Wallet');
jest.mock('../../src/services/walletService');

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
    Expense.create.mockResolvedValue({ _id: 'e1', wallet: 'w1', amount: 100 });
    // populate chain for the response
    const populate2 = jest.fn().mockResolvedValue({ _id: 'e1', amount: 100 });
    const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
    Expense.findById.mockReturnValue({ populate: populate1 });

    await ExpenseService.createExpense({ category: 'c1', wallet: 'w1', amount: 100 }, 'u1');

    // expense -> negative balance change
    expect(WalletService.updateBalance).toHaveBeenCalledWith('w1', 'u1', -100);
  });

  it('credits the wallet for an income category', async () => {
    Category.findOne.mockResolvedValue({ _id: 'c1', type: 'income' });
    Wallet.findOne.mockResolvedValue({ _id: 'w1' });
    Expense.create.mockResolvedValue({ _id: 'e1', wallet: 'w1', amount: 200 });
    const populate2 = jest.fn().mockResolvedValue({ _id: 'e1' });
    Expense.findById.mockReturnValue({ populate: jest.fn().mockReturnValue({ populate: populate2 }) });

    await ExpenseService.createExpense({ category: 'c1', wallet: 'w1', amount: 200 }, 'u1');
    expect(WalletService.updateBalance).toHaveBeenCalledWith('w1', 'u1', 200);
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
    // deleting an expense refunds the wallet (+100)
    expect(WalletService.updateBalance).toHaveBeenCalledWith('w1', 'u1', 100);
    expect(Expense.deleteOne).toHaveBeenCalledWith({ _id: 'e1' });
  });

  it('throws NotFoundError when the expense is missing', async () => {
    Expense.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    await expect(ExpenseService.deleteExpense('e1', 'u1')).rejects.toThrow('Expense not found');
  });
});
