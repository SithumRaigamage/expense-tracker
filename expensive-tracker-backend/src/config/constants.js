/**
 * Application-wide constants
 */

// Wallet types
const WALLET_TYPES = ['cash', 'bank', 'credit', 'savings', 'crypto', 'investment', 'loan', 'emergencyfund'];

// Supported currencies
const CURRENCIES = ['LKR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];

// Payment methods
const PAYMENT_METHODS = [
  'cash',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'digital_wallet',
  'other'
];

// Category types
const CATEGORY_TYPES = ['income', 'expense'];

// Bill categories
const BILL_CATEGORIES = ['Utilities', 'Subscription', 'Entertainment', 'Internet', 'Insurance', 'Other'];

// Recurring frequencies
const RECURRING_FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];

// File upload settings
const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: /jpeg|jpg|png|gif/,
  ALLOWED_MIMETYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// JWT settings
const JWT = {
  DEFAULT_EXPIRE: '30d'
};

// User roles
const USER_ROLES = ['user', 'admin'];

module.exports = {
  WALLET_TYPES,
  CURRENCIES,
  PAYMENT_METHODS,
  CATEGORY_TYPES,
  BILL_CATEGORIES,
  RECURRING_FREQUENCIES,
  FILE_UPLOAD,
  PAGINATION,
  JWT,
  USER_ROLES
};
