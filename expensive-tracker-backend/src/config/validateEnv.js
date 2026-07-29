const logger = require('../utils/logger');

// Values shipped in .env.example / docker-compose.yml. If one of these reaches a
// running server, every token it issues is forgeable by anyone with the repo.
const PLACEHOLDER_SECRETS = [
  'your-super-secret-jwt-key-here',
  'your-secure-secret-key-here',
  'secret',
  'changeme'
];

const MIN_SECRET_LENGTH = 32;

/**
 * Validates security-critical environment variables at boot.
 *
 * A missing JWT_SECRET would otherwise surface as a 500 on the first login
 * (jwt.sign throws on an undefined secret), and a placeholder secret would not
 * surface at all — it would just be insecure. Both should stop the process.
 */
const validateEnv = () => {
  const errors = [];
  const { JWT_SECRET, NODE_ENV, MONGODB_URI } = process.env;

  if (!JWT_SECRET) {
    errors.push('JWT_SECRET is not set. Generate one with: openssl rand -base64 48');
  } else if (PLACEHOLDER_SECRETS.includes(JWT_SECRET.trim())) {
    errors.push('JWT_SECRET is still the example placeholder. Generate a real one with: openssl rand -base64 48');
  } else if (NODE_ENV === 'production' && JWT_SECRET.length < MIN_SECRET_LENGTH) {
    errors.push(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production (currently ${JWT_SECRET.length}).`);
  }

  if (!MONGODB_URI) {
    errors.push('MONGODB_URI is not set.');
  }

  if (errors.length === 0) {
    return;
  }

  errors.forEach(message => logger.error(`Invalid environment configuration: ${message}`));

  // Throwing inside a test run would take down the suite with a stack trace that
  // hides the real cause, so surface it as a clear failure instead.
  if (NODE_ENV === 'test') {
    throw new Error(`Invalid environment configuration: ${errors.join(' ')}`);
  }

  process.exit(1);
};

module.exports = validateEnv;
