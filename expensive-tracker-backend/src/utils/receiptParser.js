const { extractDate } = require('./dateExtract');

/**
 * Pure heuristics that turn raw OCR text from a receipt into structured fields.
 * Kept free of any I/O so it can be unit-tested exhaustively.
 */

// Matches monetary amounts like 1,234.56 / 45.00 / 1234.5
const AMOUNT_RE = /(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+\.\d{1,2})/g;

// Lines that most reliably carry the payable amount.
const TOTAL_KEYWORDS = ['grand total', 'total amount', 'amount due', 'balance due', 'total', 'amount', 'paid'];

const parseAmount = (raw) => parseFloat(String(raw).replace(/,/g, ''));

/**
 * Pick the most likely payable amount from the receipt.
 * Prefers a number on a "total"-type line; otherwise falls back to the largest
 * monetary value found anywhere in the text.
 * @param {string[]} lines
 * @returns {number|null}
 */
const extractAmount = (lines) => {
  // 1. Prefer explicit total lines (last match wins — receipts often list
  //    subtotal before the final total).
  let best = null;
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (TOTAL_KEYWORDS.some((kw) => lower.includes(kw))) {
      const matches = line.match(AMOUNT_RE);
      if (matches && matches.length) {
        best = parseAmount(matches[matches.length - 1]);
      }
    }
  }
  if (best !== null && !Number.isNaN(best)) return best;

  // 2. Fallback: the largest monetary value anywhere.
  const all = [];
  for (const line of lines) {
    const matches = line.match(AMOUNT_RE);
    if (matches) matches.forEach((m) => all.push(parseAmount(m)));
  }
  const valid = all.filter((n) => !Number.isNaN(n));
  return valid.length ? Math.max(...valid) : null;
};

/**
 * Guess the merchant name: the first meaningful text line at the top of the
 * receipt that isn't a pure number, date, or common header noise.
 * @param {string[]} lines
 * @returns {string|null}
 */
const extractMerchant = (lines) => {
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 3) continue;
    if (!/[A-Za-z]/.test(trimmed)) continue; // needs letters
    if (extractDate(trimmed)) continue; // skip date lines
    if (/^(receipt|invoice|tax invoice|bill|order)\b/i.test(trimmed)) continue;
    return trimmed.replace(/\s+/g, ' ');
  }
  return null;
};

/**
 * Turn raw OCR text into a suggested expense.
 * @param {string} text - Raw OCR output
 * @returns {{amount: number|null, date: string|null, merchant: string|null, title: string|null}}
 */
const parseReceiptText = (text) => {
  if (!text || typeof text !== 'string') {
    return { amount: null, date: null, merchant: null, title: null };
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const merchant = extractMerchant(lines);

  return {
    amount: extractAmount(lines),
    date: extractDate(text),
    merchant,
    title: merchant // sensible default title for the pre-filled form
  };
};

module.exports = { parseReceiptText, extractAmount, extractMerchant };
