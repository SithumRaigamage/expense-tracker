import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, catchError, throwError } from 'rxjs';
import { Wallet } from '../models/Wallet';
import { Metric } from '../models/Metric';
import { AuthService } from './auth.service';
import {
  faMoneyBillWave,
  faBuildingColumns,
  faCreditCard,
  faPiggyBank,
  faBitcoinSign,
  faChartLine,
  faHandHoldingDollar,
  faWallet
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

  wallets$ = this.wallets.asObservable();
  error$ = this.error.asObservable();
  loading$ = this.loading.asObservable();

  private authService = inject(AuthService);

  constructor(private http: HttpClient) {
    this.loadWallets();
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
    this.loading.next(true);
    this.error.next(null);

    this.http.get<ApiResponse<Wallet[]>>(this.apiUrl, this.getHttpOptions())
      .pipe(
        map(response => response.data),
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
    return this.http.post<ApiResponse<Wallet>>(this.apiUrl, walletData, this.getHttpOptions())
      .pipe(
        map(response => response.data),
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
            errorMessage = 'Invalid wallet data. Please check your input.';
          }

          throw new Error(errorMessage);
        })
      );
  }

  updateWallet(id: string, walletData: Partial<Wallet>): Observable<Wallet> {
    return this.http.put<ApiResponse<Wallet>>(`${this.apiUrl}/${id}`, walletData, this.getHttpOptions())
      .pipe(
        map(response => response.data),
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
            errorMessage = 'Invalid wallet data. Please check your input.';
          }

          throw new Error(errorMessage);
        })
      );
  }

  deleteWallet(id: string): Observable<void> {
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

  getAllWallets(): Observable<Wallet[]> {
    return this.wallets$;
  }

  getMetrics(): Observable<Metric[]> {
    return this.wallets$.pipe(
      map(wallets => {
        const types = [...new Set(wallets.map(w => w.type))];

        return types.map(type => {
          const totalBalance = wallets
            .filter(w => w.type === type)
            .reduce((acc, w) => acc + w.balance, 0);

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
}
