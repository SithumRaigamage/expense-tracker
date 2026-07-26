jest.mock('../../src/models/Expense');
jest.mock('../../src/models/Category');
jest.mock('../../src/services/expenseService');
jest.mock('../../src/utils/logger', () => ({ info: jest.fn(), error: jest.fn() }));

const Expense = require('../../src/models/Expense');
const Category = require('../../src/models/Category');
const ExpenseService = require('../../src/services/expenseService');
const BankImportService = require('../../src/services/bankImportService');

const categories = [
  { _id: { toString: () => 'food' }, name: 'Food', type: 'expense' },
  { _id: { toString: () => 'salary' }, name: 'Salary', type: 'income' }
];

beforeEach(() => {
  jest.clearAllMocks();
  Category.find.mockResolvedValue(categories);
  Expense.findOne.mockResolvedValue(null); // no duplicates by default
  ExpenseService.createExpense.mockResolvedValue({});
});

const debit = { date: '2026-01-12T00:00:00.000Z', description: 'KEELLS SUPER', amount: 2300, direction: 'debit' };
const credit = { date: '2026-01-25T00:00:00.000Z', description: 'SALARY payroll', amount: 150000, direction: 'credit' };

describe('BankImportService.importTransactions', () => {
  it('creates expenses for matched transactions with correct category types', async () => {
    const summary = await BankImportService.importTransactions([debit, credit], 'user-1', { walletId: 'w1' });

    expect(summary.created).toBe(2);
    expect(ExpenseService.createExpense).toHaveBeenCalledTimes(2);
    const [expenseArg] = ExpenseService.createExpense.mock.calls[0];
    expect(expenseArg.category).toBe(categories[0]._id); // Food for the debit
    expect(expenseArg.wallet).toBe('w1');
    expect(expenseArg.paymentMethod).toBe('bank_transfer');
  });

  it('reports unmatched transactions and does not create them', async () => {
    const mystery = { date: '2026-01-01T00:00:00.000Z', description: 'MYSTERY XYZ', amount: 100, direction: 'debit' };
    const summary = await BankImportService.importTransactions([mystery], 'user-1', {});

    expect(summary.unmatched).toBe(1);
    expect(summary.created).toBe(0);
    expect(ExpenseService.createExpense).not.toHaveBeenCalled();
    expect(summary.results[0].status).toBe('unmatched');
  });

  it('uses the default category for unmatched expenses when provided', async () => {
    const mystery = { date: '2026-01-01T00:00:00.000Z', description: 'MYSTERY XYZ', amount: 100, direction: 'debit' };
    const summary = await BankImportService.importTransactions([mystery], 'user-1', { defaultCategoryId: 'food' });

    expect(summary.created).toBe(1);
    expect(summary.unmatched).toBe(0);
  });

  it('skips duplicates idempotently', async () => {
    Expense.findOne.mockResolvedValue({ _id: 'existing' });
    const summary = await BankImportService.importTransactions([debit], 'user-1', {});

    expect(summary.duplicates).toBe(1);
    expect(summary.created).toBe(0);
    expect(ExpenseService.createExpense).not.toHaveBeenCalled();
  });

  it('dryRun previews without creating anything', async () => {
    const summary = await BankImportService.importTransactions([debit, credit], 'user-1', { dryRun: true });

    expect(summary.dryRun).toBe(true);
    expect(summary.created).toBe(0);
    expect(ExpenseService.createExpense).not.toHaveBeenCalled();
    expect(summary.results.every((r) => r.status === 'preview')).toBe(true);
  });

  it('rejects an oversized batch', async () => {
    const many = new Array(1001).fill(debit);
    await expect(BankImportService.importTransactions(many, 'user-1', {})).rejects.toThrow(/Too many/);
  });
});
