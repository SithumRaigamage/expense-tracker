import { Component, OnInit, OnDestroy, inject } from '@angular/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule } from '@angular/router';
import { faArrowUp, faArrowDown, faWallet } from '@fortawesome/free-solid-svg-icons';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { Metric } from '../../../core/models/Metric';
import { WalletService } from '../../../services/wallet.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-metrics',
  imports: [RouterModule, BadgeComponent, EmptyStateComponent, SkeletonComponent, FontAwesomeModule, AppCurrencyPipe],
  templateUrl: './metrics.component.html',
  standalone: true
})
export class MetricsComponent implements OnInit, OnDestroy {
  private walletService = inject(WalletService);

  faArrowUp = faArrowUp;
  faArrowDown = faArrowDown;
  faWallet = faWallet;
  metrics: Metric[] = [];
  /** Distinguishes "still loading" from "loaded and genuinely empty" — different UI. */
  isLoading = true;
  private subscription: Subscription = new Subscription();

  ngOnInit() {
    this.subscription.add(
      this.walletService.getMetrics().subscribe(
        metrics => {
          this.metrics = metrics;
          this.isLoading = false;
          //console.log(this.metrics);
        }
      )
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }



  /**
   * Per-account-type accents.
   *
   * Written as whole class strings rather than composed from a colour name,
   * because Tailwind scans source statically — an interpolated `text-${hue}-500`
   * is never emitted and the card silently loses its colour in a prod build.
   */
  private static readonly ACCENTS: Record<string, { icon: string; tile: string; bar: string }> = {
    'Cash in Hand': {
      icon: 'text-emerald-600 dark:text-emerald-400',
      tile: 'bg-emerald-50 dark:bg-emerald-500/12',
      bar: 'from-emerald-400 to-emerald-600'
    },
    'Bank Balance': {
      icon: 'text-blue-600 dark:text-blue-400',
      tile: 'bg-blue-50 dark:bg-blue-500/12',
      bar: 'from-blue-400 to-blue-600'
    },
    'Credit Card': {
      icon: 'text-violet-600 dark:text-violet-400',
      tile: 'bg-violet-50 dark:bg-violet-500/12',
      bar: 'from-violet-400 to-violet-600'
    },
    Savings: {
      icon: 'text-amber-600 dark:text-amber-400',
      tile: 'bg-amber-50 dark:bg-amber-500/12',
      bar: 'from-amber-400 to-amber-600'
    },
    Investments: {
      icon: 'text-sky-600 dark:text-sky-400',
      tile: 'bg-sky-50 dark:bg-sky-500/12',
      bar: 'from-sky-400 to-sky-600'
    },
    'Emergency Fund': {
      icon: 'text-rose-600 dark:text-rose-400',
      tile: 'bg-rose-50 dark:bg-rose-500/12',
      bar: 'from-rose-400 to-rose-600'
    }
  };

  private static readonly DEFAULT_ACCENT = {
    icon: 'text-gray-500 dark:text-gray-400',
    tile: 'bg-gray-100 dark:bg-white/5',
    bar: 'from-gray-300 to-gray-400'
  };

  private accent(label: string) {
    return MetricsComponent.ACCENTS[label] ?? MetricsComponent.DEFAULT_ACCENT;
  }

  getMetricColor(label: string): string {
    return this.accent(label).icon;
  }

  getMetricTile(label: string): string {
    return this.accent(label).tile;
  }

  getMetricBar(label: string): string {
    return this.accent(label).bar;
  }
}
