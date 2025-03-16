import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../badge/badge.component';
import { Metric } from '../../models/Metric';

@Component({
  selector: 'app-metrics',
  imports: [CommonModule, BadgeComponent],
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.css'],
  standalone: true
})
export class MetricsComponent {
  metrics: Metric[] = [
    {
      icon: 'fa-building-columns', // Bank icon
      label: 'Bank Balance',
      value: 125000,
      percentage: 15.25,
      trend: 'up',
      currency: 'LKR'
    },
    {
      icon: 'fa-wallet', // Wallet icon
      label: 'Cash in Hand',
      value: 25000,
      percentage: 8.15,
      trend: 'down',
      currency: 'LKR'
    }
  ];

  // Helper method to format currency
  formatCurrency(value: number): string {
    return `${value.toLocaleString('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    })}`;
  }
}
