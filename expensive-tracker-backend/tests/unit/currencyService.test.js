jest.mock('axios');
const axios = require('axios');
const currencyService = require('../../src/services/currencyService');

beforeEach(() => {
  jest.clearAllMocks();
  // Reset the singleton's cache between tests.
  currencyService.rates = null;
  currencyService.lastFetched = null;
});

describe('CurrencyService.fetchRates', () => {
  it('fetches and caches rates from the API', async () => {
    axios.get.mockResolvedValue({ data: { rates: { USD: 1, LKR: 320 } } });

    const rates = await currencyService.fetchRates();
    expect(rates.LKR).toBe(320);
    expect(axios.get).toHaveBeenCalledTimes(1);

    // Second call within TTL should hit cache, not the API.
    await currencyService.fetchRates();
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('falls back to default rates when the API fails', async () => {
    axios.get.mockRejectedValue(new Error('network down'));

    const rates = await currencyService.fetchRates();
    expect(rates.USD).toBe(1);
    expect(rates.LKR).toBe(300); // fallback value
  });
});

describe('CurrencyService.convert', () => {
  it('returns the same amount when currencies match', async () => {
    const result = await currencyService.convert(100, 'USD', 'USD');
    expect(result).toBe(100);
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('converts via USD using fetched rates', async () => {
    axios.get.mockResolvedValue({ data: { rates: { USD: 1, LKR: 300, EUR: 0.5 } } });
    // 300 LKR -> 1 USD -> 0.5 EUR
    const result = await currencyService.convert(300, 'LKR', 'EUR');
    expect(result).toBe(0.5);
  });

  it('returns the original amount when a rate is missing', async () => {
    axios.get.mockResolvedValue({ data: { rates: { USD: 1 } } });
    const result = await currencyService.convert(100, 'USD', 'XYZ');
    expect(result).toBe(100);
  });
});
