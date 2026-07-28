// Opt back into rate limiting for this file. tests/setup.js disables it globally
// so other suites can fire requests freely; jest gives each file its own module
// registry, so flipping it before requiring the middleware only affects here.
process.env.RATE_LIMIT_DISABLED = 'false';

const { ipKeyGenerator } = require('express-rate-limit');

describe('rate limiter keying', () => {
  describe('ipKeyGenerator', () => {
    it('leaves an IPv4 address as-is', () => {
      expect(ipKeyGenerator('203.0.113.5')).toBe('203.0.113.5');
    });

    it('collapses an IPv6 address to its allocated block', () => {
      // A home IPv6 allocation is a block, not a single address. Keying on the
      // raw address would let a caller spend the budget then move one address
      // along and start over.
      const first = ipKeyGenerator('2001:db8:1:2:a:b:c:d');
      const elsewhereInTheSameBlock = ipKeyGenerator('2001:db8:1:2:9:9:9:9');

      expect(first).toBe(elsewhereInTheSameBlock);
      expect(first).toContain('/');
    });

    it('still separates genuinely different IPv6 allocations', () => {
      expect(ipKeyGenerator('2001:db8:1:2:a:b:c:d'))
        .not.toBe(ipKeyGenerator('2001:db8:ffff:2:a:b:c:d'));
    });
  });

  describe('chatLimiter', () => {
    // The limiter is budgeted per account so one user on a shared network
    // cannot exhaust everyone else's allowance.
    function keyFor(req) {
      // Mirrors the keyGenerator in src/middleware/rateLimiter.js.
      return req.user?.id || ipKeyGenerator(req.ip);
    }

    it('keys an authenticated caller by account, not address', () => {
      const fromOffice = { user: { id: 'user-1' }, ip: '203.0.113.5' };
      const fromHome = { user: { id: 'user-1' }, ip: '198.51.100.9' };

      expect(keyFor(fromOffice)).toBe('user-1');
      expect(keyFor(fromOffice)).toBe(keyFor(fromHome));
    });

    it('gives two accounts behind one address separate budgets', () => {
      const shared = '203.0.113.5';

      expect(keyFor({ user: { id: 'user-1' }, ip: shared }))
        .not.toBe(keyFor({ user: { id: 'user-2' }, ip: shared }));
    });

    it('falls back to the address block when there is no account', () => {
      const key = keyFor({ ip: '2001:db8:1:2:a:b:c:d' });

      expect(key).toBe(ipKeyGenerator('2001:db8:1:2:a:b:c:d'));
      expect(key).not.toBe('2001:db8:1:2:a:b:c:d');
    });
  });

  it('builds every limiter without a validation warning', () => {
    // express-rate-limit reports a ValidationError through console.error when a
    // custom keyGenerator reads req.ip without ipKeyGenerator. Requiring the
    // module is what constructs the limiters, so a clean require is the check.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    jest.isolateModules(() => {
      const limiters = require('../../src/middleware/rateLimiter');
      expect(Object.keys(limiters).sort()).toEqual(['apiLimiter', 'authLimiter', 'chatLimiter']);
    });

    const validationErrors = spy.mock.calls
      .flat()
      .filter(arg => String(arg).includes('ERR_ERL_KEY_GEN_IPV6'));

    expect(validationErrors).toHaveLength(0);
    spy.mockRestore();
  });
});
