/**
 * Shared date-extraction helpers for free-text sources (receipts, SMS, CSV cells).
 *
 * Numeric day/month dates are assumed to be DAY-first (dd/mm/yyyy), which is the
 * convention for this app's primary locale (LKR / Sri Lanka) and most of the
 * world. ISO (yyyy-mm-dd) and month-name formats are unambiguous and parsed as-is.
 */

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

const toUtcMidnight = (year, month, day) => {
  const d = new Date(Date.UTC(year, month, day));
  // Reject impossible dates that JS would silently roll over (e.g. 31/02).
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month || d.getUTCDate() !== day) {
    return null;
  }
  return d;
};

const normalizeYear = (raw) => {
  const y = parseInt(raw, 10);
  if (raw.length === 2) {
    return y >= 70 ? 1900 + y : 2000 + y;
  }
  return y;
};

/**
 * Extract the first recognizable date from a string.
 * @param {string} text
 * @returns {string|null} ISO date string (yyyy-mm-ddT00:00:00.000Z) or null
 */
const extractDate = (text) => {
  if (!text || typeof text !== 'string') return null;

  // 1. ISO: 2026-01-31
  const iso = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const d = toUtcMidnight(parseInt(iso[1], 10), parseInt(iso[2], 10) - 1, parseInt(iso[3], 10));
    if (d) return d.toISOString();
  }

  // 2. Day-first numeric: 31/01/2026, 31-01-26, 31.01.2026
  const dmy = text.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10) - 1;
    const year = normalizeYear(dmy[3]);
    const d = toUtcMidnight(year, month, day);
    if (d) return d.toISOString();
  }

  // 3. Month name: "Jan 5, 2026" / "5 Jan 2026" / "January 5 2026"
  const named = text.match(/\b(\d{1,2})?\s*([A-Za-z]{3,9})\.?\s*(\d{1,2})?,?\s*(\d{2,4})\b/);
  if (named) {
    const monthKey = named[2].slice(0, 3).toLowerCase();
    if (monthKey in MONTHS) {
      const day = parseInt(named[1] || named[3], 10);
      const year = normalizeYear(named[4]);
      if (!Number.isNaN(day)) {
        const d = toUtcMidnight(year, MONTHS[monthKey], day);
        if (d) return d.toISOString();
      }
    }
  }

  return null;
};

module.exports = { extractDate };
