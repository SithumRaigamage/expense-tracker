import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { faChartColumn } from '@fortawesome/free-solid-svg-icons';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MonthlyTransactionTabComponent } from '../../../shared/components/monthly-transaction-tab/monthly-transaction-tab.component';
import { TransactionService } from '../../../services/transaction.service';
import { Transaction } from '../../../core/models/Transaction';

@Component({
  selector: 'app-monthly-stat',
  standalone: true,
  imports: [ChartComponent, EmptyStateComponent, MonthlyTransactionTabComponent],
  templateUrl: './monthly-stat.component.html'
})
export class MonthlyStatComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  faChartColumn = faChartColumn;
  currentChartType: 'income' | 'expense' | 'all' = 'all';
  currentMonthStats = {
    income: 0,
    expense: 0,
    total: 0
  };
  transactions: Transaction[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    const currentDate = new Date();
    this.isLoading = true;
    this.errorMessage = '';

    // Get monthly stats
    this.transactionService.getMonthlyStats(
      currentDate.getMonth(),
      currentDate.getFullYear()
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (stats) => {
        this.currentMonthStats = stats;
      },
      error: (error) => {
        console.error('Error loading monthly stats:', error);
        this.errorMessage = 'Failed to load monthly statistics';
      }
    });

    // Get all transactions for the chart
    this.transactionService.getTransactions().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.errorMessage = 'Failed to load transactions';
        this.isLoading = false;
      }
    });
  }

  onTabChanged(type: 'income' | 'expense' | 'all'): void {
    this.currentChartType = type;
  }

  refreshData(): void {
    this.loadData();
  }
}
