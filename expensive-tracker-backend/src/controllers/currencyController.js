const asyncHandler = require('express-async-handler');
const currencyService = require('../services/currencyService');
const { successResponse } = require('../utils/responseFormatter');
const { CURRENCIES } = require('../config/constants');

/**
 * @desc    Get current exchange rates (Base: USD)
 * @route   GET /api/v1/currency/rates
 * @access  Public
 */
const getRates = asyncHandler(async (req, res) => {
  const rates = await currencyService.fetchRates();
  successResponse(res, rates);
});

/**
 * @desc    Get list of supported currencies
 * @route   GET /api/v1/currency/supported
 * @access  Public
 */
const getSupportedCurrencies = asyncHandler(async (req, res) => {
  successResponse(res, CURRENCIES);
});

module.exports = {
  getRates,
  getSupportedCurrencies
};
