import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Wallet } from '../models/Wallet';

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
    }
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
}
