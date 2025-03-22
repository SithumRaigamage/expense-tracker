import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../badge/badge.component';
import { Metric } from '../../models/Metric';
import { WalletService } from '../../services/wallet.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-metrics',
  imports: [CommonModule, BadgeComponent],
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.css'],
  standalone: true
})
export class MetricsComponent implements OnInit, OnDestroy {
  metrics: Metric[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private walletService: WalletService) {}

  ngOnInit() {
    this.subscription.add(
      this.walletService.getMetrics().subscribe(
        metrics => this.metrics = metrics
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
}
