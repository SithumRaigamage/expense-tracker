import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RadialChartComponent } from '../radialchart/radialchart.component';

@Component({
  selector: 'app-monthly-target',
  standalone: true,
  imports: [CommonModule, RadialChartComponent],
  templateUrl: './monthly-target.component.html',
  styleUrl: './monthly-target.component.css'
})
export class MonthlyTargetComponent {
  monthlyTarget = 150000;
  currentSavings = 112500;
  lastMonthSavings = 95000;

  getSavingsPercentage(): number {
    return (this.currentSavings / this.monthlyTarget) * 100;
  }

  getSavingsChange(): number {
    return ((this.currentSavings - this.lastMonthSavings) / this.lastMonthSavings) * 100;
  }

  formatCurrency(amount: number): string {
    return `LKR ${amount.toLocaleString()}`;
  }
}
