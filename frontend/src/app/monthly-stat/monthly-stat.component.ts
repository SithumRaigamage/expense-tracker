import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent } from '../chart/chart.component';

@Component({
  selector: 'app-monthly-stat',
  standalone: true,
  imports: [CommonModule, ChartComponent],
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
