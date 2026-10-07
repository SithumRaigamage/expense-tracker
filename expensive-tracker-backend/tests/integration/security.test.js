/**
 * Regression tests for the security audit (docs/audit/). Every block names the
 * finding it pins down, and each test reproduces the original exploit — so a
 * failure here means a vulnerability has come back, not just that behaviour
 * changed.
 */

// Receipt scans must never reach the paid OCR provider from a test run.
process.env.OCR_API_KEY = '';

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Expense = require('../../src/models/Expense');
const Wallet = require('../../src/models/Wallet');
const Category = require('../../src/models/Category');
const Bill = require('../../src/models/Bill');
const { cookieFromResponse, tokenFromResponse } = require('../helpers/auth');
const { UPLOAD_DIR, RECEIPT_DIR, resolveInside } = require('../../src/config/storage');
const { tokenLifetimeSeconds } = require('../../src/utils/authCookie');

const uniqueEmail = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

/** Registers a fresh user and returns their id and session cookie. */
const signUp = async (prefix = 'sec') => {
  const res = await request(app)
    .post('/api/v1/users/register')
    .send({ name: 'Security Test', email: uniqueEmail(prefix), password: 'password123' })
    .expect(201);

  return { id: res.body.data.user.id, cookie: cookieFromResponse(res) };
};

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('C1 — users cannot change their own role', () => {
  it('ignores `role` on PUT /users/profile', async () => {
    const { id, cookie } = await signUp('c1');

    await request(app)
      .put('/api/v1/users/profile')
      .set('Cookie', cookie)
      .send({ role: 'admin' })
      .expect(200);

    const user = await User.findById(id);
    expect(user.role).toBe('user');
  });

  it('keeps admin-only routes closed after the attempt', async () => {
    const { cookie } = await signUp('c1');

    await request(app).put('/api/v1/users/profile').set('Cookie', cookie).send({ role: 'admin' });

    await request(app).get('/api/v1/feedback/all').set('Cookie', cookie).expect(403);
  });

  it('ignores `role` on the profile-image upload', async () => {
    const { id, cookie } = await signUp('c1');

    await request(app)
      .post('/api/v1/users/profile/image')
      .set('Cookie', cookie)
      .field('role', 'admin')
      .attach('profileImage', Buffer.from(PNG_1X1), 'avatar.png');

    const user = await User.findById(id);
    expect(user.role).toBe('user');

    await request(app).delete('/api/v1/users/profile/image').set('Cookie', cookie);
  });

  it('still lets users set the job title they actually wanted', async () => {
    const { cookie } = await signUp('c1');

    const res = await request(app)
      .put('/api/v1/users/profile')
      .set('Cookie', cookie)
      .send({ occupation: 'Software Engineer' })
      .expect(200);

    expect(res.body.data.occupation).toBe('Software Engineer');
    expect(res.body.data.role).toBe('user');
  });

  it('rejects a role outside the enum at the model level', async () => {
    const user = new User({ name: 'X', email: uniqueEmail('c1'), password: 'password123', role: 'superuser' });
    await expect(user.validate()).rejects.toThrow();
  });
});

