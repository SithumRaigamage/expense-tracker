import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent } from '../chart/chart.component';
import { MonthlyTransactionTabComponent } from '../monthly-transaction-tab/monthly-transaction-tab.component';

@Component({
  selector: 'app-monthly-stat',
  standalone: true,
  imports: [CommonModule, ChartComponent, MonthlyTransactionTabComponent],
  templateUrl: './monthly-stat.component.html'
})
export class MonthlyStatComponent {
  currentChartType: 'income' | 'expense' | 'all' = 'all';

  onTabChanged(type: 'income' | 'expense' | 'all'): void {
    this.currentChartType = type;
  }
}
