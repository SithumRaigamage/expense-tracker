const defaultKeywordMap = require('../config/categoryKeywords');

/**
 * Best-effort classification of a free-text description into one of the user's
 * own categories. Pure — no I/O — so it is fully unit-testable.
 *
 * Strategy (first hit wins):
 *   1. Direct: a user category name appears verbatim in the description.
 *   2. Keyword map: a keyword maps to a canonical label, and the user has a
 *      category whose name overlaps that label.
 *
 * Optionally biased by `type` ('income' | 'expense') so, e.g., a credit is only
 * matched against income categories.
 *
 * @param {string} description
 * @param {Array<{name: string, type?: string}>} categories - User categories
 * @param {Object} [options]
 * @param {string} [options.type] - Restrict matches to this category type
 * @param {Object} [options.keywordMap] - Override the default keyword map
 * @returns {Object|null} The matched category object, or null
 */
const matchCategory = (description, categories, options = {}) => {
  if (!description || !Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  const { type, keywordMap = defaultKeywordMap } = options;
  const text = description.toLowerCase();
  const pool = type ? categories.filter((c) => c.type === type) : categories;
  if (pool.length === 0) return null;

  // 1. Direct name match.
  for (const category of pool) {
    if (category.name && text.includes(category.name.toLowerCase())) {
      return category;
    }
  }

  // 2. Keyword → canonical label → user category.
  for (const [label, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((kw) => text.includes(kw))) {
      const labelLower = label.toLowerCase();
      const match = pool.find((c) => {
        const name = c.name.toLowerCase();
        return name.includes(labelLower) || labelLower.includes(name);
      });
      if (match) return match;
    }
  }

  return null;
};

module.exports = { matchCategory };
