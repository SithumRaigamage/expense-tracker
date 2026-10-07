/**
 * Audit finding M5: concurrent money operations.
 *
 * Transfers, goal contributions and bill payments used to read a wallet, change
 * `balance` in memory and save() it back. Two requests in flight at once both
 * read the same starting balance, so the second save silently overwrote the
 * first: money moved out of one place and never left the other, and both
 * requests passed the "sufficient funds" check against a balance that was only
 * true for one of them.
 *
 * Every case fires its requests concurrently and then checks the stored
 * balances against what the transaction history says they should be.
 */
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const Bill = require('../../src/models/Bill');
const Wallet = require('../../src/models/Wallet');
const ProductBudget = require('../../src/models/ProductBudget');
const Category = require('../../src/models/Category');
const Expense = require('../../src/models/Expense');
const User = require('../../src/models/User');

const tokenFor = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '1h' });

const CONCURRENCY = 8;

describe('Money operations under concurrency (M5)', () => {
  let user;
  let auth;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    await User.deleteMany({});
    user = await User.create({
      name: 'Concurrency Test User', email: 'concurrency@example.com', password: 'Password123!'
    });
    const token = tokenFor(user._id);
    auth = (req) => req.set('Authorization', `Bearer ${token}`);
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({}),
      Wallet.deleteMany({}),
      ProductBudget.deleteMany({}),
      Bill.deleteMany({}),
      Category.deleteMany({}),
      Expense.deleteMany({})
    ]);
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Promise.all([
      Wallet.deleteMany({}),
      ProductBudget.deleteMany({}),
      Bill.deleteMany({}),
      Category.deleteMany({}),
      Expense.deleteMany({})
    ]);
  });

  const wallet = (name, balance) =>
    Wallet.create({ name, type: 'bank', balance, currency: 'LKR', user: user._id });

  const balanceOf = async (w) => (await Wallet.findById(w._id)).balance;

  it('concurrent transfers move every unit exactly once', async () => {
    const from = await wallet('From', 1000);
    const to = await wallet('To', 0);

    const results = await Promise.all(Array.from({ length: CONCURRENCY }, () =>
      auth(request(app).post('/api/v1/wallets/transfer'))
        .send({ fromWalletId: from._id, toWalletId: to._id, amount: 10 })
    ));

    expect(results.map(r => r.status)).toEqual(Array(CONCURRENCY).fill(200));
    expect(await balanceOf(from)).toBe(1000 - 10 * CONCURRENCY);
    expect(await balanceOf(to)).toBe(10 * CONCURRENCY);
  });

  it('concurrent goal contributions cannot overdraw the wallet', async () => {
    const source = await wallet('Savings', 1000);
    const goal = await ProductBudget.create({
      name: 'Laptop', targetAmount: 100000, savedAmount: 0,
      targetDate: new Date(Date.now() + 86400000), user: user._id
    });

    // Each request alone is affordable; only two of them together are.
    const results = await Promise.all(Array.from({ length: CONCURRENCY }, () =>
      auth(request(app).post(`/api/v1/productbudgets/${goal._id}/contribute`))
        .send({ walletId: source._id, amount: 400 })
    ));

    const succeeded = results.filter(r => r.status === 200).length;
    expect(succeeded).toBe(2);
    expect(results.filter(r => r.status !== 200).every(r => r.status === 400)).toBe(true);

    expect(await balanceOf(source)).toBe(1000 - 400 * succeeded);
    expect((await ProductBudget.findById(goal._id)).savedAmount).toBe(400 * succeeded);
  });

  it('concurrent contributions cannot fund a goal past its target', async () => {
    const source = await wallet('Savings', 100000);
    const goal = await ProductBudget.create({
      name: 'Bike', targetAmount: 1000, savedAmount: 0,
      targetDate: new Date(Date.now() + 86400000), user: user._id
    });

    await Promise.all(Array.from({ length: CONCURRENCY }, () =>
      auth(request(app).post(`/api/v1/productbudgets/${goal._id}/contribute`))
        .send({ walletId: source._id, amount: 400 })
    ));

    const saved = (await ProductBudget.findById(goal._id)).savedAmount;
    expect(saved).toBe(1000);
    // What left the wallet is exactly what reached the goal.
    expect(await balanceOf(source)).toBe(100000 - saved);
  });

  it('concurrent bill payments cannot overdraw the wallet', async () => {
    const payFrom = await wallet('Bills Wallet', 250);
    const bills = await Bill.create(Array.from({ length: CONCURRENCY }, (_, i) => ({
      name: `Bill ${i}`, provider: 'Utility Co', category: 'Utilities',
      amount: 100, dueDate: new Date(Date.now() + 86400000), user: user._id
    })));

    const results = await Promise.all(bills.map(b =>
      auth(request(app).post(`/api/v1/bills/${b._id}/pay`)).send({ walletId: payFrom._id })
    ));

    const paid = results.filter(r => r.status === 200).length;
    expect(paid).toBe(2);
    expect(await balanceOf(payFrom)).toBe(250 - 100 * paid);
    // One expense per successful payment, none for the rejected ones.
    expect(await Expense.countDocuments({ wallet: payFrom._id })).toBe(paid);
  });

  it('concurrent expenses on one wallet all reach the balance', async () => {
    const spendFrom = await wallet('Daily', 1000);
    const food = await Category.create({ name: 'Food', type: 'expense', user: user._id });

    const results = await Promise.all(Array.from({ length: CONCURRENCY }, () =>
      auth(request(app).post('/api/v1/expenses'))
        .send({ title: 'Lunch', amount: 25, category: food._id, wallet: spendFrom._id })
    ));

    expect(results.map(r => r.status)).toEqual(Array(CONCURRENCY).fill(201));
    expect(await balanceOf(spendFrom)).toBe(1000 - 25 * CONCURRENCY);
  });
});
