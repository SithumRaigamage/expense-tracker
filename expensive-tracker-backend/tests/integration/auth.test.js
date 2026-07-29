/**
 * Covers the authentication surface — the only endpoints an unauthenticated
 * caller can reach — including regression tests for two vulnerabilities:
 * NoSQL operator injection into the user lookup, and unlimited login attempts.
 */

// Opt back into rate limiting for this file. tests/setup.js disables it globally
// so other suites can fire requests freely; jest gives each file its own module
// registry, so flipping it before requiring the app only affects this suite.
process.env.RATE_LIMIT_DISABLED = 'false';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { tokenFromResponse } = require('../helpers/auth');

const validUser = {
  name: 'Auth Test User',
  email: 'authtest@example.com',
  password: 'password123'
};

describe('Authentication API', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/v1/users/register', () => {
    it('creates a user and returns a token', async () => {
      const res = await request(app)
        .post('/api/v1/users/register')
        .send(validUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      // The token is issued as an httpOnly cookie, never in the body.
      expect(res.body.data.token).toBeUndefined();
      expect(tokenFromResponse(res)).toEqual(expect.any(String));
      expect(res.body.data.user.email).toBe(validUser.email);
    });

    it('never returns the password hash', async () => {
      const res = await request(app)
        .post('/api/v1/users/register')
        .send(validUser)
        .expect(201);

      expect(JSON.stringify(res.body)).not.toContain('password');
    });

    it('rejects a password shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/v1/users/register')
        .send({ ...validUser, password: 'short' })
        .expect(400);

      expect(res.body.error).toContain('at least 8 characters');
    });

    it('rejects a malformed email', async () => {
      const res = await request(app)
        .post('/api/v1/users/register')
        .send({ ...validUser, email: 'not-an-email' })
        .expect(400);

      expect(res.body.error).toContain('valid email');
    });

    it('rejects a duplicate email', async () => {
      await request(app).post('/api/v1/users/register').send(validUser).expect(201);

      const res = await request(app)
        .post('/api/v1/users/register')
        .send(validUser);

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/users/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/users/register').send(validUser);
    });

    it('returns a token for correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({ email: validUser.email, password: validUser.password })
        .expect(200);

      // The token is issued as an httpOnly cookie, never in the body.
      expect(res.body.data.token).toBeUndefined();
      expect(tokenFromResponse(res)).toEqual(expect.any(String));
    });

    it('rejects a wrong password without revealing which field was wrong', async () => {
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({ email: validUser.email, password: 'wrong-password' })
        .expect(401);

      expect(res.body.error).toBe('Invalid credentials');
    });

    it('gives an unknown email the same message as a wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({ email: 'nobody@example.com', password: 'password123' })
        .expect(401);

      // Differing messages here would let an attacker enumerate valid accounts.
      expect(res.body.error).toBe('Invalid credentials');
    });

    // Regression: {"email": {"$gt": ""}} used to reach the user lookup as a
    // Mongo operator and match an arbitrary account.
    it('rejects a Mongo operator object instead of an email', async () => {
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({ email: { $gt: '' }, password: 'anything' })
        .expect(400);

      expect(res.body.error).toContain('valid email');
    });

    it('rejects a Mongo operator object instead of a password', async () => {
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({ email: validUser.email, password: { $ne: null } })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // Regression: every failed attempt used to be processed, making login an
  // unlimited password-guessing oracle.
  describe('brute-force protection', () => {
    it('starts rejecting repeated failed logins with 429', async () => {
      await request(app).post('/api/v1/users/register').send(validUser);

      const statuses = [];
      for (let attempt = 0; attempt < 14; attempt++) {
        const res = await request(app)
          .post('/api/v1/users/login')
          .send({ email: validUser.email, password: 'wrong-password' });
        statuses.push(res.statusCode);
      }

      expect(statuses).toContain(429);

      // Attempts are answered normally until the budget runs out, then blocked
      // and stay blocked. (The exact cut-off depends on how much of the window
      // earlier tests in this file consumed — same IP, same 15-minute window —
      // so assert the shape rather than a fixed count.)
      expect(statuses[0]).toBe(401);
      const firstBlocked = statuses.indexOf(429);
      expect(statuses.slice(firstBlocked).every(s => s === 429)).toBe(true);
    });
  });

  describe('protected routes', () => {
    it('rejects a request with no token', async () => {
      await request(app).get('/api/v1/users/profile').expect(401);
    });

    it('rejects a forged token', async () => {
      await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer not-a-real-token')
        .expect(401);
    });
  });
});
