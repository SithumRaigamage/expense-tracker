import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, catchError, throwError, of, distinctUntilChanged } from 'rxjs';
import { Transaction } from '../core/models/Transaction';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { WalletService } from './wallet.service';

/** Label for an entry whose category no longer exists. */
export const UNCATEGORIZED = 'Uncategorized';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface Category {
  _id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  user?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface ExpenseResponse {
  _id: string;
  amount: number;
  description: string;
  /** Null when the category was deleted out from under the entry (audit M2). */
  category: Category | null;
  wallet: string | { _id: string; name: string; type: string };
  date: string;
  user: string;
  createdAt: string;
  updatedAt: string;
}

interface MonthlyStats {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  transactionCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private walletService = inject(WalletService);
  private loadedUserId: string | null = null;
  private creatingDefaults = false;

  private apiUrl = environment.apiUrl;
  private transactions = new BehaviorSubject<Transaction[]>([]);
  private categories = new BehaviorSubject<Category[]>([]);

  constructor() {
    this.authService.currentUser$.pipe(
      map(user => user?.id ?? null),
      distinctUntilChanged()
    ).subscribe(userId => {
      if (userId) {
        this.loadedUserId = userId;
        this.loadCategories();
        this.loadTransactions();
      } else {
        this.loadedUserId = null;
        this.transactions.next([]);
        this.categories.next([]);
      }
    });
  }

  private loadCategories(): void {

    this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}/categories`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      )
      .subscribe({
        next: (categories) => {
          //console.log('Categories loaded:', categories);
          this.categories.next(categories);
          // If no categories exist, create default ones
          if (categories.length === 0) {
            this.createDefaultCategories();
          }
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      });
  }

  private createDefaultCategories(): void {
    if (this.creatingDefaults) return;
    this.creatingDefaults = true;
    this.http.post<ApiResponse<Category[]>>(`${this.apiUrl}/categories/defaults`, {})
      .pipe(
        map(response => response.data),
        catchError((error) => {
          console.error('Error creating default categories, falling back to manual creation:', error);
          // Fallback: create categories manually
          return this.createCategoriesManually();
        })
      )
      .subscribe({
        next: (categories) => {
          this.categories.next(categories);
          this.creatingDefaults = false;
        },
        error: (error) => {
          console.error('Final error creating default categories:', error);
          this.creatingDefaults = false;
        }
      });
  }

  private createCategoriesManually(): Observable<Category[]> {
    const defaultCategories = [
      { name: 'Salary', type: 'income' as const },
      { name: 'Freelance', type: 'income' as const },
      { name: 'Investment', type: 'income' as const },
      { name: 'Food', type: 'expense' as const },
      { name: 'Transportation', type: 'expense' as const },
      { name: 'Entertainment', type: 'expense' as const },
      { name: 'Utilities', type: 'expense' as const },
      { name: 'Healthcare', type: 'expense' as const }
    ];


    return new Observable<Category[]>(observer => {
      const createdCategories: Category[] = [];
      let completedRequests = 0;

      defaultCategories.forEach(category => {
        this.http.post<ApiResponse<Category>>(`${this.apiUrl}/categories`, category)
          .pipe(
            map(response => response.data),
            catchError(error => {
              console.error('Error creating category:', category.name, error);
              return of(null);
            })
          )
          .subscribe({
            next: (created) => {
              if (created) {
                createdCategories.push(created);
              }
              completedRequests++;

              if (completedRequests === defaultCategories.length) {
                observer.next(createdCategories);
                observer.complete();
              }
            },
            error: (error) => {
              console.error('Error in category creation:', error);
              completedRequests++;

              if (completedRequests === defaultCategories.length) {
                observer.next(createdCategories);
                observer.complete();
              }
            }
          });
      });
    });
  }

  private loadTransactions(): void {

    // Set a large limit to get all transactions
    const params = { limit: '1000', page: '1' };

    this.http.get<ApiResponse<ExpenseResponse[]>>(`${this.apiUrl}/expenses`, { params })
      .pipe(
        map(response => response.data),
        map(expenses => this.mapExpensesToTransactions(expenses)),
        catchError(this.handleError)
      )
      .subscribe({
        next: (transactions) => {
          this.transactions.next(transactions);
        },
        error: (error) => {
          console.error('Error loading transactions:', error);
        }
      });
  }

  /**
   * The expenses endpoint sends `wallet` populated on some routes and as a bare
   * id on others. Both shapes have always been handled here; this just names the
   * two cases so the compiler can check them.
   */
  private static walletFields(wallet: ExpenseResponse['wallet']): Pick<Transaction, 'walletId' | 'wallet'> {
    if (typeof wallet === 'string') {
      return { walletId: wallet, wallet: undefined };
    }
    if (!wallet) {
      return { walletId: '', wallet: undefined };
    }
    return { walletId: wallet._id, wallet: { name: wallet.name, type: wallet.type } };
  }

  /**
   * One API expense as a UI transaction. An entry whose category was deleted
   * comes back with `category: null`; reading `.name` on it threw and emptied
   * the whole list, so it's shown as "Uncategorized" instead.
   */
  static toTransaction(expense: ExpenseResponse): Transaction {
    return {
      id: expense._id,
      amount: expense.amount,
      description: expense.description,
      category: expense.category?.name ?? UNCATEGORIZED,
      type: expense.category?.type ?? 'expense',
      date: new Date(expense.date),
      ...TransactionService.walletFields(expense.wallet)
    };
  }

  private mapExpensesToTransactions(expenses: ExpenseResponse[]): Transaction[] {
    return expenses.map(TransactionService.toTransaction);
  }

  getTransactions(): Observable<Transaction[]> {
    return this.transactions.asObservable();
  }

  getAllTransactions(): Observable<Transaction[]> {
    // Force a refresh of transactions with a large limit to get all
    this.loadTransactions();
    return this.transactions.asObservable();
  }

  getCategories(): Observable<Category[]> {
    return this.categories.asObservable();
  }

  getRecentTransactions(limit = 10): Observable<Transaction[]> {
    return this.transactions.pipe(
      map(transactions => {
        // Sort transactions by date, most recent first
        return [...transactions]
          .sort((a, b) => {
            const dateA = a.date instanceof Date ? a.date : new Date(a.date);
            const dateB = b.date instanceof Date ? b.date : new Date(b.date);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, limit);
      })
    );
  }

  getMonthlyTransactions(month: number, year: number): Observable<Transaction[]> {
    return this.transactions.pipe(
      map(transactions => {
        return transactions.filter(transaction => {
          const transDate = transaction.date instanceof Date
            ? transaction.date
            : new Date(transaction.date);

          return transDate.getMonth() === month &&
                 transDate.getFullYear() === year;
        });
      })
    );
  }

  getMonthlyStats(month: number, year: number): Observable<{
    income: number;
    expense: number;
    total: number;
  }> {
    if (!this.authService.isAuthenticated()) {
      return of({ income: 0, expense: 0, total: 0 });
    }

    // Call backend API for monthly stats
    const params = { month: month + 1, year }; // Backend expects 1-based month
    return this.http.get<ApiResponse<MonthlyStats>>(`${this.apiUrl}/expenses/monthly-stats`, { params })
      .pipe(
        map(response => ({
          income: response.data.totalIncome,
          expense: response.data.totalExpenses,
          total: response.data.netSavings
        })),
        catchError(() => {
          // Fallback to client-side calculation
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
        })
      );
  }

  addTransaction(transaction: Omit<Transaction, 'id'>): Observable<Transaction> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Find the category ID based on the category name or ID
    const categories = this.categories.getValue();
    const category = categories.find(cat => 
      cat.name === transaction.category || cat._id === transaction.category
    );

    if (!category) {
      console.error('Category not found. Available categories:', categories);
      console.error('Looking for category:', transaction.category);
      return throwError(() => new Error('Category not found'));
    }

    const expenseData = {
      amount: transaction.amount,
      description: transaction.description,
      category: category._id,
      wallet: transaction.walletId,
      date: transaction.date
    };

    return this.http.post<ApiResponse<ExpenseResponse>>(`${this.apiUrl}/expenses`, expenseData)
      .pipe(
        map(response => TransactionService.toTransaction(response.data)),
        tap(newTransaction => {
          const current = this.transactions.getValue();
          this.transactions.next([...current, newTransaction]);
          this.walletService.refresh();
        }),
        catchError(this.handleError)
      );
  }

  updateTransaction(transaction: Transaction): Observable<Transaction> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Find the category ID based on the category name or ID
    const categories = this.categories.getValue();
    const category = categories.find(cat => 
      cat.name === transaction.category || cat._id === transaction.category
    );

    if (!category) {
      console.error('Category not found. Available categories:', categories);
      console.error('Looking for category:', transaction.category);
      return throwError(() => new Error('Category not found'));
    }

    const expenseData = {
      amount: transaction.amount,
      description: transaction.description,
      category: category._id,
      wallet: transaction.walletId,
      date: transaction.date
    };

    return this.http.put<ApiResponse<ExpenseResponse>>(`${this.apiUrl}/expenses/${transaction.id}`, expenseData)
      .pipe(
        map(response => TransactionService.toTransaction(response.data)),
        tap(updatedTransaction => {
          const current = this.transactions.getValue();
          const index = current.findIndex(t => t.id === updatedTransaction.id);
          if (index !== -1) {
            current[index] = updatedTransaction;
            this.transactions.next([...current]);
          }
          this.walletService.refresh();
        }),
        catchError(this.handleError)
      );
  }

  deleteTransaction(id: string | number): Observable<void> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.delete<ApiResponse<unknown>>(`${this.apiUrl}/expenses/${id}`)
      .pipe(
        tap(() => {
          const current = this.transactions.getValue();
          this.transactions.next(current.filter(t => t.id !== id));
          this.walletService.refresh();
        }),
        map(() => void 0),
        catchError(this.handleError)
      );
  }

  /**
   * Add multiple transactions in bulk
   * @param transactions Array of transaction data objects to be added
   * @returns Observable with success and failure counts and failure details
   */
  bulkAddTransactions(transactions: Omit<Transaction, 'id'>[]): Observable<{
    successCount: number;
    failedCount: number;
    failedTransactions?: {description: string; error: string}[];
  }> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Check if transactions array is empty
    if (!transactions.length) {
      return of({ successCount: 0, failedCount: 0 });
    }

    // Since many backends might not have a bulk endpoint, implement the sequential approach
    return new Observable<{
      successCount: number;
      failedCount: number;
      failedTransactions?: {description: string; error: string}[];
    }>(observer => {
      let successCount = 0;
      let failedCount = 0;
      let completed = 0;
      const total = transactions.length;
      const failedTransactions: {description: string; error: string}[] = [];

      // Process transactions one by one
      transactions.forEach(transaction => {
        this.addTransaction(transaction).subscribe({
          next: () => {
            successCount++;
            completed++;
            if (completed === total) {
              this.walletService.refresh();
              observer.next({
                successCount,
                failedCount,
                failedTransactions: failedTransactions.length > 0 ? failedTransactions : undefined
              });
              observer.complete();
            }
          },
          error: (error) => {
            console.error(`Error adding transaction "${transaction.description}":`, error);
            failedCount++;
            completed++;

            // Track failed transaction details
            failedTransactions.push({
              description: transaction.description,
              error: error.message || 'Unknown error'
            });

            if (completed === total) {
              observer.next({
                successCount,
                failedCount,
                failedTransactions: failedTransactions.length > 0 ? failedTransactions : undefined
              });
              observer.complete();
            }
          }
        });
      });
    });
  }

  refreshTransactions(): void {
    this.loadTransactions();
  }

  refreshCategories(): void {
    this.loadCategories();
  }

  // Method to ensure categories are loaded
  ensureCategoriesLoaded(): Observable<Category[]> {
    return this.categories.pipe(
      tap(categories => {
        if (categories.length === 0) {
          this.loadCategories();
        }
      })
    );
  }

  // Public method to force create categories
  createCategories(): Observable<Category[]> {
    return this.createCategoriesManually().pipe(
      tap(categories => {
        this.categories.next(categories);
      })
    );
  }

  // Public method to force refresh categories
  forceRefreshCategories(): Observable<Category[]> {

    // Add cache busting parameter to force fresh data
    const cacheBuster = new Date().getTime();
    return this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}/categories?_=${cacheBuster}`)
      .pipe(
        map(response => response.data),
        tap(categories => {
          this.categories.next(categories);
        }),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Transaction Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
