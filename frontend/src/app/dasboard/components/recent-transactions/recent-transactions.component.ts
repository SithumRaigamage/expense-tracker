import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../../../shared/badge/badge.component';
import { TransactionService } from '../../../services/transaction.service';
import { Transaction } from '../../../models/Transaction';

@Component({
  selector: 'app-recent-transactions',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  templateUrl: './recent-transactions.component.html'
})
export class RecentTransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  displayedTransactions: Transaction[] = [];
  showAll: boolean = false;
  private readonly INITIAL_DISPLAY_COUNT = 5; // Changed to show fewer items initially

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    this.loadRecentTransactions();
  }

  private loadRecentTransactions(): void {
    // Get all recent transactions regardless of month
    this.transactionService.getRecentTransactions(20).subscribe({
      next: (transactions) => {
        // Sort transactions by date in descending order (most recent first)
        this.transactions = transactions.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.updateDisplayedTransactions();
        console.log('Loaded transactions:', this.transactions);
        console.log('Loaded transactions length:', this.transactions.length);
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
      }
    });
  }

  toggleViewAll() {
    this.showAll = !this.showAll;
    this.updateDisplayedTransactions();
  }

  private updateDisplayedTransactions() {
    if (this.showAll) {
      this.displayedTransactions = [...this.transactions];
    } else {
      this.displayedTransactions = this.transactions.slice(0, this.INITIAL_DISPLAY_COUNT);
    }
  }

  getBadgeColor(type: string): 'success' | 'error' {
    return type === 'income' ? 'success' : 'error';
  }

  formatCurrency(amount: number): string {
    return `LKR ${amount.toLocaleString()}`;
  }

  formatDate(date: Date | string): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  refreshTransactions(): void {
    this.transactionService.refreshTransactions();
    this.loadRecentTransactions();
  }
}
