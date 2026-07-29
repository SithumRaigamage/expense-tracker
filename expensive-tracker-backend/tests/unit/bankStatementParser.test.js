const { parseBankCsv } = require('../../src/utils/bankStatementParser');

describe('parseBankCsv', () => {
  it('parses a signed single-amount column (negative = debit)', () => {
    const csv = [
      'Date,Description,Amount',
      '12/01/2026,UBER RIDE,-1500.00',
      '25/01/2026,SALARY,150000.00'
    ].join('\n');

    const txns = parseBankCsv(csv);
    expect(txns).toHaveLength(2);
    expect(txns[0]).toEqual({
      date: '2026-01-12T00:00:00.000Z',
      description: 'UBER RIDE',
      amount: 1500,
      direction: 'debit'
    });
    expect(txns[1].direction).toBe('credit');
    expect(txns[1].amount).toBe(150000);
  });

  it('parses separate debit/credit columns', () => {
    const csv = [
      'Transaction Date,Narration,Debit,Credit',
      '2026-01-10,KEELLS SUPER,2300.00,',
      '2026-01-11,REFUND,,500.00'
    ].join('\n');

    const txns = parseBankCsv(csv);
    expect(txns[0]).toMatchObject({ amount: 2300, direction: 'debit', description: 'KEELLS SUPER' });
    expect(txns[1]).toMatchObject({ amount: 500, direction: 'credit' });
  });

  it('handles quoted fields containing commas (description and amount)', () => {
    const csv = [
      'Date,Description,Amount',
      '12/01/2026,"SHOP, THE CORNER","-1,234.56"'
    ].join('\n');
    const txns = parseBankCsv(csv);
    expect(txns[0].description).toBe('SHOP, THE CORNER');
    expect(txns[0].amount).toBe(1234.56);
    expect(txns[0].direction).toBe('debit');
  });

  it('strips currency symbols/codes from amounts', () => {
    const csv = 'Date,Details,Amount\n12/01/2026,GROCERY,LKR -450.00';
    expect(parseBankCsv(csv)[0].amount).toBe(450);
  });

  it('skips zero/blank amount rows and malformed input', () => {
    const csv = 'Date,Description,Amount\n12/01/2026,NOTHING,0.00\n,,';
    expect(parseBankCsv(csv)).toHaveLength(0);
  });

  it('returns [] for empty or header-only input', () => {
    expect(parseBankCsv('')).toEqual([]);
    expect(parseBankCsv('Date,Description,Amount')).toEqual([]);
  });
});
