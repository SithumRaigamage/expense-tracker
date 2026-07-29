/**
 * Covers funding a savings goal from a wallet.
 *
 * This is a money path: it debits one document and credits another, so a
 * mistake here doesn't throw, it quietly gives the user the wrong balance. The
 * cases below pin the two properties that matter — the pair moves together, and
 * neither side can be pushed past its limits by a crafted request.
 */
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const ProductBudget = require('../../src/models/ProductBudget');
const Wallet = require('../../src/models/Wallet');
const User = require('../../src/models/User');

const tokenFor = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '1h' });

describe('POST /api/v1/productbudgets/:id/contribute', () => {
  let user;
  let token;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    await User.deleteMany({});
    user = await User.create({
      name: 'Contribute Test User',
      email: 'contribute@example.com',
      password: 'Password123!'
    });
    token = tokenFor(user._id);
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({}),
      Wallet.deleteMany({}),
      ProductBudget.deleteMany({})
    ]);
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Wallet.deleteMany({});
    await ProductBudget.deleteMany({});
  });

  const seed = async ({ balance = 1000, target = 5000, saved = 0 } = {}) => {
    const wallet = await Wallet.create({
      name: 'Main', type: 'bank', balance, currency: 'LKR', user: user._id
    });
    const goal = await ProductBudget.create({
      name: 'New Laptop', targetAmount: target, savedAmount: saved,
      targetDate: new Date(Date.now() + 86400000), user: user._id
    });
    return { wallet, goal };
  };

  const contribute = (goalId, body) =>
    request(app)
      .post(`/api/v1/productbudgets/${goalId}/contribute`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  it('debits the wallet and credits the goal by the same amount', async () => {
    const { wallet, goal } = await seed({ balance: 1000, target: 5000 });

    const res = await contribute(goal._id, { walletId: wallet._id, amount: 400 }).expect(200);

    expect(res.body.data.appliedAmount).toBe(400);

    const [freshWallet, freshGoal] = await Promise.all([
      Wallet.findById(wallet._id),
      ProductBudget.findById(goal._id)
    ]);
    expect(freshWallet.balance).toBe(600);
    expect(freshGoal.savedAmount).toBe(400);
  });

  it('clamps the contribution to what the goal still needs', async () => {
    const { wallet, goal } = await seed({ balance: 1000, target: 500, saved: 300 });

    const res = await contribute(goal._id, { walletId: wallet._id, amount: 900 }).expect(200);

    // Only the outstanding 200 should move, not the 900 asked for.
    expect(res.body.data.appliedAmount).toBe(200);
    expect(res.body.data.isFullyFunded).toBe(true);

    const [freshWallet, freshGoal] = await Promise.all([
      Wallet.findById(wallet._id),
      ProductBudget.findById(goal._id)
    ]);
    expect(freshWallet.balance).toBe(800);
    expect(freshGoal.savedAmount).toBe(500);
  });

  it('refuses to overdraw the wallet and leaves both sides untouched', async () => {
    const { wallet, goal } = await seed({ balance: 100, target: 5000 });

    await contribute(goal._id, { walletId: wallet._id, amount: 500 }).expect(400);

    const [freshWallet, freshGoal] = await Promise.all([
      Wallet.findById(wallet._id),
      ProductBudget.findById(goal._id)
    ]);
    expect(freshWallet.balance).toBe(100);
    expect(freshGoal.savedAmount).toBe(0);
  });

  it('rejects a zero or negative amount', async () => {
    const { wallet, goal } = await seed();

    await contribute(goal._id, { walletId: wallet._id, amount: 0 }).expect(400);
    await contribute(goal._id, { walletId: wallet._id, amount: -50 }).expect(400);

    expect((await Wallet.findById(wallet._id)).balance).toBe(1000);
  });

  it('rejects a goal that is already fully funded', async () => {
    const { wallet, goal } = await seed({ target: 500, saved: 500 });

    await contribute(goal._id, { walletId: wallet._id, amount: 100 }).expect(400);

    expect((await Wallet.findById(wallet._id)).balance).toBe(1000);
  });

  // Ownership is the whole security boundary here: without it any authenticated
  // user could drain a stranger's wallet into their own goal.
  it("refuses to draw from another user's wallet", async () => {
    const stranger = await User.create({
      name: 'Stranger', email: 'stranger@example.com', password: 'Password123!'
    });
    const strangerWallet = await Wallet.create({
      name: 'Theirs', type: 'bank', balance: 9999, currency: 'LKR', user: stranger._id
    });
    const { goal } = await seed();

    await contribute(goal._id, { walletId: strangerWallet._id, amount: 100 }).expect(404);

    expect((await Wallet.findById(strangerWallet._id)).balance).toBe(9999);
    await User.deleteOne({ _id: stranger._id });
  });

  it('requires a wallet id', async () => {
    const { goal } = await seed();
    await contribute(goal._id, { amount: 100 }).expect(400);
  });
});
