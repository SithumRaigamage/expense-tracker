jest.mock('axios');
const axios = require('axios');
const currencyService = require('../../src/services/currencyService');

beforeEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
  // Reset the singleton between tests. The suite turns network rates off
  // (tests/setup.js); these tests exercise the fetch path with axios mocked.
  currencyService.ratesUrl = 'https://rates.example.test/latest/USD';
  currencyService.clearCache();
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

  // Audit F12: no timeout, and a failure was never cached, so with the
  // provider down every wallet request waited on it again.
  it('gives the request a timeout', async () => {
    axios.get.mockResolvedValue({ data: { rates: { USD: 1 } } });
    await currencyService.fetchRates();
    expect(axios.get).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ timeout: expect.any(Number) }));
  });

  it('does not retry a failing provider on every call', async () => {
    axios.get.mockRejectedValue(new Error('network down'));

    await currencyService.fetchRates();
    await currencyService.fetchRates();
    await currencyService.fetchRates();

    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('retries the provider once the failure backoff has passed', async () => {
    jest.useFakeTimers({ now: new Date('2026-10-07T10:00:00Z') });
    axios.get.mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ data: { rates: { USD: 1, LKR: 310 } } });

    await currencyService.fetchRates();
    jest.setSystemTime(new Date('2026-10-07T10:06:00Z'));
    const rates = await currencyService.fetchRates();

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(rates.LKR).toBe(310);
  });

  it('keeps serving the last good rates when a refresh fails', async () => {
    jest.useFakeTimers({ now: new Date('2026-10-07T10:00:00Z') });
    axios.get.mockResolvedValueOnce({ data: { rates: { USD: 1, LKR: 320 } } })
      .mockRejectedValueOnce(new Error('network down'));

    await currencyService.fetchRates();
    jest.setSystemTime(new Date('2026-10-07T12:00:00Z')); // past the 1h freshness
    const rates = await currencyService.fetchRates();

    expect(rates.LKR).toBe(320); // stale but real, not the made-up 300
  });

  it('shares one fetch between concurrent callers', async () => {
    let resolve;
    axios.get.mockReturnValue(new Promise(r => { resolve = r; }));

    const pending = Promise.all([1, 2, 3].map(() => currencyService.fetchRates()));
    resolve({ data: { rates: { USD: 1, LKR: 330 } } });
    const results = await pending;

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(results.map(r => r.LKR)).toEqual([330, 330, 330]);
  });

  it('ignores a response without usable rates', async () => {
    axios.get.mockResolvedValue({ data: { error: 'quota exceeded' } });
    const rates = await currencyService.fetchRates();
    expect(rates.LKR).toBe(300);
  });

  it('never calls out when network rates are off', async () => {
    currencyService.ratesUrl = null;
    currencyService.clearCache();

    const rates = await currencyService.fetchRates();

    expect(axios.get).not.toHaveBeenCalled();
    expect(rates.LKR).toBe(300);
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
