import { Wallet } from '../../../core/models/Wallet';
import { CommonModule } from '@angular/common';
import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WalletService } from '../../../services/wallet.service';
import { RouterModule } from '@angular/router';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { faWallet } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-manage-wallets',
  imports: [CommonModule, RouterModule, AppCurrencyPipe, EmptyStateComponent],
  templateUrl: './manage-wallets.component.html',
})
export class ManageWalletsComponent implements OnInit {
  private wallet = inject(WalletService);

  private readonly destroyRef = inject(DestroyRef);

  readonly faWallet = faWallet;
  wallets: Wallet[] = [];

  ngOnInit(): void {
    this.wallet.getAllWallets().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(wallets => {
      this.wallets = wallets;
    });

  }

  /**
   * Tile colour per wallet type.
   *
   * Was four saturated `bg-*-500` fills with white glyphs, which made this
   * widget the loudest thing on the dashboard and did not match the softer
   * tinted tiles the Wallets page uses. It also covered only four of the eight
   * types, so investment, crypto, loan and emergency-fund wallets all fell back
   * to grey. Same palette as the Wallets page now, and complete.
   */
  getWalletIconClass(type: string): string {
    const typeClasses: Record<string, string> = {
      'cash': 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/15',
      'bank': 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-500/15',
      'credit': 'text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-500/15',
      'savings': 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/15',
      'crypto': 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-500/15',
      'investment': 'text-sky-600 bg-sky-100 dark:text-sky-400 dark:bg-sky-500/15',
      'loan': 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-500/15',
      'emergencyfund': 'text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-500/15'
    };

    return typeClasses[type] || 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-white/10';
  }

  /**
   * Human-readable wallet type. The raw stored value was printed straight into
   * the card, so users saw "emergencyfund" and "bank" in lower case.
   */
  getWalletTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      cash: 'Cash',
      bank: 'Bank',
      credit: 'Credit',
      savings: 'Savings',
      crypto: 'Crypto',
      investment: 'Investment',
      loan: 'Loan',
      emergencyfund: 'Emergency fund'
    };
    return labels[type] ?? type;
  }
}