describe('C2 — profile image deletion stays inside the upload directory', () => {
  const canary = path.resolve(UPLOAD_DIR, '..', `c2-canary-${process.pid}.txt`);

  beforeEach(() => fs.writeFileSync(canary, 'must survive'));
  afterEach(() => fs.rmSync(canary, { force: true }));

  const uploadAvatar = (cookie) =>
    request(app)
      .post('/api/v1/users/profile/image')
      .set('Cookie', cookie)
      .attach('profileImage', Buffer.from(PNG_1X1), 'avatar.png');

  it('ignores profileImage and avatar on PUT /users/profile', async () => {
    const { id, cookie } = await signUp('c2');

    await request(app)
      .put('/api/v1/users/profile')
      .set('Cookie', cookie)
      .send({ profileImage: 'http://x/uploads/../../.env', avatar: '../../.env' })
      .expect(200);

    const user = await User.findById(id);
    expect(user.profileImage).toBe('');
    expect(user.avatar).toBe('');
  });

  it('does not follow a traversal path that is already stored', async () => {
    const { id, cookie } = await signUp('c2');
    // Simulate a value planted before the fix.
    await User.updateOne({ _id: id }, { profileImage: `http://x/uploads/../${path.basename(canary)}` });

    await request(app).delete('/api/v1/users/profile/image').set('Cookie', cookie).expect(200);

    expect(fs.existsSync(canary)).toBe(true);
  });

  it('stores a root-relative URL and removes the file on delete', async () => {
    const { cookie } = await signUp('c2');

    const res = await uploadAvatar(cookie).expect(200);
    const url = res.body.data.profileImage;
    expect(url).toMatch(/^\/uploads\/[^/]+\.png$/);

    const filePath = resolveInside(UPLOAD_DIR, url);
    expect(fs.existsSync(filePath)).toBe(true);

    await request(app).delete('/api/v1/users/profile/image').set('Cookie', cookie).expect(200);
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('deletes the previous picture when a new one replaces it', async () => {
    const { cookie } = await signUp('c2');

    const first = await uploadAvatar(cookie).expect(200);
    const second = await uploadAvatar(cookie).expect(200);

    expect(fs.existsSync(resolveInside(UPLOAD_DIR, first.body.data.profileImage))).toBe(false);
    expect(fs.existsSync(resolveInside(UPLOAD_DIR, second.body.data.profileImage))).toBe(true);

    await request(app).delete('/api/v1/users/profile/image').set('Cookie', cookie);
  });

  it('answers a non-image upload with 400, not 500', async () => {
    const { cookie } = await signUp('c2');

    await request(app)
      .post('/api/v1/users/profile/image')
      .set('Cookie', cookie)
      .attach('profileImage', Buffer.from('<html></html>'), { filename: 'x.html', contentType: 'text/html' })
      .expect(400);
  });
});

describe('H1 — clients cannot write server-owned fields', () => {
  let alice;
  let bob;
  let wallet;
  let category;

  beforeEach(async () => {
    alice = await signUp('h1a');
    bob = await signUp('h1b');

    category = (await request(app).post('/api/v1/categories').set('Cookie', alice.cookie)
      .send({ name: `Food-${Date.now()}`, type: 'expense' }).expect(201)).body.data;
    wallet = (await request(app).post('/api/v1/wallets').set('Cookie', alice.cookie)
      .send({ name: 'Cash', type: 'cash', balance: 500 }).expect(201)).body.data;
  });

  const createExpense = () =>
    request(app).post('/api/v1/expenses').set('Cookie', alice.cookie)
      .send({ amount: 10, category: category._id, wallet: wallet._id, title: 'mine' }).expect(201);

  it('does not move an expense into another account', async () => {
    const expense = (await createExpense()).body.data;

    await request(app).put(`/api/v1/expenses/${expense._id}`).set('Cookie', alice.cookie)
      .send({ user: bob.id, title: 'renamed' }).expect(200);

    const stored = await Expense.findById(expense._id);
    expect(stored.user.toString()).toBe(alice.id);
    expect(stored.title).toBe('renamed');
  });

  it('ignores server-owned fields when creating an expense', async () => {
    const res = await request(app).post('/api/v1/expenses').set('Cookie', alice.cookie)
      .send({ amount: 10, category: category._id, wallet: wallet._id, user: bob.id, parentExpense: wallet._id })
      .expect(201);

    const stored = await Expense.findById(res.body.data._id);
    expect(stored.user.toString()).toBe(alice.id);
    expect(stored.parentExpense).toBeNull();
  });

  it('leaves balances untouched when the new wallet is not the user\'s', async () => {
    const expense = (await createExpense()).body.data;
    const bobWallet = (await request(app).post('/api/v1/wallets').set('Cookie', bob.cookie)
      .send({ name: 'Bob cash', type: 'cash', balance: 100 }).expect(201)).body.data;

    await request(app).put(`/api/v1/expenses/${expense._id}`).set('Cookie', alice.cookie)
      .send({ wallet: bobWallet._id }).expect(404);

    expect((await Wallet.findById(wallet._id)).balance).toBe(490);
    expect((await Wallet.findById(bobWallet._id)).balance).toBe(100);
  });

  it('does not reassign or deactivate a wallet through update', async () => {
    await request(app).put(`/api/v1/wallets/${wallet._id}`).set('Cookie', alice.cookie)
      .send({ user: bob.id, isActive: false, name: 'Pocket cash' }).expect(200);

    const stored = await Wallet.findById(wallet._id);
    expect(stored.user.toString()).toBe(alice.id);
    expect(stored.isActive).toBe(true);
    expect(stored.name).toBe('Pocket cash');
  });

  it('does not reassign a category through update', async () => {
    await request(app).put(`/api/v1/categories/${category._id}`).set('Cookie', alice.cookie)
      .send({ user: bob.id }).expect(200);

    expect((await Category.findById(category._id)).user.toString()).toBe(alice.id);
  });

  it('does not let a new bill be created already paid', async () => {
    const res = await request(app).post('/api/v1/bills').set('Cookie', alice.cookie)
      .send({
        name: 'Internet', provider: 'ISP', category: 'Internet', amount: 50,
        dueDate: new Date().toISOString(), paidAt: new Date().toISOString(), user: bob.id
      })
      .expect(201);

    const stored = await Bill.findById(res.body.data._id);
    expect(stored.paidAt).toBeNull();
    expect(stored.user.toString()).toBe(alice.id);
  });
});

describe('H2 — wallet transfers validate the amount', () => {
  let user;
  let from;
  let to;

  beforeEach(async () => {
    user = await signUp('h2');
    const make = (name) => request(app).post('/api/v1/wallets').set('Cookie', user.cookie)
      .send({ name, type: 'cash', balance: 500 }).expect(201);
    from = (await make('From')).body.data;
    to = (await make('To')).body.data;
  });

  const transfer = (amount) =>
    request(app).post('/api/v1/wallets/transfer').set('Cookie', user.cookie)
      .send({ fromWalletId: from._id, toWalletId: to._id, amount });

  it('treats a numeric string as a number instead of concatenating it', async () => {
    await transfer('100').expect(200);

    expect((await Wallet.findById(from._id)).balance).toBe(400);
    expect((await Wallet.findById(to._id)).balance).toBe(600);
  });

  it.each([['abc'], [-5], [0], [null], [{ $gt: 0 }]])('rejects amount %p with 400', async (amount) => {
    await transfer(amount).expect(400);

    expect((await Wallet.findById(from._id)).balance).toBe(500);
    expect((await Wallet.findById(to._id)).balance).toBe(500);
  });

  it('accepts the empty description the transfer dialog sends', async () => {
    await request(app).post('/api/v1/wallets/transfer').set('Cookie', user.cookie)
      .send({ fromWalletId: from._id, toWalletId: to._id, amount: 25, description: null })
      .expect(200);
  });

  it('rejects malformed wallet ids with 400', async () => {
    await request(app).post('/api/v1/wallets/transfer').set('Cookie', user.cookie)
      .send({ fromWalletId: 'nope', toWalletId: to._id, amount: 10 })
      .expect(400);
  });
});

describe('H4 — receipts are private to their owner', () => {
  let owner;
  let receiptPath;
  let receiptUrl;

  beforeEach(async () => {
    owner = await signUp('h4');
    const res = await request(app).post('/api/v1/expenses/receipt/scan').set('Cookie', owner.cookie)
      .attach('receipt', Buffer.from(PNG_1X1), 'receipt.png')
      .expect(200);

    receiptUrl = res.body.data.receipt;
    receiptPath = resolveInside(RECEIPT_DIR, receiptUrl);
  });

  afterEach(() => fs.rmSync(receiptPath, { force: true }));

  it('stores receipts outside the public upload directory', () => {
    expect(receiptUrl).toMatch(/^\/api\/v1\/expenses\/receipts\/[^/]+\.png$/);
    expect(fs.existsSync(receiptPath)).toBe(true);
    expect(receiptPath.startsWith(UPLOAD_DIR)).toBe(false);
  });

  it('serves a receipt to its owner', async () => {
    const res = await request(app).get(receiptUrl).set('Cookie', owner.cookie).expect(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.headers['cache-control']).toContain('private');
  });

  it('hides it from other users exactly like a missing file', async () => {
    const other = await signUp('h4');
    await request(app).get(receiptUrl).set('Cookie', other.cookie).expect(404);
  });

  it('requires a session', async () => {
    await request(app).get(receiptUrl).expect(401);
  });

  it('is not reachable through the public /uploads route', async () => {
    const fileName = path.basename(receiptPath);
    await request(app).get(`/uploads/${fileName}`).expect(404);
  });

  it('does not follow traversal in the file name', async () => {
    await request(app)
      .get(`/api/v1/expenses/receipts/${encodeURIComponent(`${owner.id}-../../../.env`)}`)
      .set('Cookie', owner.cookie)
      .expect(404);
  });
});

describe('H5 — errors use the right status and hide internals', () => {
  it('answers an unknown API route with 404, not 500', async () => {
    const res = await request(app).get('/api/v1/does-not-exist').expect(404);
    expect(res.body.success).toBe(false);
  });

  it('answers a missing release note with 404', async () => {
    await request(app).get('/api/v1/release-notes/0.0.0').expect(404);
  });

  it('answers malformed JSON with 400', async () => {
    await request(app)
      .post('/api/v1/users/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ')
      .expect(400);
  });

  it('does not leak the message of an unexpected error', async () => {
    const { cookie } = await signUp('h5');
    // Any unexpected failure inside a handler: a programming error whose
    // message names internals. (This used to rely on the M2 orphaned-category
    // crash, which is fixed.)
    const ExpenseService = require('../../src/services/expenseService');
    const spy = jest.spyOn(ExpenseService, 'getExpenses')
      .mockRejectedValueOnce(new TypeError("Cannot read properties of null (reading 'type') at internal/stack"));

    const res = await request(app).get('/api/v1/expenses').set('Cookie', cookie);
    spy.mockRestore();

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Server Error');
    expect(JSON.stringify(res.body)).not.toMatch(/Cannot read|stack/);
  });

  it('still returns user-facing 4xx messages', async () => {
    const res = await request(app).post('/api/v1/users/login')
      .send({ email: 'nobody@example.com', password: 'wrong-password' })
      .expect(401);
    expect(res.body.error).toBe('Invalid credentials');
  });
});

describe('H6 — sessions can be revoked', () => {
  const login = (email) =>
    request(app).post('/api/v1/users/login').send({ email, password: 'password123' }).expect(200);

  const signUpWithEmail = async () => {
    const email = uniqueEmail('h6');
    const res = await request(app).post('/api/v1/users/register')
      .send({ name: 'Session Test', email, password: 'password123' }).expect(201);
    return { email, cookie: cookieFromResponse(res), token: tokenFromResponse(res) };
  };

  it('rejects a copied token after logout', async () => {
    const { token } = await signUpWithEmail();

    await request(app).post('/api/v1/users/logout').set('Authorization', `Bearer ${token}`).expect(200);

    await request(app).get('/api/v1/users/verify').set('Authorization', `Bearer ${token}`).expect(401);
  });

  it('logging out one device leaves the other signed in', async () => {
    const { email, token: laptop } = await signUpWithEmail();
    const phone = tokenFromResponse(await login(email));

    await request(app).post('/api/v1/users/logout').set('Authorization', `Bearer ${laptop}`).expect(200);

    await request(app).get('/api/v1/users/verify').set('Authorization', `Bearer ${phone}`).expect(200);
  });

  it('a password change ends other sessions but keeps the current one', async () => {
    const { email, token: thief } = await signUpWithEmail();
    const ownerLogin = await login(email);
    const ownerToken = tokenFromResponse(ownerLogin);

    const change = await request(app).put('/api/v1/users/change-password')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ currentPassword: 'password123', newPassword: 'a-new-password-456' })
      .expect(200);

    // The stolen token is dead…
    await request(app).get('/api/v1/users/verify').set('Authorization', `Bearer ${thief}`).expect(401);
    // …and so is the old one the owner used, but they were handed a fresh cookie.
    await request(app).get('/api/v1/users/verify').set('Authorization', `Bearer ${ownerToken}`).expect(401);
    await request(app).get('/api/v1/users/verify').set('Cookie', cookieFromResponse(change)).expect(200);

    // Signing in again with the new password works.
    await request(app).post('/api/v1/users/login')
      .send({ email, password: 'a-new-password-456' }).expect(200);
  });

  it('gives the token and its cookie the same lifetime', async () => {
    const res = await request(app).post('/api/v1/users/register')
      .send({ name: 'Session Test', email: uniqueEmail('h6'), password: 'password123' }).expect(201);

    const { iat, exp, jti } = jwt.decode(tokenFromResponse(res));
    const maxAge = Number(/Max-Age=(\d+)/.exec(res.headers['set-cookie'].join(';'))[1]);

    expect(exp - iat).toBe(maxAge);
    expect(exp - iat).toBe(tokenLifetimeSeconds());
    expect(jti).toEqual(expect.any(String));
  });

  it('does not expose tokenVersion in profile responses', async () => {
    const { cookie } = await signUpWithEmail();
    const res = await request(app).get('/api/v1/users/profile').set('Cookie', cookie).expect(200);
    expect(res.body.data.tokenVersion).toBeUndefined();
  });
});

describe('resolveInside', () => {
  it.each([
    ['../../.env', path.join(UPLOAD_DIR, '.env')],
    ['/uploads/a.png?t=1', path.join(UPLOAD_DIR, 'a.png')],
    ['..', null],
    ['', null],
    [undefined, null]
  ])('maps %p to %p', (input, expected) => {
    expect(resolveInside(UPLOAD_DIR, input)).toBe(expected);
  });
});

// Smallest valid PNG: enough for multer's extension/MIME checks.
const PNG_1X1 = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82
]);
