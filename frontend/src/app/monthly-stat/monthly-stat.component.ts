import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent } from '../chart/chart.component';
import { MonthlyTransactionTabComponent } from '../monthly-transaction-tab/monthly-transaction-tab.component';
import { TransactionService } from '../services/transaction.service';
import { Transaction } from '../models/Transaction';

@Component({
  selector: 'app-monthly-stat',
  standalone: true,
  imports: [CommonModule, ChartComponent, MonthlyTransactionTabComponent],
  templateUrl: './monthly-stat.component.html'
})
export class MonthlyStatComponent implements OnInit {
  currentChartType: 'income' | 'expense' | 'all' = 'all';
  currentMonthStats = {
    income: 0,
    expense: 0,
    total: 0
  };
  transactions: Transaction[] = [];

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    const currentDate = new Date();

    // Get monthly stats
    this.transactionService.getMonthlyStats(
      currentDate.getMonth(),
      currentDate.getFullYear()
    ).subscribe(stats => {
      this.currentMonthStats = stats;
    });

    // Get all transactions for the chart
    this.transactionService.getTransactions().subscribe(transactions => {
      this.transactions = transactions;
    });
  }

  onTabChanged(type: 'income' | 'expense' | 'all'): void {
    this.currentChartType = type;
  }
}
