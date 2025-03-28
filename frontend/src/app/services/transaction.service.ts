import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Transaction } from '../models/Transaction';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private transactions = new BehaviorSubject<Transaction[]>([]);

  constructor() {
    this.transactions.next([

      {
        id: 0,
        date: new Date(2025, 2, 1),
        amount: 5000,
        description: 'Dad Icome',
        category: 'Salary',
        type: 'income'
      },
      {
        id: 1,
        date: new Date(2025, 2, 1),
        amount: 75000,
        description: 'Monthly Salary',
        category: 'Salary',
        type: 'income'
      },
      {
        id: 2,
        date: new Date(2025, 2, 5),
        amount: 25000,
        description: 'Rent Payment',
        category: 'Housing',
        type: 'expense'
      },
      {
        id: 3,
        date: new Date(2025, 2, 10),
        amount: 15000,
        description: 'Groceries',
        category: 'Food',
        type: 'expense'
      },
      {
        id: 4,
        date: new Date(2025, 2, 15),
        amount: 12000,
        description: 'Freelance Project',
        category: 'Extra Income',
        type: 'income'
      },
      {
        id: 5,
        date: new Date(2025, 2, 20),
        amount: 8000,
        description: 'Electricity Bill',
        category: 'Utilities',
        type: 'expense'
      },

      // February 2025
      {
        id: 6,
        date: new Date(2025, 1, 1),
        amount: 75000,
        description: 'Monthly Salary',
        category: 'Salary',
        type: 'income'
      },
      {
        id: 7,
        date: new Date(2025, 1, 3),
        amount: 25000,
        description: 'Rent Payment',
        category: 'Housing',
        type: 'expense'
      },
      {
        id: 8,
        date: new Date(2025, 1, 5),
        amount: 18000,
        description: 'Online Course',
        category: 'Education',
        type: 'expense'
      },
      {
        id: 9,
        date: new Date(2025, 1, 10),
        amount: 15000,
        description: 'Consulting Fee',
        category: 'Extra Income',
        type: 'income'
      },
      {
        id: 10,
        date: new Date(2025, 1, 15),
        amount: 12000,
        description: 'Groceries',
        category: 'Food',
        type: 'expense'
      },

      // January 2025
      {
        id: 11,
        date: new Date(2025, 0, 1),
        amount: 72000,
        description: 'Monthly Salary',
        category: 'Salary',
        type: 'income'
      },
      {
        id: 12,
        date: new Date(2025, 0, 5),
        amount: 25000,
        description: 'Rent Payment',
        category: 'Housing',
        type: 'expense'
      },
      {
        id: 13,
        date: new Date(2025, 0, 10),
        amount: 20000,
        description: 'New Laptop',
        category: 'Electronics',
        type: 'expense'
      },
      {
        id: 14,
        date: new Date(2025, 0, 15),
        amount: 8000,
        description: 'Internet Bill',
        category: 'Utilities',
        type: 'expense'
      },
      {
        id: 15,
        date: new Date(2025, 0, 20),
        amount: 18000,
        description: 'Part-time Work',
        category: 'Extra Income',
        type: 'income'
      },

      // December 2024
      {
        id: 16,
        date: new Date(2024, 11, 1),
        amount: 72000,
        description: 'Monthly Salary',
        category: 'Salary',
        type: 'income'
      },
      {
        id: 17,
        date: new Date(2024, 11, 5),
        amount: 25000,
        description: 'Rent Payment',
        category: 'Housing',
        type: 'expense'
      },
      {
        id: 18,
        date: new Date(2024, 11, 10),
        amount: 30000,
        description: 'Holiday Shopping',
        category: 'Shopping',
        type: 'expense'
      },
      {
        id: 19,
        date: new Date(2024, 11, 15),
        amount: 15000,
        description: 'Year-end Bonus',
        category: 'Bonus',
        type: 'income'
      },
      {
        id: 20,
        date: new Date(2024, 11, 20),
        amount: 12000,
        description: 'Groceries',
        category: 'Food',
        type: 'expense'
      },

      // November 2024
      {
        id: 21,
        date: new Date(2024, 10, 1),
        amount: 72000,
        description: 'Monthly Salary',
        category: 'Salary',
        type: 'income'
      },
      {
        id: 22,
        date: new Date(2024, 10, 5),
        amount: 25000,
        description: 'Rent Payment',
        category: 'Housing',
        type: 'expense'
      },
      {
        id: 23,
        date: new Date(2024, 10, 10),
        amount: 10000,
        description: 'Medical Checkup',
        category: 'Healthcare',
        type: 'expense'
      },
      {
        id: 24,
        date: new Date(2024, 10, 15),
        amount: 8000,
        description: 'Internet Bill',
        category: 'Utilities',
        type: 'expense'
      },
      {
        id: 25,
        date: new Date(2024, 10, 20),
        amount: 20000,
        description: 'Freelance Project',
        category: 'Extra Income',
        type: 'income'
      },

      // October 2024
      {
        id: 26,
        date: new Date(2024, 9, 1),
        amount: 70000,
        description: 'Monthly Salary',
        category: 'Salary',
        type: 'income'
      },
      {
        id: 27,
        date: new Date(2024, 9, 5),
        amount: 25000,
        description: 'Rent Payment',
        category: 'Housing',
        type: 'expense'
      },
      {
        id: 28,
        date: new Date(2024, 9, 10),
        amount: 15000,
        description: 'Groceries',
        category: 'Food',
        type: 'expense'
      },
      {
        id: 29,
        date: new Date(2024, 9, 15),
        amount: 7500,
        description: 'Mobile Bill',
        category: 'Utilities',
        type: 'expense'
      },
      {
        id: 30,
        date: new Date(2024, 9, 20),
        amount: 25000,
        description: 'Website Development',
        category: 'Extra Income',
        type: 'income'
      }
    ]);
  }

  getTransactions(): Observable<Transaction[]> {
    return this.transactions.asObservable();
  }

  getMonthlyTransactions(month: number, year: number): Observable<Transaction[]> {
    return this.transactions.pipe(
      map(transactions =>
        transactions.filter(transaction =>
          transaction.date.getMonth() === month &&
          transaction.date.getFullYear() === year
        )
      )
    );
  }

  getMonthlyStats(month: number, year: number): Observable<{
    income: number;
    expense: number;
    total: number;
  }> {
    return this.getMonthlyTransactions(month, year).pipe(
      map(transactions => {
        const income = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          income,
          expense,
          total: income - expense
        };
      })
    );
  }

  addTransaction(transaction: Omit<Transaction, 'id'>): void {
    const current = this.transactions.getValue();
    const newTransaction = {
      ...transaction,
      id: Math.max(...current.map(t => t.id), 0) + 1
    };
    this.transactions.next([...current, newTransaction]);
  }

  updateTransaction(transaction: Transaction): void {
    const current = this.transactions.getValue();
    const index = current.findIndex(t => t.id === transaction.id);
    if (index !== -1) {
      current[index] = transaction;
      this.transactions.next([...current]);
    }
  }

  deleteTransaction(id: number): void {
    const current = this.transactions.getValue();
    this.transactions.next(current.filter(t => t.id !== id));
  }
}
