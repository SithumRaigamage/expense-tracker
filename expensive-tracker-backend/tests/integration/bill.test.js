/**
 * Covers bill CRUD and the payment path.
 *
 * Paying is the part worth guarding: it debits a wallet and writes an expense,
 * so getting it wrong corrupts a balance silently. The status field is derived
 * rather than stored, so there are assertions for that too — a stored status
 * would go stale at midnight.
 */
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const Bill = require('../../src/models/Bill');
const Wallet = require('../../src/models/Wallet');
const User = require('../../src/models/User');

const tokenFor = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '1h' });

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

describe('Bills API', () => {
  let user;
  let token;
  let auth;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    await User.deleteMany({});
    user = await User.create({
      name: 'Bill Test User', email: 'bills@example.com', password: 'Password123!'
    });
    token = tokenFor(user._id);
    auth = (req) => req.set('Authorization', `Bearer ${token}`);
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({}),
      Bill.deleteMany({}),
      Wallet.deleteMany({}),
      mongoose.model('Expense').deleteMany({})
    ]);
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Expenses too: paying writes one, and a later test counting them would
    // otherwise see the ones earlier tests left behind.
    await Promise.all([
      Bill.deleteMany({}),
      Wallet.deleteMany({}),
      mongoose.model('Expense').deleteMany({})
    ]);
  });

  const validBill = () => ({
    name: 'Electricity',
    provider: 'CEB',
    category: 'Utilities',
    amount: 2500,
    dueDate: daysFromNow(7).toISOString()
  });

  const createBill = (overrides = {}) =>
    auth(request(app).post('/api/v1/bills')).send({ ...validBill(), ...overrides });

  describe('CRUD', () => {
    it('creates a bill', async () => {
      const res = await createBill().expect(201);
      expect(res.body.data.name).toBe('Electricity');
      expect(res.body.data.status).toBe('Upcoming');
    });

    it('rejects a bill with no name', async () => {
      await createBill({ name: '' }).expect(400);
    });

    it('rejects an unknown category', async () => {
      await createBill({ category: 'Groceries' }).expect(400);
    });

    it('rejects a zero amount', async () => {
      await createBill({ amount: 0 }).expect(400);
    });

    it('lists bills soonest due first', async () => {
      await createBill({ name: 'Later', dueDate: daysFromNow(20).toISOString() });
      await createBill({ name: 'Sooner', dueDate: daysFromNow(2).toISOString() });

      const res = await auth(request(app).get('/api/v1/bills')).expect(200);
      expect(res.body.data.map(b => b.name)).toEqual(['Sooner', 'Later']);
    });

    it('updates a bill', async () => {
      const { body } = await createBill().expect(201);

      const res = await auth(request(app).put(`/api/v1/bills/${body.data._id}`))
        .send({ amount: 3000 })
        .expect(200);

      expect(res.body.data.amount).toBe(3000);
    });

    it('soft-deletes a bill so it leaves the list', async () => {
      const { body } = await createBill().expect(201);

      await auth(request(app).delete(`/api/v1/bills/${body.data._id}`)).expect(200);

      const res = await auth(request(app).get('/api/v1/bills')).expect(200);
      expect(res.body.data).toHaveLength(0);
      expect(await Bill.findById(body.data._id)).not.toBeNull();
    });

    it("will not touch another user's bill", async () => {
      const stranger = await User.create({
        name: 'Stranger', email: 'stranger-bills@example.com', password: 'Password123!'
      });
      const theirs = await Bill.create({ ...validBill(), user: stranger._id });

      await auth(request(app).get(`/api/v1/bills/${theirs._id}`)).expect(404);
      await auth(request(app).put(`/api/v1/bills/${theirs._id}`)).send({ amount: 1 }).expect(404);
      await auth(request(app).delete(`/api/v1/bills/${theirs._id}`)).expect(404);

      await User.deleteOne({ _id: stranger._id });
    });
  });

  // Derived, not stored — a stored status is wrong the moment the date rolls.
  describe('status', () => {
    it('reports Due Today for a bill due today', async () => {
      const res = await createBill({ dueDate: new Date().toISOString() }).expect(201);
      expect(res.body.data.status).toBe('Due Today');
    });

    it('reports Overdue for a bill in the past', async () => {
      const res = await createBill({ dueDate: daysFromNow(-3).toISOString() }).expect(201);
      expect(res.body.data.status).toBe('Overdue');
    });
  });

  describe('paying', () => {
    const seedWallet = (balance = 10000) =>
      Wallet.create({ name: 'Main', type: 'bank', balance, currency: 'LKR', user: user._id });

    it('debits the wallet and records an expense', async () => {
      const wallet = await seedWallet();
      const { body } = await createBill().expect(201);

      const res = await auth(request(app).post(`/api/v1/bills/${body.data._id}/pay`))
        .send({ walletId: wallet._id })
        .expect(200);

      expect(res.body.data.walletBalance).toBe(7500);
      expect((await Wallet.findById(wallet._id)).balance).toBe(7500);

      const expenses = await mongoose.model('Expense').find({ user: user._id });
      expect(expenses).toHaveLength(1);
      expect(expenses[0].amount).toBe(2500);
    });

    it('marks a one-off bill Paid', async () => {
      const wallet = await seedWallet();
      const { body } = await createBill().expect(201);

      const res = await auth(request(app).post(`/api/v1/bills/${body.data._id}/pay`))
        .send({ walletId: wallet._id })
        .expect(200);

      expect(res.body.data.bill.status).toBe('Paid');
    });

    // A subscription that went Paid would vanish from Upcoming and never return.
    it('rolls a subscription forward a month instead of marking it paid', async () => {
      const wallet = await seedWallet();
      const due = daysFromNow(7);
      const { body } = await createBill({
        isSubscription: true, dueDate: due.toISOString()
      }).expect(201);

      const res = await auth(request(app).post(`/api/v1/bills/${body.data._id}/pay`))
        .send({ walletId: wallet._id })
        .expect(200);

      expect(res.body.data.bill.status).toBe('Upcoming');
      const next = new Date(res.body.data.bill.dueDate);
      expect(next.getTime()).toBeGreaterThan(due.getTime());
    });

    it('refuses to overdraw the wallet and leaves both sides untouched', async () => {
      const wallet = await seedWallet(100);
      const { body } = await createBill().expect(201);

      await auth(request(app).post(`/api/v1/bills/${body.data._id}/pay`))
        .send({ walletId: wallet._id })
        .expect(400);

      expect((await Wallet.findById(wallet._id)).balance).toBe(100);
      expect((await Bill.findById(body.data._id)).paidAt).toBeNull();
      expect(await mongoose.model('Expense').countDocuments({ user: user._id })).toBe(0);
    });

    it('refuses to pay the same one-off bill twice', async () => {
      const wallet = await seedWallet();
      const { body } = await createBill().expect(201);
      const pay = () => auth(request(app).post(`/api/v1/bills/${body.data._id}/pay`))
        .send({ walletId: wallet._id });

      await pay().expect(200);
      await pay().expect(400);

      expect((await Wallet.findById(wallet._id)).balance).toBe(7500);
    });

    it("refuses to draw from another user's wallet", async () => {
      const stranger = await User.create({
        name: 'Stranger2', email: 'stranger2-bills@example.com', password: 'Password123!'
      });
      const theirWallet = await Wallet.create({
        name: 'Theirs', type: 'bank', balance: 99999, currency: 'LKR', user: stranger._id
      });
      const { body } = await createBill().expect(201);

      await auth(request(app).post(`/api/v1/bills/${body.data._id}/pay`))
        .send({ walletId: theirWallet._id })
        .expect(404);

      expect((await Wallet.findById(theirWallet._id)).balance).toBe(99999);
      await User.deleteOne({ _id: stranger._id });
    });
  });
});
