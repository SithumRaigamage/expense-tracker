const { matchCategory } = require('../../src/utils/categoryMatcher');

const categories = [
  { _id: '1', name: 'Food', type: 'expense' },
  { _id: '2', name: 'Transport', type: 'expense' },
  { _id: '3', name: 'Salary', type: 'income' }
];

describe('matchCategory', () => {
  it('matches by keyword to the right category', () => {
    expect(matchCategory('UBER RIDE downtown', categories).name).toBe('Transport');
    expect(matchCategory('KEELLS SUPER grocery', categories).name).toBe('Food');
  });

  it('matches directly when the category name appears in the text', () => {
    expect(matchCategory('Monthly food shop', categories).name).toBe('Food');
  });

  it('respects the type filter (credit -> income only)', () => {
    expect(matchCategory('SALARY payroll', categories, { type: 'income' }).name).toBe('Salary');
    // A debit-typed lookup should not match the income-only Salary category.
    expect(matchCategory('SALARY payroll', categories, { type: 'expense' })).toBeNull();
  });

  it('returns null when nothing matches', () => {
    expect(matchCategory('mystery transaction', categories)).toBeNull();
    expect(matchCategory('UBER', [])).toBeNull();
    expect(matchCategory('', categories)).toBeNull();
  });

  it('accepts a custom keyword map', () => {
    const map = { Food: ['zomato'] };
    expect(matchCategory('ZOMATO order', categories, { keywordMap: map }).name).toBe('Food');
  });
});
