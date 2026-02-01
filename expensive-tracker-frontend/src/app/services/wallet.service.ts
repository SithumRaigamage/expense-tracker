import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, catchError, throwError, of } from 'rxjs';
import { Wallet } from '../core/models/Wallet';
import { Metric } from '../core/models/Metric';
import { AuthService } from './auth.service';
import { CurrencyService } from '../core/services/currency.service';
import {
  faMoneyBillWave,
  faBuildingColumns,
  faCreditCard,
  faPiggyBank,
  faBitcoinSign,
  faChartLine,
  faHandHoldingDollar,
  faWallet,
  faHeartPulse
} from '@fortawesome/free-solid-svg-icons';

export interface WalletTransaction {
  amount: number;
  type: 'income' | 'expense';
  description: string;
  category: string;
  date: Date;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private apiUrl = 'http://localhost:3001/api/v1/wallets';
  private wallets = new BehaviorSubject<Wallet[]>([]);
  private error = new BehaviorSubject<string | null>(null);
  private loading = new BehaviorSubject<boolean>(false);
  private currentUserId: string | null = null;

  wallets$ = this.wallets.asObservable();
  error$ = this.error.asObservable();
  loading$ = this.loading.asObservable();

  private authService = inject(AuthService);
  private currencyService = inject(CurrencyService);

