/**
 * Covers expense CRUD and, more importantly, the money path: every create,
 * update and delete moves a wallet balance, so a mistake here silently corrupts
 * the user's finances rather than throwing.
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Wallet = require('../../src/models/Wallet');
const Category = require('../../src/models/Category');
const Expense = require('../../src/models/Expense');

const STARTING_BALANCE = 1000;

describe('Expense API', () => {
  let token;
  let walletId;
  let expenseCategoryId;
  let incomeCategoryId;

  const balanceOf = async (id) => (await Wallet.findById(id)).balance;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({}),
      Wallet.deleteMany({}),
      Category.deleteMany({}),
      Expense.deleteMany({})
    ]);
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Wallet.deleteMany({}),
      Category.deleteMany({}),
      Expense.deleteMany({})
    ]);

    const registration = await request(app)
      .post('/api/v1/users/register')
      .send({ name: 'Expense Tester', email: 'expense@example.com', password: 'password123' });

    token = registration.body.data.token;
    const userId = registration.body.data.user.id;

    const wallet = await Wallet.create({
      name: 'Test Cash',
      type: 'cash',
      balance: STARTING_BALANCE,
      currency: 'LKR',
      user: userId
    });
    walletId = wallet._id.toString();

    const [expenseCategory, incomeCategory] = await Promise.all([
      Category.create({ name: 'Groceries', type: 'expense', user: userId }),
      Category.create({ name: 'Freelance', type: 'income', user: userId })
    ]);
    expenseCategoryId = expenseCategory._id.toString();
    incomeCategoryId = incomeCategory._id.toString();
  });

  const createExpense = (overrides = {}) =>
    request(app)
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Weekly shop',
        amount: 250,
        category: expenseCategoryId,
        wallet: walletId,
        date: new Date().toISOString(),
        ...overrides
      });

  describe('POST /api/v1/expenses', () => {
    it('creates an expense and debits the wallet', async () => {
      const res = await createExpense().expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(250);
      expect(await balanceOf(walletId)).toBe(STARTING_BALANCE - 250);
    });

    it('credits the wallet for an income category', async () => {
      await createExpense({ category: incomeCategoryId, amount: 400, description: 'Invoice' })
        .expect(201);

      expect(await balanceOf(walletId)).toBe(STARTING_BALANCE + 400);
    });

    it('rejects a category belonging to another user', async () => {
      const otherUser = await User.create({
        name: 'Someone Else',
        email: 'other@example.com',
        password: 'password123'
      });
      const foreignCategory = await Category.create({
        name: 'Not Yours',
        type: 'expense',
        user: otherUser._id
      });

      const res = await createExpense({ category: foreignCategory._id.toString() });

      expect(res.statusCode).toBe(404);
      // The wallet must not move when the request is rejected.
      expect(await balanceOf(walletId)).toBe(STARTING_BALANCE);
    });

    it('treats a malformed id as a client error, not a 404 or 500', async () => {
      const res = await request(app)
        .get('/api/v1/expenses/not-an-object-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
    });

    it('requires authentication', async () => {
      await request(app)
        .post('/api/v1/expenses')
        .send({ description: 'No token', amount: 10, category: expenseCategoryId })
        .expect(401);
    });
  });

  describe('PUT /api/v1/expenses/:id', () => {
    it('reverses the old amount and applies the new one', async () => {
      const created = await createExpense({ amount: 250 }).expect(201);

      await request(app)
        .put(`/api/v1/expenses/${created.body.data._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 400 })
        .expect(200);

      // Not 1000 - 250 - 400: the original debit must be undone first.
      expect(await balanceOf(walletId)).toBe(STARTING_BALANCE - 400);
    });
  });

  describe('DELETE /api/v1/expenses/:id', () => {
    it('refunds the wallet when an expense is deleted', async () => {
      const created = await createExpense({ amount: 250 }).expect(201);
      expect(await balanceOf(walletId)).toBe(STARTING_BALANCE - 250);

      await request(app)
        .delete(`/api/v1/expenses/${created.body.data._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(await balanceOf(walletId)).toBe(STARTING_BALANCE);
    });

    it('withdraws the credit when an income entry is deleted', async () => {
      const created = await createExpense({
        category: incomeCategoryId,
        amount: 400,
        description: 'Invoice'
      }).expect(201);

      await request(app)
        .delete(`/api/v1/expenses/${created.body.data._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(await balanceOf(walletId)).toBe(STARTING_BALANCE);
    });
  });

  describe('GET /api/v1/expenses', () => {
    it('returns only the authenticated user\'s expenses', async () => {
      await createExpense().expect(201);

      const otherUser = await User.create({
        name: 'Someone Else',
        email: 'other2@example.com',
        password: 'password123'
      });
      const otherWallet = await Wallet.create({
        name: 'Their Wallet', type: 'cash', balance: 500, currency: 'LKR', user: otherUser._id
      });
      const otherCategory = await Category.create({
        name: 'Theirs', type: 'expense', user: otherUser._id
      });
      await Expense.create({
        description: 'Their spend',
        amount: 99,
        category: otherCategory._id,
        wallet: otherWallet._id,
        user: otherUser._id,
        date: new Date()
      });

      const res = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const descriptions = (res.body.data || []).map(e => e.description);
      expect(descriptions).toContain('Weekly shop');
      expect(descriptions).not.toContain('Their spend');
    });
  });
});
