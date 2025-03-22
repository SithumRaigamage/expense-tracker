import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { Wallet } from '../models/Wallet';
import { Metric } from '../models/Metric';
import {
  faMoneyBillWave,
  faBuildingColumns,
  faCreditCard,
  faPiggyBank,
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
      balance: 1500.00,
      currency: 'LKR'
    },
    {
      id: '2',
      name: 'Bank Account',
      type: 'bank',
      balance: 10000.00,
      currency: 'LKR',
    },
    {
      id: '3',
      name: 'Savings Account',
      type: 'savings',
      balance: 100000.00,
      currency: 'LKR',
    },
    {
      id: '4',
      name: 'Credit Card',
      type: 'credit',
      balance: 50000.00,
      currency: 'LKR',
    },
  ]);

  wallets$ = this.wallets.asObservable();

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
    return combineLatest([
      this.getTotalBalance('bank'),
      this.getTotalBalance('cash'),
      this.getTotalBalance('savings'),
      this.getTotalBalance('credit')
    ]).pipe(
      map(([bankTotal, cashTotal, savingsTotal, creditTotal]) => [
        {
          icon: faBuildingColumns,
          label: 'Bank Balance',
          value: bankTotal,
          percentage: 0,
          trend: 'up',
          currency: 'LKR'
        },
        {
          icon: faMoneyBillWave,
          label: 'Cash in Hand',
          value: cashTotal,
          percentage: 0,
          trend: 'up',
          currency: 'LKR'
        },
        {
          icon: faPiggyBank,
          label: 'Savings',
          value: savingsTotal,
          percentage: 0,
          trend: 'up',
          currency: 'LKR'
        },
        {
          icon: faCreditCard,
          label: 'Credit Card',
          value: creditTotal,
          percentage: 0,
          trend: creditTotal >= 0 ? 'up' : 'down',
          currency: 'LKR'
        }
      ])
    );
  }
}