  constructor(private http: HttpClient) {
    // Subscribe to the current user to get the user ID
    this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user?.id || null;
      if (this.currentUserId) {
        this.loadWallets();
      } else {
        // Clear wallets if user is not authenticated
        this.wallets.next([]);
      }
    });
  }

  private getHttpOptions() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  private loadWallets(): void {
    if (!this.currentUserId) {
      this.error.next('Not authenticated. Please log in.');
      this.wallets.next([]);
      return;
    }

    this.loading.next(true);
    this.error.next(null);

    this.http.get<ApiResponse<Wallet[]>>(this.apiUrl, this.getHttpOptions())
      .pipe(
        map(response => response.data.map(wallet => ({
          ...wallet,
          id: wallet.id || (wallet as any)._id, // Handle both _id and id
          user: wallet.user || this.currentUserId || '' // Ensure user ID is present as string
        }))),
        catchError(error => {
          console.error('Error loading wallets:', error);
          let errorMessage = 'Failed to connect to the server. Please check if the backend is running.';

          if (error.status === 401) {
            errorMessage = 'You are not authorized. Please login again.';
          } else if (error.status === 404) {
            errorMessage = 'Wallets endpoint not found.';
          } else if (error.status === 0) {
            errorMessage = 'Cannot connect to the server. Please check if the backend is running on http://localhost:3001';
          }

          this.error.next(errorMessage);
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (wallets) => {
          this.wallets.next(wallets);
          this.loading.next(false);
        },
        error: () => {
          this.wallets.next([]);
          this.loading.next(false);
        }
      });
  }

  getWalletTypeIcon(type: string) {
    switch (type) {
      case 'bank': return faBuildingColumns;
      case 'cash': return faMoneyBillWave;
      case 'savings': return faPiggyBank;
      case 'credit': return faCreditCard;
      case 'crypto': return faBitcoinSign;
      case 'investment': return faChartLine;
      case 'loan': return faHandHoldingDollar;
      case 'emergencyfund': return faHeartPulse;
      default: return faWallet;
    }
  }

  getWalletTypeLabel(type: string) {
    switch (type) {
      case 'bank': return 'Bank Balance';
      case 'cash': return 'Cash in Hand';
      case 'savings': return 'Savings';
      case 'credit': return 'Credit Card';
      case 'crypto': return 'Crypto Assets';
      case 'investment': return 'Investments';
      case 'loan': return 'Loans';
      case 'emergencyfund': return 'Emergency Fund';
      default: return type;
    }
  }

  getTotalBalance(type: string): Observable<number> {
    return this.wallets$.pipe(
      map(wallets => wallets
        .filter(wallet => wallet.type === type)
        .reduce((acc, wallet) => acc + wallet.balance, 0)
      )
    );
  }

  addWallet(walletData: Omit<Wallet, 'id'>): Observable<Wallet> {
    if (!this.currentUserId) {
      return throwError(() => new Error('Not authenticated. Please log in.'));
    }

    // Add the user ID to the wallet data
    const walletWithUser = {
      ...walletData,
      user: this.currentUserId
    };

    return this.http.post<ApiResponse<Wallet>>(this.apiUrl, walletWithUser, this.getHttpOptions())
      .pipe(
        map(response => ({
          ...response.data,
          id: response.data.id || (response.data as any)._id
        })),
        tap(wallet => {
          const currentWallets = this.wallets.value;
          this.wallets.next([...currentWallets, wallet]);
        }),
        catchError(error => {
          console.error('Error adding wallet:', error);
          let errorMessage = 'Failed to add wallet. Please try again.';

          if (error.status === 401) {
            errorMessage = 'You are not authorized. Please login again.';
          } else if (error.status === 400) {
            if (error.error?.error?.includes('already exists')) {
              errorMessage = 'A wallet with this name already exists.';
            } else {
              errorMessage = 'Invalid wallet data. Please check your input.';
            }
          }

          throw new Error(errorMessage);
        })
      );
  }

  updateWallet(id: string, walletData: Partial<Wallet>): Observable<Wallet> {
    if (!this.currentUserId) {
      return throwError(() => new Error('Not authenticated. Please log in.'));
    }

    // Remove user field to prevent changing ownership
    const { user, ...dataToUpdate } = walletData;

    return this.http.put<ApiResponse<Wallet>>(`${this.apiUrl}/${id}`, dataToUpdate, this.getHttpOptions())
      .pipe(
        map(response => ({
          ...response.data,
          id: response.data.id || (response.data as any)._id
        })),
        tap(updatedWallet => {
          const currentWallets = this.wallets.value;
          const updatedWallets = currentWallets.map(w =>
            w.id === id ? { ...w, ...updatedWallet } : w
          );
          this.wallets.next(updatedWallets);
        }),
        catchError(error => {
          console.error('Error updating wallet:', error);
          let errorMessage = 'Failed to update wallet. Please try again.';

          if (error.status === 401) {
            errorMessage = 'You are not authorized. Please login again.';
          } else if (error.status === 404) {
            errorMessage = 'Wallet not found.';
          } else if (error.status === 400) {
            if (error.error?.error?.includes('already exists')) {
              errorMessage = 'A wallet with this name already exists.';
            } else {
              errorMessage = 'Invalid wallet data. Please check your input.';
            }
          }

          throw new Error(errorMessage);
        })
      );
  }

  deleteWallet(id: string): Observable<void> {
    if (!this.currentUserId) {
      return throwError(() => new Error('Not authenticated. Please log in.'));
    }

    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`, this.getHttpOptions())
      .pipe(
        map(() => void 0),
        tap(() => {
          const currentWallets = this.wallets.value;
          const filteredWallets = currentWallets.filter(w => w.id !== id);
          this.wallets.next(filteredWallets);
        }),
        catchError(error => {
          console.error('Error deleting wallet:', error);
          let errorMessage = 'Failed to delete wallet. Please try again.';

          if (error.status === 401) {
            errorMessage = 'You are not authorized. Please login again.';
          } else if (error.status === 404) {
            errorMessage = 'Wallet not found.';
          }

          throw new Error(errorMessage);
        })
      );
  }

  bulkDeleteWallets(walletIds: string[]): Observable<{ deletedCount: number; requestedCount: number }> {
    if (!this.currentUserId) {
      return throwError(() => new Error('Not authenticated. Please log in.'));
    }

    return this.http.delete<ApiResponse<{ deletedCount: number; requestedCount: number }>>(`${this.apiUrl}/bulk`, {
      ...this.getHttpOptions(),
      body: { walletIds, userId: this.currentUserId }
    })
      .pipe(
        map(response => response.data),
        tap(() => {
          const currentWallets = this.wallets.value;
          const filteredWallets = currentWallets.filter(w => !walletIds.includes(w.id));
          this.wallets.next(filteredWallets);
        }),
        catchError(error => {
          console.error('Error bulk deleting wallets:', error);
          let errorMessage = 'Failed to delete wallets. Please try again.';

          if (error.status === 401) {
            errorMessage = 'You are not authorized. Please login again.';
          } else if (error.status === 400) {
            errorMessage = 'Invalid wallet IDs provided.';
          }

          throw new Error(errorMessage);
        })
      );
  }

  restoreWallet(id: string): Observable<Wallet> {
    if (!this.currentUserId) {
      return throwError(() => new Error('Not authenticated. Please log in.'));
    }

    return this.http.patch<ApiResponse<Wallet>>(`${this.apiUrl}/${id}/restore`, { userId: this.currentUserId }, this.getHttpOptions())
      .pipe(
        map(response => ({
          ...response.data,
          id: response.data.id || (response.data as any)._id,
          user: response.data.user || this.currentUserId || ''
        })),
        tap(restoredWallet => {
          const currentWallets = this.wallets.value;
          this.wallets.next([...currentWallets, restoredWallet]);
        }),
        catchError(error => {
          console.error('Error restoring wallet:', error);
          let errorMessage = 'Failed to restore wallet. Please try again.';

          if (error.status === 401) {
            errorMessage = 'You are not authorized. Please login again.';
          } else if (error.status === 404) {
            errorMessage = 'Deleted wallet not found.';
          } else if (error.status === 400) {
            if (error.error?.error?.includes('already exists')) {
              errorMessage = 'A wallet with this name already exists. Please rename the existing wallet first.';
            } else {
              errorMessage = 'Cannot restore this wallet.';
            }
          }

          throw new Error(errorMessage);
        })
      );
  }

  /**
   * Add multiple wallets in bulk
   * @param wallets Array of wallet data objects to be added
   * @returns Observable with success and failure counts and failure details
   */
  bulkAddWallets(wallets: Omit<Wallet, 'id' | 'user'>[]): Observable<{
    successCount: number;
    failedCount: number;
    failedWallets?: Array<{name: string; error: string}>;
  }> {
    if (!this.currentUserId) {
      return throwError(() => new Error('Not authenticated. Please log in.'));
    }

    if (!wallets.length) {
      return of({ successCount: 0, failedCount: 0 });
    }

    return new Observable<{
      successCount: number;
      failedCount: number;
      failedWallets?: Array<{name: string; error: string}>;
    }>(observer => {
      let successCount = 0;
      let failedCount = 0;
      let completed = 0;
      const total = wallets.length;
      const failedWalletsList: Array<{name: string; error: string}> = [];

      wallets.forEach(wallet => {
        const walletWithUser = {
          ...wallet,
          user: this.currentUserId || ''
        };

        this.addWallet(walletWithUser).subscribe({
          next: () => {
            successCount++;
            completed++;
            if (completed === total) {
              observer.next({
                successCount,
                failedCount,
                failedWallets: failedWalletsList.length > 0 ? failedWalletsList : undefined
              });
              this.refreshWallets();
              observer.complete();
            }
          },
          error: (error) => {
            console.error(`Error adding wallet "${wallet.name}":`, error);
            failedCount++;
            completed++;
            failedWalletsList.push({
              name: wallet.name,
              error: error.message || 'Unknown error'
            });

            if (completed === total) {
              observer.next({
                successCount,
                failedCount,
                failedWallets: failedWalletsList.length > 0 ? failedWalletsList : undefined
              });
              this.refreshWallets();
              observer.complete();
            }
          }
        });
      });
    });
  }

  /**
   * Transfer funds between wallets
   * @param fromWalletId Source wallet ID
   * @param toWalletId Destination wallet ID
   * @param amount Amount to transfer
   * @param description Optional description
   * @returns Observable with transfer result
   */
  transferFunds(fromWalletId: string, toWalletId: string, amount: number, description?: string): Observable<any> {
    if (!this.currentUserId) {
      return throwError(() => new Error('Not authenticated. Please log in.'));
    }

    const transferData = { fromWalletId, toWalletId, amount, description };

    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/transfer`, transferData, this.getHttpOptions())
      .pipe(
        tap(() => this.refreshWallets()),
        catchError(error => {
          console.error('Error transferring funds:', error);
          let errorMessage = error.error?.error || 'Failed to transfer funds. Please try again.';
          throw new Error(errorMessage);
        })
      );
  }

  getWalletStats(): Observable<any> {
    if (!this.currentUserId) {
      return throwError(() => new Error('Not authenticated. Please log in.'));
    }

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/stats`, this.getHttpOptions())
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error getting wallet stats:', error);
          throw new Error('Failed to get wallet statistics.');
        })
      );
  }

  getExpenseFlow(): Observable<any> {
    if (!this.currentUserId) {
      return throwError(() => new Error('Not authenticated. Please log in.'));
    }

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/flow`, this.getHttpOptions())
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error getting expense flow:', error);
          throw new Error('Failed to get expense flow data.');
        })
      );
  }

  getAllWallets(): Observable<Wallet[]> {
    return this.wallets$;
  }

  getTotalAssets(): Observable<number> {
    return this.wallets$.pipe(
      map(wallets => wallets.reduce((acc, w) => {
        // Always sum up in LKR to provide a consistent base for the appCurrency pipe
        const balanceInLKR = this.currencyService.convert(w.balance, w.currency, 'LKR');
        return acc + balanceInLKR;
      }, 0))
    );
  }

  getMetrics(): Observable<Metric[]> {
    return this.wallets$.pipe(
      map(wallets => {
        if (!wallets.length) return [];
        
        const primaryCurrency = wallets[0].primaryCurrency || 'LKR';
        const types = [...new Set(wallets.map(w => w.type))];
        
        return types.map(type => {
          const totalBalance = wallets
            .filter(w => w.type === type)
            .reduce((acc, w) => acc + this.currencyService.convert(w.balance, w.currency, 'LKR'), 0);

          return {
            icon: this.getWalletTypeIcon(type),
            label: this.getWalletTypeLabel(type),
            value: totalBalance,
            percentage: 0,
            trend: totalBalance < 0 ? 'down' : 'up',
            currency: 'LKR'
          };
        });
      })
    );
  }

  getWalletById(id: string): Wallet | undefined {
    return this.wallets.getValue().find(wallet => wallet.id === id);
  }

  addTransaction(walletId: string, transaction: WalletTransaction): void {
    const wallet = this.getWalletById(walletId);
    if (!wallet) return;

    const updatedWallet = {
      ...wallet,
      balance: wallet.balance + transaction.amount
    };

    this.updateWallet(walletId, updatedWallet).subscribe();
  }

  refreshWallets(): void {
    this.loadWallets();
  }

  clearError(): void {
    this.error.next(null);
  }

  isUserAuthenticated(): boolean {
    return !!this.currentUserId;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }
}
