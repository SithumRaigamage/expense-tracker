import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../badge/badge.component';
import { Metric } from '../../models/Metric';
import { WalletService } from '../../services/wallet.service';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-metrics',
  imports: [CommonModule, BadgeComponent],
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.css'],
  standalone: true
})
export class MetricsComponent implements OnInit {
  metrics: Metric[] = [];

  constructor(private walletService: WalletService) {}

  ngOnInit() {
    combineLatest([
      this.walletService.getTotalBalance('bank'),
      this.walletService.getTotalBalance('cash')
    ]).subscribe(([bankTotal, cashTotal]) => {
      this.metrics = [
        {
          icon: 'fa-building-columns',
          label: 'Bank Balance',
          value: bankTotal,
          percentage: 15.25, // You might want to calculate this dynamically
          trend: 'up',
          currency: 'LKR'
        },
        {
          icon: 'fa-wallet',
          label: 'Cash in Hand',
          value: cashTotal,
          percentage: 8.15, // You might want to calculate this dynamically
          trend: 'down',
          currency: 'LKR'
        }
      ];
    });
  }

  formatCurrency(value: number): string {
    return `${value.toLocaleString('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    })}`;
  }
}
