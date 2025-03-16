import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent } from '../chart/chart.component';
import { ChartTabComponent } from "../chart-tab/chart-tab.component";
import { MonthlyTransactionTabComponent } from "../monthly-transaction-tab/monthly-transaction-tab.component";

@Component({
  selector: 'app-monthly-stat',
  standalone: true,
  imports: [CommonModule, ChartComponent, ChartTabComponent, MonthlyTransactionTabComponent],
  templateUrl: './monthly-stat.component.html'
})
export class MonthlyStatComponent {
  isDropdownOpen = false;

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }
}
