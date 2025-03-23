import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { Wallet } from '../models/Wallet';
import { Metric } from '../models/Metric';
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

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private wallets = new BehaviorSubject<Wallet[]>([
    {
      id: '1',
      name: 'Main Wallet',
      type: 'cash',
      balance: 15000.00,
      currency: 'LKR'
    },
    {
      id: '2',
      name: 'BOC Account',
      type: 'bank',
      balance: 100000.00,
      currency: 'LKR',
    },
    {
      id: '3',
      name: 'Fixed Deposit',
      type: 'savings',
      balance: 100000.00,
      currency: 'LKR',
    },
    {
      id: '4',
      name: 'Credit Card',
      type: 'credit',
      balance: -5000.00,  // Negative balance for credit
      currency: 'LKR',
    },
    {
      id: '5',
      name: 'Personal Loan',
      type: 'loan',
      balance: -150000.00,  // Negative balance for loans
      currency: 'LKR',
    }
  ]);

  wallets$ = this.wallets.asObservable();

  private getWalletTypeIcon(type: string) {
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

  private getWalletTypeLabel(type: string) {
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

  addWallet(wallet: Omit<Wallet, 'id'>): void {
    const newWallet = {
      ...wallet,
      id: Date.now().toString()
    };
    this.wallets.next([...this.wallets.value, newWallet]);
  }

  updateWallet(id: string, wallet: Partial<Wallet>): void {
    const updatedWallets = this.wallets.value.map(w =>
      w.id === id ? { ...w, ...wallet } : w
    );
    this.wallets.next(updatedWallets);
  }

  deleteWallet(id: string): void {
    const filteredWallets = this.wallets.value.filter(w => w.id !== id);
    this.wallets.next(filteredWallets);
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
            trend: totalBalance < 0 ? 'down' : 'up', // Changed trend calculation
            currency: 'LKR'
          };
        });
      })
    );
  }
}
