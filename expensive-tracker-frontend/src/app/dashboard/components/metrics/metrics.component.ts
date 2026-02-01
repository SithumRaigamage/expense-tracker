import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatCardModule } from '@angular/material/card';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { Metric } from '../../../core/models/Metric';
import { WalletService } from '../../../services/wallet.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-metrics',
  imports: [CommonModule, BadgeComponent, FontAwesomeModule, MatCardModule],
  templateUrl: './metrics.component.html',
  standalone: true
})
export class MetricsComponent implements OnInit, OnDestroy {
  faArrowUp = faArrowUp;
  faArrowDown = faArrowDown;
  metrics: Metric[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private walletService: WalletService) {}

  ngOnInit() {
    this.subscription.add(
      this.walletService.getMetrics().subscribe(
        metrics => {
          this.metrics = metrics;
          //console.log(this.metrics);
        }
      )
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    });
  }

  getMetricColor(label: string): string {
    switch (label) {
      case 'Bank Balance':
        return 'text-blue-500 dark:text-blue-400';
      case 'Cash in Hand':
        return 'text-green-500 dark:text-green-400';
      case 'Savings':
        return 'text-amber-500 dark:text-amber-400';
      case 'Credit Card':
        return 'text-purple-500 dark:text-purple-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  }
}
