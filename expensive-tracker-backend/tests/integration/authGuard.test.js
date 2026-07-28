/**
 * Covers what `protect` does with a token that verifies but whose user is no
 * longer usable. Both cases below reached the controllers with `req.user` unset
 * or belonging to a locked-out account.
 *
 * These mint tokens with jwt.sign rather than calling /register, so the suite
 * doesn't consume the auth rate limiter's budget (auth.test.js opts into it).
 */
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { cookieFromResponse } = require('../helpers/auth');

const tokenFor = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '1h' });

const createUser = (overrides = {}) =>
  User.create({
    name: 'Guard Test User',
    email: `guard-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'password123',
    ...overrides
  });

describe('session cookie', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  const register = () =>
    request(app).post('/api/v1/users/register').send({
      name: 'Cookie User',
      email: `cookie-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      password: 'password123'
    });

  // httpOnly is the whole reason for the move off localStorage: an injected
  // script must not be able to read the session token.
  it('issues the token as an httpOnly, SameSite=Strict cookie', async () => {
    const res = await register().expect(201);
    const raw = (res.headers['set-cookie'] || []).find(c => c.startsWith('token='));

    expect(raw).toBeDefined();
    expect(raw).toMatch(/HttpOnly/i);
    expect(raw).toMatch(/SameSite=Strict/i);
  });

  it('keeps the token out of the response body', async () => {
    const res = await register().expect(201);

    expect(res.body.data.token).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('eyJ');
  });

  it('authenticates a request carrying only the cookie', async () => {
    const res = await register().expect(201);

    await request(app)
      .get('/api/v1/users/profile')
      .set('Cookie', cookieFromResponse(res))
      .expect(200);
  });

  it('clears the cookie on logout', async () => {
    const res = await register().expect(201);

    const out = await request(app)
      .post('/api/v1/users/logout')
      .set('Cookie', cookieFromResponse(res))
      .expect(200);

    const cleared = (out.headers['set-cookie'] || []).find(c => c.startsWith('token='));
    expect(cleared).toMatch(/token=;/);
  });
});

describe('protect middleware', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  it('allows a token whose user is present and active', async () => {
    const user = await createUser();

    const res = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${tokenFor(user._id)}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  // The token outlives the account. The lookup returned null, and the 44
  // controller call sites that read `req.user.id` threw — a 500 for what is
  // really an authentication failure.
  it('rejects a valid token whose user no longer exists', async () => {
    const user = await createUser();
    const token = tokenFor(user._id);
    await User.deleteOne({ _id: user._id });

    const res = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  // Clearing isActive is the only lever for locking an account out, and it did
  // nothing until the token expired because the flag was never read here.
  it('rejects a token belonging to a deactivated account', async () => {
    const user = await createUser();
    const token = tokenFor(user._id);
    await User.updateOne({ _id: user._id }, { isActive: false });

    await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  // A deactivated account must not be able to reach data routes either, not
  // just the profile endpoint.
  it('rejects a deactivated account on a data route', async () => {
    const user = await createUser();
    const token = tokenFor(user._id);
    await User.updateOne({ _id: user._id }, { isActive: false });

    await request(app)
      .get('/api/v1/wallets')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });
});
