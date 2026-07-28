import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexGrid,
  ApexStroke,
  ApexTooltip,
  ApexFill,
  ApexTheme
} from 'ng-apexcharts';
import { TransactionService } from '../../../services/transaction.service';
import { WalletService } from '../../../services/wallet.service';
import { Subscription, combineLatest } from 'rxjs';
import { Router } from '@angular/router';
import { CurrencyService } from '../../../core/services/currency.service';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { NotificationService } from '../../../shared/services/notification.service';

/** Used until the user sets their own; three months of a modest income. */
const DEFAULT_TARGET = 100000;
const DEFAULT_MONTHLY_TARGET = 5000;

interface EmergencyTransaction {
  date: Date;
  amount: number;
  category: string;
  type: 'deposit' | 'withdrawal';
  balance: number;
  cumulativeIncome: number;
  cumulativeExpense: number;
}

export interface EmergencyChartOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  fill: ApexFill;
  theme: ApexTheme;
  colors: string[];
}

@Component({
  selector: 'app-emergency-fund',
  templateUrl: './emergency-fund.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule, AppCurrencyPipe]
})
export class EmergencyFundComponent implements OnInit, OnDestroy {
  private transactionService = inject(TransactionService);
  private walletService = inject(WalletService);
  private router = inject(Router);
  private currencyService = inject(CurrencyService);
  private readonly notifications = inject(NotificationService);

  public chartOptions!: Partial<EmergencyChartOptions>;
  protected Math = Math;

  private readonly COLORS = {
    primary: '#10B981',
    textMuted: '#A3AED0',
    grid: '#E2E8F0',
  };

