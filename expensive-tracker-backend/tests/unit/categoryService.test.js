jest.mock('../../src/models/Category');
const Category = require('../../src/models/Category');
const CategoryService = require('../../src/services/categoryService');

beforeEach(() => jest.clearAllMocks());

describe('CategoryService.getCategories', () => {
  it('builds a filtered, sorted query', async () => {
    const sort = jest.fn().mockResolvedValue([{ name: 'Food' }]);
    Category.find.mockReturnValue({ sort });

    const result = await CategoryService.getCategories('u1', { type: 'expense', isActive: true, sortOrder: 'desc' });

    expect(Category.find).toHaveBeenCalledWith({ user: 'u1', type: 'expense', isActive: true });
    expect(sort).toHaveBeenCalledWith({ name: -1 });
    expect(result).toEqual([{ name: 'Food' }]);
  });
});

describe('CategoryService.getCategory', () => {
  it('returns the category when found', async () => {
    Category.findOne.mockResolvedValue({ _id: 'c1', name: 'Food' });
    await expect(CategoryService.getCategory('c1', 'u1')).resolves.toMatchObject({ name: 'Food' });
  });

  it('throws NotFoundError when missing', async () => {
    Category.findOne.mockResolvedValue(null);
    await expect(CategoryService.getCategory('c1', 'u1')).rejects.toThrow('Category not found');
  });
});

describe('CategoryService.createCategory', () => {
  it('throws ConflictError on duplicate name', async () => {
    Category.findOne.mockResolvedValue({ _id: 'existing' });
    await expect(CategoryService.createCategory({ name: 'Food' }, 'u1')).rejects.toThrow('already exists');
    expect(Category.create).not.toHaveBeenCalled();
  });

  it('creates the category when the name is free', async () => {
    Category.findOne.mockResolvedValue(null);
    Category.create.mockResolvedValue({ _id: 'c1', name: 'Food', user: 'u1' });

    const result = await CategoryService.createCategory({ name: 'Food' }, 'u1');
    expect(Category.create).toHaveBeenCalledWith({ name: 'Food', user: 'u1' });
    expect(result.name).toBe('Food');
  });
});

describe('CategoryService.updateCategory', () => {
  it('rejects a rename that collides with another category', async () => {
    Category.findOne.mockResolvedValue({ _id: 'other' });
    await expect(CategoryService.updateCategory('c1', 'u1', { name: 'Food' })).rejects.toThrow('already exists');
  });

  it('throws NotFoundError when the category does not exist', async () => {
    Category.findOne.mockResolvedValue(null); // no name clash
    Category.findOneAndUpdate.mockResolvedValue(null);
    await expect(CategoryService.updateCategory('c1', 'u1', { color: '#fff' })).rejects.toThrow('Category not found');
  });

  it('updates and returns the category', async () => {
    Category.findOne.mockResolvedValue(null);
    Category.findOneAndUpdate.mockResolvedValue({ _id: 'c1', color: '#fff' });
    const result = await CategoryService.updateCategory('c1', 'u1', { color: '#fff' });
    expect(result.color).toBe('#fff');
  });
});

describe('CategoryService.deleteCategory', () => {
  it('returns true when deleted', async () => {
    Category.findOneAndDelete.mockResolvedValue({ _id: 'c1' });
    await expect(CategoryService.deleteCategory('c1', 'u1')).resolves.toBe(true);
  });

  it('throws NotFoundError when nothing was deleted', async () => {
    Category.findOneAndDelete.mockResolvedValue(null);
    await expect(CategoryService.deleteCategory('c1', 'u1')).rejects.toThrow('Category not found');
  });
});

describe('CategoryService.createDefaultCategories', () => {
  it('bulk-inserts the default set, each tagged with the user', async () => {
    Category.insertMany.mockImplementation((docs) => Promise.resolve(docs));
    const result = await CategoryService.createDefaultCategories('u1');

    expect(Category.insertMany).toHaveBeenCalledTimes(1);
    const inserted = Category.insertMany.mock.calls[0][0];
    expect(inserted.length).toBe(12);
    expect(inserted.every((c) => c.user === 'u1')).toBe(true);
    expect(inserted.some((c) => c.name === 'Salary' && c.type === 'income')).toBe(true);
    expect(result.length).toBe(12);
  });
});
