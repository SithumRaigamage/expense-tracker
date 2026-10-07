import { TestBed } from '@angular/core/testing';

import { ExpenseResponse, TransactionService, UNCATEGORIZED } from './transaction.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(TransactionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Audit M2: an expense whose category was deleted arrives with category: null.
  // Mapping it used to throw, which emptied the entire transaction list.
  describe('toTransaction', () => {
    const base: ExpenseResponse = {
      _id: 'e1', amount: 100, description: 'Lunch', date: '2026-10-01T00:00:00.000Z',
      category: { _id: 'c1', name: 'Food', type: 'expense' },
      wallet: { _id: 'w1', name: 'Cash', type: 'cash' },
      user: 'u1', createdAt: '', updatedAt: ''
    };

    it('maps a categorised expense', () => {
      const t = TransactionService.toTransaction(base);
      expect(t.category).toBe('Food');
      expect(t.type).toBe('expense');
      expect(t.walletId).toBe('w1');
    });

    it('shows an entry with a deleted category as Uncategorized instead of throwing', () => {
      const t = TransactionService.toTransaction({ ...base, category: null });
      expect(t.category).toBe(UNCATEGORIZED);
      expect(t.amount).toBe(100);
    });
  });
});
