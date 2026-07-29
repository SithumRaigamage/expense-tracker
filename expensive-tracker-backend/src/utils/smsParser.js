const { extractDate } = require('./dateExtract');

/**
 * Parse bank transaction-alert SMS messages into normalized transactions. Pure.
 *
 * Handles common phrasings such as:
 *   "Your a/c XXXX1234 is debited with LKR 1,500.00 at KEELLS on 12/01/2026"
 *   "Rs. 2,300.00 spent on your card at UBER. Bal: 45,000.00"
 *   "Salary credited LKR 150,000.00 to a/c 5678 on 25/01/2026"
 */

const AMOUNT_RE = /(?:LKR|USD|EUR|GBP|INR|Rs\.?|\$|£|€)\s?([\d,]+(?:\.\d{1,2})?)/i;
const FALLBACK_AMOUNT_RE = /\b(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+\.\d{2})\b/;

const DEBIT_RE = /\b(debit|debited|withdrawn|withdrawal|spent|purchase|paid|payment)\b/i;
const CREDIT_RE = /\b(credit|credited|deposited|received|salary|refund)\b/i;

// Merchant usually follows "at <NAME>" or "to <NAME>", ending before a date,
// "on", balance info, or end of string.
const MERCHANT_RE = /\b(?:at|to)\s+([A-Za-z0-9&'.\- ]{2,40}?)(?=\s+(?:on|bal|balance|ref|dated)\b|[.,]|\s+\d|$)/i;

const parseAmount = (raw) => parseFloat(String(raw).replace(/,/g, ''));

/**
 * Parse a single SMS string into a transaction, or null if it isn't a
 * recognizable transaction alert.
 * @param {string} message
 * @returns {{date: string|null, description: string, amount: number, direction: 'debit'|'credit'}|null}
 */
const parseSmsMessage = (message) => {
  if (!message || typeof message !== 'string') return null;

  const amountMatch = message.match(AMOUNT_RE) || message.match(FALLBACK_AMOUNT_RE);
  if (!amountMatch) return null;
  const amount = parseAmount(amountMatch[1]);
  if (!amount || Number.isNaN(amount)) return null;

  // Determine direction; skip messages that clearly aren't debit/credit alerts.
  let direction;
  if (DEBIT_RE.test(message)) {
    direction = 'debit';
  } else if (CREDIT_RE.test(message)) {
    direction = 'credit';
  } else {
    return null;
  }

  const merchantMatch = message.match(MERCHANT_RE);
  const merchant = merchantMatch ? merchantMatch[1].trim().replace(/\s+/g, ' ') : null;

  return {
    date: extractDate(message),
    description: merchant || message.trim(),
    merchant,
    amount,
    direction
  };
};

/**
 * Parse an array of SMS strings, dropping any that aren't transaction alerts.
 * @param {string[]} messages
 * @returns {Array} Normalized transactions
 */
const parseSmsMessages = (messages) => {
  if (!Array.isArray(messages)) return [];
  return messages.map(parseSmsMessage).filter(Boolean);
};

module.exports = { parseSmsMessage, parseSmsMessages };
