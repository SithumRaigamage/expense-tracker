const { parseReceiptText } = require('../../src/utils/receiptParser');

describe('parseReceiptText', () => {
  const receipt = [
    'KEELLS SUPER',
    '123 Main Street',
    'Date: 12/01/2026',
    'Milk           450.00',
    'Bread          320.00',
    'Subtotal       770.00',
    'TOTAL        1,234.56',
    'Thank you!'
  ].join('\n');

  it('extracts the total amount, preferring the TOTAL line', () => {
    expect(parseReceiptText(receipt).amount).toBe(1234.56);
  });

  it('extracts the date', () => {
    expect(parseReceiptText(receipt).date).toBe('2026-01-12T00:00:00.000Z');
  });

  it('extracts the merchant from the top line', () => {
    const parsed = parseReceiptText(receipt);
    expect(parsed.merchant).toBe('KEELLS SUPER');
    expect(parsed.title).toBe('KEELLS SUPER');
  });

  it('falls back to the largest amount when no total keyword exists', () => {
    const text = 'CAFE MOCHA\nCoffee 5.00\nCake 12.50\nTip 2.00';
    expect(parseReceiptText(text).amount).toBe(12.5);
  });

  it('returns nulls for empty input', () => {
    expect(parseReceiptText('')).toEqual({ amount: null, date: null, merchant: null, title: null });
  });
});
