jest.mock('../../src/models/ProductBudget');
const ProductBudget = require('../../src/models/ProductBudget');
const ProductBudgetService = require('../../src/services/productBudgetService');

beforeEach(() => jest.clearAllMocks());

describe('ProductBudgetService.createProductBudget', () => {
  it('stamps the user and creates the budget', async () => {
    ProductBudget.create.mockImplementation((data) => Promise.resolve({ _id: 'b1', ...data }));
    const result = await ProductBudgetService.createProductBudget({ name: 'Laptop', targetAmount: 1000 }, 'u1');
    expect(ProductBudget.create).toHaveBeenCalledWith({ name: 'Laptop', targetAmount: 1000, user: 'u1' });
    expect(result.user).toBe('u1');
  });
});

describe('ProductBudgetService.getProductBudgets', () => {
  it('filters by user and active flag, newest first', async () => {
    const sort = jest.fn().mockResolvedValue([{ name: 'Laptop' }]);
    ProductBudget.find.mockReturnValue({ sort });

    await ProductBudgetService.getProductBudgets('u1', { isActive: 'true' });
    expect(ProductBudget.find).toHaveBeenCalledWith({ user: 'u1', isActive: true });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  });
});

describe('ProductBudgetService.getProductBudgetById', () => {
  it('throws NotFoundError when missing', async () => {
    ProductBudget.findOne.mockResolvedValue(null);
    await expect(ProductBudgetService.getProductBudgetById('b1', 'u1')).rejects.toThrow('not found');
  });
});

describe('ProductBudgetService.updateProductBudget / updateSavedAmount', () => {
  it('updates and returns the budget', async () => {
    ProductBudget.findOneAndUpdate.mockResolvedValue({ _id: 'b1', name: 'Phone' });
    const result = await ProductBudgetService.updateProductBudget('b1', 'u1', { name: 'Phone' });
    expect(result.name).toBe('Phone');
  });

  it('updateSavedAmount throws NotFoundError when missing', async () => {
    ProductBudget.findOneAndUpdate.mockResolvedValue(null);
    await expect(ProductBudgetService.updateSavedAmount('b1', 'u1', 500)).rejects.toThrow('not found');
  });
});

describe('ProductBudgetService.deleteProductBudget', () => {
  it('returns true when deleted, throws when not', async () => {
    ProductBudget.findOneAndDelete.mockResolvedValueOnce({ _id: 'b1' });
    await expect(ProductBudgetService.deleteProductBudget('b1', 'u1')).resolves.toBe(true);

    ProductBudget.findOneAndDelete.mockResolvedValueOnce(null);
    await expect(ProductBudgetService.deleteProductBudget('b1', 'u1')).rejects.toThrow('not found');
  });
});

describe('ProductBudgetService.getProductBudgetsSummary', () => {
  it('aggregates totals and average progress across active budgets', async () => {
    ProductBudget.find.mockResolvedValue([
      { targetAmount: 1000, savedAmount: 500, progress: 50 },
      { targetAmount: 2000, savedAmount: 500, progress: 25 }
    ]);

    const summary = await ProductBudgetService.getProductBudgetsSummary('u1');
    expect(summary).toEqual({
      totalBudgets: 2,
      totalTargetAmount: 3000,
      totalSavedAmount: 1000,
      totalRemainingAmount: 2000,
      averageProgress: 38 // round((50+25)/2)
    });
  });

  it('handles the no-budgets case without dividing by zero', async () => {
    ProductBudget.find.mockResolvedValue([]);
    const summary = await ProductBudgetService.getProductBudgetsSummary('u1');
    expect(summary.totalBudgets).toBe(0);
    expect(summary.averageProgress).toBe(0);
  });
});
