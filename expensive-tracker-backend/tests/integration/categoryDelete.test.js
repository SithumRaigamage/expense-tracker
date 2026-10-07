/**
 * Audit M2: deleting a category that transactions still use.
 *
 * The category used to be removed outright, leaving its expenses with a
 * dangling reference: editing or deleting one then failed with a 500 (it read
 * `category.type` on null), and the frontend's list crashed mapping it. A
 * category in use can now only be deleted together with moving its
 * transactions to another category of the same type.
 */
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Wallet = require('../../src/models/Wallet');
const Category = require('../../src/models/Category');
const Expense = require('../../src/models/Expense');

const tokenFor = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '1h' });

describe('DELETE /api/v1/categories/:id (M2)', () => {
  let user;
  let auth;
  let wallet;
  let food;
  let groceries;
  let salary;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    await User.deleteMany({});
    user = await User.create({ name: 'Category Delete User', email: 'catdelete@example.com', password: 'Password123!' });
    const token = tokenFor(user._id);
    auth = (req) => req.set('Authorization', `Bearer ${token}`);
  });

  afterAll(async () => {
    await Promise.all([User.deleteMany({}), Wallet.deleteMany({}), Category.deleteMany({}), Expense.deleteMany({})]);
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Promise.all([Wallet.deleteMany({}), Category.deleteMany({}), Expense.deleteMany({})]);
    wallet = await Wallet.create({ name: 'Cash', type: 'cash', balance: 1000, currency: 'LKR', user: user._id });
    [food, groceries, salary] = await Category.create([
      { name: 'Food', type: 'expense', user: user._id },
      { name: 'Groceries', type: 'expense', user: user._id },
      { name: 'Salary', type: 'income', user: user._id }
    ]);
  });

  const spend = (category, amount = 100) =>
    auth(request(app).post('/api/v1/expenses'))
      .send({ title: 'Entry', amount, category: category._id, wallet: wallet._id })
      .expect(201);

  const del = (category, query = '') =>
    auth(request(app).delete(`/api/v1/categories/${category._id}${query}`));

  const balance = async () => (await Wallet.findById(wallet._id)).balance;

  it('deletes an unused category', async () => {
    const res = await del(food).expect(200);

    expect(res.body.data.reassigned).toBe(0);
    expect(await Category.findById(food._id)).toBeNull();
  });

  it('refuses to delete a category in use and leaves everything as it was', async () => {
    await spend(food);

    const res = await del(food).expect(409);

    expect(res.body.error).toMatch(/used by 1 transaction/);
    expect(await Category.findById(food._id)).not.toBeNull();
    expect(await Expense.countDocuments({ category: food._id })).toBe(1);
  });

  it('moves the transactions to a category of the same type, then deletes', async () => {
    await spend(food, 100);
    await spend(food, 50);

    const res = await del(food, `?reassignTo=${groceries._id}`).expect(200);

    expect(res.body.data.reassigned).toBe(2);
    expect(await Category.findById(food._id)).toBeNull();
    expect(await Expense.countDocuments({ category: groceries._id })).toBe(2);
    // Same type, so the balance is exactly what it was.
    expect(await balance()).toBe(850);
  });

  it('refuses to move transactions to a category of the other type', async () => {
    await spend(food);

    await del(food, `?reassignTo=${salary._id}`).expect(400);

    expect(await Category.findById(food._id)).not.toBeNull();
    expect(await Expense.countDocuments({ category: food._id })).toBe(1);
    expect(await balance()).toBe(900);
  });

  it("refuses to move transactions to another user's category", async () => {
    await spend(food);
    const stranger = await User.create({ name: 'Stranger', email: 'stranger-cat@example.com', password: 'Password123!' });
    const theirs = await Category.create({ name: 'Theirs', type: 'expense', user: stranger._id });

    await del(food, `?reassignTo=${theirs._id}`).expect(404);

    expect(await Expense.countDocuments({ category: food._id })).toBe(1);
    await User.deleteOne({ _id: stranger._id });
  });

  it('rejects reassigning a category to itself or to a malformed id', async () => {
    await spend(food);

    await del(food, `?reassignTo=${food._id}`).expect(400);
    await del(food, '?reassignTo=not-an-id').expect(400);
  });

  // Entries orphaned before this fix: their original type is unknown, so they
  // can't be reverted. They must be repairable without a 500.
  describe('an entry whose category was already deleted', () => {
    let orphanId;

    beforeEach(async () => {
      const created = await spend(food, 100);
      orphanId = created.body.data._id;
      await Category.deleteOne({ _id: food._id }); // how the old delete left things
    });

    it('still appears in the list', async () => {
      const res = await auth(request(app).get('/api/v1/expenses')).expect(200);
      expect(res.body.data.map(e => e._id)).toContain(orphanId);
    });

    it('cannot be deleted until it has a category (409, not 500)', async () => {
      const res = await auth(request(app).delete(`/api/v1/expenses/${orphanId}`)).expect(409);

      expect(res.body.error).toMatch(/category no longer exists/);
      expect(await balance()).toBe(900);
    });

    it('can be given a category, after which it deletes normally', async () => {
      await auth(request(app).put(`/api/v1/expenses/${orphanId}`))
        .send({ category: groceries._id })
        .expect(200);
      // Relabelling alone moves no money.
      expect(await balance()).toBe(900);

      await auth(request(app).delete(`/api/v1/expenses/${orphanId}`)).expect(200);
      expect(await balance()).toBe(1000);
    });

    it('rejects an update that does not give it a category', async () => {
      await auth(request(app).put(`/api/v1/expenses/${orphanId}`)).send({ amount: 50 }).expect(409);
      expect(await balance()).toBe(900);
    });
  });
});
