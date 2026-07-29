const { extractDate } = require('./dateExtract');

/**
 * Parse a bank-statement CSV into normalized transactions. Pure — no I/O.
 *
 * Flexible column mapping handles the common statement shapes:
 *   - a single signed "amount" column (negative = debit), or
 *   - separate "debit" / "credit" (or "withdrawal" / "deposit") columns.
 * Header names are matched fuzzily and case-insensitively.
 *
 * @param {string} csv - Raw CSV text (with a header row)
 * @returns {Array<{date: string|null, description: string, amount: number,
 *   direction: 'debit'|'credit'}>}
 */
const parseBankCsv = (csv) => {
  if (!csv || typeof csv !== 'string') return [];

  const rows = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(splitCsvLine);

  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.toLowerCase().trim());

  // Resolve date/description first, then exclude those columns when fuzzily
  // matching the numeric columns — this avoids short tokens like "cr" matching
  // inside "description".
  const idx = {};
  idx.date = findColumn(header, ['date', 'transaction date', 'posting date', 'value date']);
  idx.description = findColumn(header, ['description', 'details', 'narration', 'particulars', 'memo', 'reference']);
  const taken = [idx.date, idx.description].filter((i) => i >= 0);
  idx.amount = findColumn(header, ['amount', 'value'], taken);
  idx.debit = findColumn(header, ['debit', 'withdrawal', 'withdrawals'], taken);
  idx.credit = findColumn(header, ['credit', 'deposit', 'deposits'], taken);

  const transactions = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const tx = rowToTransaction(row, idx);
    if (tx) transactions.push(tx);
  }
  return transactions;
};

const rowToTransaction = (row, idx) => {
  const description = idx.description >= 0 ? (row[idx.description] || '').trim() : '';
  const date = idx.date >= 0 ? extractDate(row[idx.date]) : null;

  let amount = null;
  let direction = null;

  // Separate debit / credit columns take precedence.
  if (idx.debit >= 0 || idx.credit >= 0) {
    const debit = idx.debit >= 0 ? toNumber(row[idx.debit]) : null;
    const credit = idx.credit >= 0 ? toNumber(row[idx.credit]) : null;
    if (debit) {
      amount = Math.abs(debit);
      direction = 'debit';
    } else if (credit) {
      amount = Math.abs(credit);
      direction = 'credit';
    }
  } else if (idx.amount >= 0) {
    const signed = toNumber(row[idx.amount]);
    if (signed !== null) {
      amount = Math.abs(signed);
      direction = signed < 0 ? 'debit' : 'credit';
    }
  }

  if (amount === null || amount === 0 || Number.isNaN(amount)) return null;

  return { date, description, amount, direction };
};

const findColumn = (header, candidates, excluded = []) => {
  for (const candidate of candidates) {
    const exact = header.indexOf(candidate);
    if (exact >= 0 && !excluded.includes(exact)) return exact;
  }
  // Fall back to a substring match (e.g. "debit amount"), skipping columns that
  // are already assigned to another field.
  for (let i = 0; i < header.length; i++) {
    if (excluded.includes(i)) continue;
    if (candidates.some((c) => header[i].includes(c))) return i;
  }
  return -1;
};

const toNumber = (value) => {
  if (value === undefined || value === null) return null;
  // Strip currency symbols/codes, thousands separators, and whitespace.
  const cleaned = String(value).replace(/[^0-9.-]/g, '').trim();
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? null : num;
};

/**
 * Minimal CSV line splitter with support for double-quoted fields containing
 * commas and escaped quotes ("").
 */
const splitCsvLine = (line) => {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
};

module.exports = { parseBankCsv, splitCsvLine };
