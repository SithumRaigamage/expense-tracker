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

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    const currentDate = new Date();
    this.transactionService.getMonthlyTransactions(
      currentDate.getMonth(),
      currentDate.getFullYear()
    ).subscribe(transactions => {
      this.transactions = transactions;
      console.log(transactions);
    });
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