  private subscription: Subscription = new Subscription();
  transactions: EmergencyTransaction[] = [];
  currentBalance = 0;
  /**
   * Read from the wallet, not baked in. These were literals (100000 and 5000)
   * so every user saw the same goal and had no way to change it; the defaults
   * below only apply until someone sets a real one.
   */
  targetGoal = DEFAULT_TARGET;
  monthlySaveGoal = DEFAULT_MONTHLY_TARGET;
  emergencyWalletId: string | null = null;
  isEditingTargets = false;
  targetDraft = DEFAULT_TARGET;
  monthlyDraft = DEFAULT_MONTHLY_TARGET;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  ngOnInit(): void {
    this.loadTransactions();
    this.subscription.add(
      this.currencyService.activeCurrency$.subscribe(() => {
        this.initializeChart();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private initializeChart(): void {
    this.chartOptions = {
      series: [
        {
          name: 'Total Savings',
          data: this.transactions.map(t => t.cumulativeIncome)
        },
        {
          name: 'Total Spent',
          data: this.transactions.map(t => t.cumulativeExpense)
        }
      ],
      chart: {
        type: 'area',
        height: 400,
        toolbar: {
          show: false
        },
        background: 'transparent',
        fontFamily: 'Inter, sans-serif',
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      xaxis: {
        categories: this.transactions.map(t => this.formatDate(t.date)),
        // One label per transaction turned the axis into an unreadable smear
        // once real history existed. Show a handful of evenly spaced dates and
        // let ApexCharts drop any that would still collide.
        tickAmount: 6,
        labels: {
          rotate: -45,
          rotateAlways: false,
          hideOverlappingLabels: true,
          trim: true,
          style: {
            colors: this.COLORS.textMuted,
            fontSize: '12px',
            fontWeight: '500',
            fontFamily: 'Inter, sans-serif'
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: [this.COLORS.textMuted],
            fontSize: '12px',
            fontWeight: '500',
            fontFamily: 'Inter, sans-serif'
          },
          formatter: (value) => {
            const currency = this.currencyService.getActiveCurrency();
            return `${currency} ${(value/1000).toFixed(0)}K`;
          }
        }
      },
      grid: {
        show: true,
        borderColor: this.COLORS.grid,
        strokeDashArray: 5,
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        }
      },
      tooltip: {
        theme: 'light',
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
        },
        y: {
          formatter: (val) => {
            const currency = this.currencyService.getActiveCurrency();
            return `${currency} ${val.toLocaleString()}`;
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 100]
        }
      },
      colors: ['#10B981', '#EF4444'], // Green for Income, Red for Expense
      theme: {
        mode: 'light',
        palette: 'palette1'
      }
    };
  }

  private loadTransactions(): void {
    this.subscription.add(
      combineLatest([
        this.walletService.getAllWallets(),
        this.transactionService.getTransactions()
      ]).subscribe(([wallets, allTransactions]) => {
        const emergencyWallet = wallets.find(w => w.type === 'emergencyfund');
        if (!emergencyWallet) {
          this.currentBalance = 0;
          this.emergencyWalletId = null;
          this.transactions = [];
          this.initializeChart();
          return;
        }

        this.currentBalance = emergencyWallet.balance;
        this.emergencyWalletId = emergencyWallet.id;
        this.targetGoal = emergencyWallet.targetAmount || DEFAULT_TARGET;
        this.monthlySaveGoal = emergencyWallet.monthlyTarget || DEFAULT_MONTHLY_TARGET;
        
        if (allTransactions) {
          const walletTransactions = allTransactions.filter(t => t.walletId === emergencyWallet.id);
          
          // Sort by date ascending for the chart
          const sortedTransactions = [...walletTransactions].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          // Calculate running totals for specific types
          let cumIncome = 0;
          let cumExpense = 0;
          this.transactions = sortedTransactions.map(t => {
            const isIncome = t.type === 'income';
            if (isIncome) cumIncome += t.amount;
            else cumExpense += t.amount;
            
            return {
              date: new Date(t.date),
              amount: t.amount,
              category: t.category,
              type: isIncome ? 'deposit' : 'withdrawal' as 'deposit' | 'withdrawal',
              balance: cumIncome - cumExpense,
              cumulativeIncome: cumIncome,
              cumulativeExpense: cumExpense
            };
          });

          this.initializeChart();
          this.updatePagination();
        }
      })
    );
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.transactions.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
  }

  get paginatedTransactions(): EmergencyTransaction[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    // For the table, we want newest first, so we reverse the transactions array
    return [...this.transactions]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(startIndex, startIndex + this.pageSize);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * The three badges beside these figures used to read "+25% MTD", "6 months"
   * and "On Track" — string literals sitting next to real balances, so they
   * claimed things about the user's money that nothing had calculated. Each one
   * below is derived, and returns null when the underlying number does not
   * exist yet so the template can leave the badge out rather than invent one.
   */

  /** Net deposits minus withdrawals since the first of the current month. */
  get monthToDateChange(): number {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    return this.transactions
      .filter(t => t.date >= monthStart)
      .reduce((total, t) => total + (t.type === 'deposit' ? t.amount : -t.amount), 0);
  }

  /**
   * Month-to-date change as a share of what the fund held on the first. Null
   * when nothing moved this month, or when the fund opened the month empty —
   * a percentage of zero is not a number anyone can act on, and the template
   * falls back to showing the amount itself.
   */
  get monthToDatePercent(): number | null {
    const change = this.monthToDateChange;
    if (change === 0) return null;

    const openingBalance = this.currentBalance - change;
    if (openingBalance <= 0) return null;

    return (change / openingBalance) * 100;
  }

  /**
   * Whole months of contributions still needed to reach the target at the
   * current monthly goal. Null when the target is already met, or when no
   * monthly goal is set to divide by.
   */
  get monthsToTarget(): number | null {
    const remaining = this.targetGoal - this.currentBalance;
    if (remaining <= 0 || this.monthlySaveGoal <= 0) return null;

    return Math.ceil(remaining / this.monthlySaveGoal);
  }

  get hasReachedTarget(): boolean {
    return this.targetGoal > 0 && this.currentBalance >= this.targetGoal;
  }

  /** How far this month's net saving is short of the monthly goal; 0 once met. */
  get monthlyGoalShortfall(): number {
    return Math.max(0, this.monthlySaveGoal - this.monthToDateChange);
  }

  /** Share of the target saved so far, clamped and guarded against a zero target. */
  get progressPercent(): number {
    if (this.targetGoal <= 0) return 0;
    return Math.min(100, Math.max(0, (this.currentBalance / this.targetGoal) * 100));
  }

  navToAllTransactions(): void {
    this.router.navigate(['/transactions'], { queryParams: { walletType: 'emergencyfund' } });
  }

  navToAddFunds(): void {
    this.router.navigate(['/transactions'], { queryParams: { walletType: 'emergencyfund', action: 'add' } });
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  startEditingTargets(): void {
    this.targetDraft = this.targetGoal;
    this.monthlyDraft = this.monthlySaveGoal;
    this.isEditingTargets = true;
  }

  cancelEditingTargets(): void {
    this.isEditingTargets = false;
  }

  saveTargets(): void {
    if (!this.emergencyWalletId || this.targetDraft <= 0 || this.monthlyDraft < 0) {
      this.notifications.error('Enter a target greater than zero.');
      return;
    }

    this.walletService.updateWallet(this.emergencyWalletId, {
      targetAmount: this.targetDraft,
      monthlyTarget: this.monthlyDraft
    }).subscribe({
      next: () => {
        this.targetGoal = this.targetDraft;
        this.monthlySaveGoal = this.monthlyDraft;
        this.isEditingTargets = false;
        this.notifications.success('Savings targets updated.');
      },
      error: (error) => this.notifications.error(error?.message || 'Could not save your targets.')
    });
  }


}
