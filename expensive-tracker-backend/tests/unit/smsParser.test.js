const { parseSmsMessage, parseSmsMessages } = require('../../src/utils/smsParser');

describe('parseSmsMessage', () => {
  it('parses a debit alert with merchant and date', () => {
    const msg = 'Your a/c XXXX1234 is debited with LKR 1,500.00 at KEELLS on 12/01/2026';
    expect(parseSmsMessage(msg)).toMatchObject({
      amount: 1500,
      direction: 'debit',
      merchant: 'KEELLS',
      date: '2026-01-12T00:00:00.000Z'
    });
  });

  it('parses a credit/salary alert', () => {
    const msg = 'Salary credited LKR 150,000.00 to a/c 5678 on 25/01/2026';
    const tx = parseSmsMessage(msg);
    expect(tx.direction).toBe('credit');
    expect(tx.amount).toBe(150000);
  });

  it('parses "spent ... at" phrasing', () => {
    const msg = 'Rs. 2,300.00 spent on your card at UBER. Bal: 45,000.00';
    const tx = parseSmsMessage(msg);
    expect(tx.amount).toBe(2300);
    expect(tx.direction).toBe('debit');
    expect(tx.merchant).toBe('UBER');
  });

  it('returns null for non-transaction messages', () => {
    expect(parseSmsMessage('Your OTP is 123456')).toBeNull();
    expect(parseSmsMessage('Hello, meeting at 5pm')).toBeNull();
    expect(parseSmsMessage('')).toBeNull();
  });
});

describe('parseSmsMessages', () => {
  it('filters out messages that are not transaction alerts', () => {
    const txns = parseSmsMessages([
      'Your a/c is debited with LKR 500.00 at CAFE on 01/02/2026',
      'Your OTP is 9999',
      'Rs. 1,000.00 credited to your account'
    ]);
    expect(txns).toHaveLength(2);
    expect(txns[0].direction).toBe('debit');
    expect(txns[1].direction).toBe('credit');
  });

  it('returns [] for non-array input', () => {
    expect(parseSmsMessages(null)).toEqual([]);
  });
});
