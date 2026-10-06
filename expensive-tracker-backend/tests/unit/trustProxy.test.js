/**
 * Audit finding H3: behind nginx, an untrusted proxy made every client share
 * one rate-limit bucket, so ten failed logins from anyone locked everyone out.
 */
const request = require('supertest');
const { parseTrustProxy } = require('../../src/config/trustProxy');

describe('parseTrustProxy', () => {
  it.each([
    [undefined, false],
    ['', false],
    ['false', false],
    ['FALSE', false],
    ['true', true],
    ['1', 1],
    [' 2 ', 2],
    ['loopback', 'loopback'],
    ['10.0.0.0/8, uniquelocal', '10.0.0.0/8, uniquelocal']
  ])('maps %p to %p', (input, expected) => {
    expect(parseTrustProxy(input)).toBe(expected);
  });
});

describe('rate limiting behind a trusted proxy', () => {
  const originalTrust = process.env.TRUST_PROXY;
  const originalLimit = process.env.RATE_LIMIT_DISABLED;
  let app;

  beforeAll(() => {
    process.env.TRUST_PROXY = '1';
    jest.isolateModules(() => {
      app = require('../../src/app');
    });
  });

  afterAll(() => {
    process.env.TRUST_PROXY = originalTrust;
    process.env.RATE_LIMIT_DISABLED = originalLimit;
  });

  // An invalid body fails validation after the limiter has counted it, so this
  // exercises the auth limiter without touching the database.
  const badLogin = (clientIp) =>
    request(app)
      .post('/api/v1/users/login')
      .set('X-Forwarded-For', clientIp)
      .send({ email: 'not-an-email', password: '' });

  it('reads the client address from X-Forwarded-For', () => {
    expect(app.get('trust proxy')).toBe(1);
  });

  it('locks out only the client that keeps failing', async () => {
    process.env.RATE_LIMIT_DISABLED = 'false';

    for (let i = 0; i < 10; i += 1) {
      await badLogin('203.0.113.10').expect(400);
    }

    await badLogin('203.0.113.10').expect(429);
    // A different user behind the same proxy is unaffected.
    await badLogin('198.51.100.20').expect(400);
  });
});
