const axios = require('axios');
const { CURRENCIES } = require('../config/constants');

/**
 * Service to handle currency exchange rates
 */
class CurrencyService {
  constructor() {
    this.rates = null;
    this.lastFetched = null;
    this.cacheTTL = 3600000; // 1 hour in milliseconds
    
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

  /**
   * Fetch latest exchange rates from a free API
   * @returns {Promise<Object>} Exchange rates relative to USD
   */
  async fetchRates() {
    const now = Date.now();
    
    // Return cached rates if valid
    if (this.rates && this.lastFetched && (now - this.lastFetched < this.cacheTTL)) {
      return this.rates;
    }

    try {
      // Using a free API that doesn't require a key
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
      
      if (response.data && response.data.rates) {
        this.rates = response.data.rates;
        this.lastFetched = now;
        console.log('Exchange rates updated from API');
        return this.rates;
      }
    } catch (error) {
      console.warn('Failed to fetch exchange rates, using fallback:', error.message);
    }

    // Use fallback if API fails
    this.rates = this.fallbackRates;
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
      console.warn(`Missing rate for ${fromCurrency} or ${toCurrency}`);
      return amount; // Fallback to original amount if conversion fails
    }

    // Convert source currency to USD, then USD to destination currency
    const amountInUSD = amount / rates[fromCurrency];
    const convertedAmount = amountInUSD * rates[toCurrency];
    
    return parseFloat(convertedAmount.toFixed(2));
  }
}

module.exports = new CurrencyService();
