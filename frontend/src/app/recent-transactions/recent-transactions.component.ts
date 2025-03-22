import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../dasboard/badge/badge.component';
import { TransactionService } from '../services/transaction.service';
import { Transaction } from '../models/Transaction';

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
  private readonly INITIAL_DISPLAY_COUNT = 4;

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    const currentDate = new Date();
    this.transactionService.getMonthlyTransactions(
      currentDate.getMonth(),
      currentDate.getFullYear()
    ).subscribe(transactions => {
      this.transactions = transactions;
      this.updateDisplayedTransactions();
    });
  }

  toggleViewAll() {
    this.showAll = !this.showAll;
    this.updateDisplayedTransactions();
  }

  private updateDisplayedTransactions() {
    this.displayedTransactions = this.showAll
      ? this.transactions
      : this.transactions.slice(0, this.INITIAL_DISPLAY_COUNT);
  }

  getBadgeColor(type: string): 'success' | 'error' {
    return type === 'income' ? 'success' : 'error';
  }

  formatCurrency(amount: number): string {
    return `LKR ${amount.toLocaleString()}`;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
