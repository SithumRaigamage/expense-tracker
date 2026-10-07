const axios = require('axios');
const logger = require('../utils/logger');

const DEFAULT_RATES_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
/** An outbound call without a timeout can hold an API request open indefinitely. */
const REQUEST_TIMEOUT_MS = 5000;
/** How long fetched rates are used before refreshing. */
const FRESH_TTL_MS = 60 * 60 * 1000;
/** While the provider is failing, retry it at most this often (not on every request). */
const RETRY_AFTER_FAILURE_MS = 5 * 60 * 1000;

/**
 * Service to handle currency exchange rates.
 *
 * Rates come from a free provider (`EXCHANGE_RATES_URL`, base USD). Wallet
 * listings and stats convert through here, so a slow or failing provider must
 * not slow down or break the API (audit F12):
 * - every fetch has a timeout;
 * - a failure keeps serving the last good rates (or the built-in table) and
 *   retries no more than every few minutes;
 * - concurrent requests share one in-flight fetch.
 * Set `EXCHANGE_RATES_URL=off` to never call out (the test suite does).
 */
class CurrencyService {
  constructor() {
    const configured = process.env.EXCHANGE_RATES_URL;
    this.ratesUrl = configured === 'off' ? null : (configured || DEFAULT_RATES_URL);
    this.clearCache();

    // Default fallback rates (Base: USD)
    this.fallbackRates = {
      'USD': 1,
      'LKR': 300,
      'EUR': 0.92,
      'GBP': 0.79,
      'JPY': 150.5,
      'CAD': 1.35,
      'AUD': 1.52,
      'CHF': 0.88,
      'CNY': 7.2,
      'INR': 83.0
    };
  }

  /** Forget cached rates, so the next call fetches. */
  clearCache() {
    this.rates = null;
    this.expiresAt = 0;
    this.inFlight = null;
  }

  /**
   * Latest exchange rates relative to USD. Never throws.
   * @returns {Promise<Object>} Exchange rates relative to USD
   */
  async fetchRates() {
    if (this.rates && Date.now() < this.expiresAt) {
      return this.rates;
    }
    if (!this.inFlight) {
      this.inFlight = this.loadRates().finally(() => {
        this.inFlight = null;
      });
    }
    return this.inFlight;
  }

  /** @private */
  async loadRates() {
    if (!this.ratesUrl) {
      this.rates = this.fallbackRates;
      this.expiresAt = Infinity;
      return this.rates;
    }

    try {
      const response = await axios.get(this.ratesUrl, { timeout: REQUEST_TIMEOUT_MS });
      const rates = response.data && response.data.rates;

      if (rates && rates.USD === 1) {
        this.rates = rates;
        this.expiresAt = Date.now() + FRESH_TTL_MS;
        logger.info('Exchange rates updated from API');
        return this.rates;
      }
      logger.warn('Exchange rate response had no usable rates, using fallback');
    } catch (error) {
      logger.warn('Failed to fetch exchange rates, using fallback', { message: error.message });
    }

    // Serve the last good rates if there are any (stale beats made-up), else the
    // built-in table, and don't ask the provider again for a while.
    this.rates = this.rates || this.fallbackRates;
    this.expiresAt = Date.now() + RETRY_AFTER_FAILURE_MS;
    return this.rates;
  }

  /**
   * Convert amount from one currency to another
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Destination currency code
   * @returns {Promise<number>} Converted amount
   */
  async convert(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;

    const rates = await this.fetchRates();

    if (!rates[fromCurrency] || !rates[toCurrency]) {
      logger.warn('Missing exchange rate', { fromCurrency, toCurrency });
      return amount; // Fallback to original amount if conversion fails
    }

    // Convert source currency to USD, then USD to destination currency
    const amountInUSD = amount / rates[fromCurrency];
    const convertedAmount = amountInUSD * rates[toCurrency];

    return parseFloat(convertedAmount.toFixed(2));
  }
}

module.exports = new CurrencyService();
