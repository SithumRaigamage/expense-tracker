/**
 * Runs before any test module is loaded (jest `setupFiles`).
 *
 * The suites call deleteMany({}) on User/Wallet/ProductBudget. One of them used
 * connectDB(), which reads MONGODB_URI — the development database — so running
 * `npm test` destroyed real data. Everything is pinned to a dedicated test
 * database here, and the guard below refuses to run if that ever stops holding.
 */
require('dotenv').config();

process.env.NODE_ENV = 'test';

const DEFAULT_TEST_URI = 'mongodb://localhost:27017/expense-tracker-test';

const toTestUri = () => {
  if (process.env.MONGODB_URI_TEST) return process.env.MONGODB_URI_TEST;
  if (process.env.MONGO_TEST_URI) return process.env.MONGO_TEST_URI;

  // Derive a sibling "-test" database from the configured connection so tests
  // reuse the same server (container, Atlas, …) without touching real data.
  const uri = process.env.MONGODB_URI;
  if (!uri) return DEFAULT_TEST_URI;

  try {
    const parsed = new URL(uri);
    const dbName = parsed.pathname.replace(/^\//, '') || 'expense-tracker';
    parsed.pathname = `/${dbName.replace(/-test.*$/, '')}-test`;
    return parsed.toString();
  } catch {
    return DEFAULT_TEST_URI;
  }
};

/**
 * Jest runs suites in parallel workers. Both suites call User.deleteMany({}), so
 * sharing one database means they delete each other's fixtures mid-run and fail
 * intermittently. Give every worker its own database instead.
 */
const withWorkerSuffix = (uri) => {
  const workerId = process.env.JEST_WORKER_ID;
  if (!workerId) return uri;
  const parsed = new URL(uri);
  parsed.pathname = `${parsed.pathname}-w${workerId}`;
  return parsed.toString();
};

process.env.MONGODB_URI = withWorkerSuffix(toTestUri());
process.env.MONGO_TEST_URI = process.env.MONGODB_URI;

// Guard: never let a suite that wipes collections point at a non-test database.
const dbName = process.env.MONGODB_URI.split('/').pop().split('?')[0];
if (!/-test(-w\d+)?$/.test(dbName)) {
  throw new Error(
    `Refusing to run tests against database "${dbName}". The test database name must end with "-test".`
  );
}

// Tests must not depend on the developer's real signing key.
process.env.JWT_SECRET = process.env.JWT_SECRET_TEST || 'test-only-jwt-secret-not-used-outside-of-tests';
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';
