import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ChartComponent,
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
  imports: [CommonModule, NgApexchartsModule, AppCurrencyPipe]
})
export class EmergencyFundComponent implements OnInit, OnDestroy {
  public chartOptions!: Partial<EmergencyChartOptions>;
  protected Math = Math;

  private readonly COLORS = {
    primary: '#10B981',
    textMuted: '#A3AED0',
    grid: '#E2E8F0',
  };

  private subscription: Subscription = new Subscription();
  transactions: EmergencyTransaction[] = [];
  currentBalance = 35000;
  targetGoal = 100000;
  monthlySaveGoal = 5000;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  constructor(
    private transactionService: TransactionService,
    private walletService: WalletService,
    private router: Router,
    private currencyService: CurrencyService
  ) {}

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
      ]).subscribe(([wallets, allTransactions]: [any[], any[]]) => {
        const emergencyWallet = wallets.find((w: any) => w.type === 'emergencyfund');
        if (!emergencyWallet) {
          this.currentBalance = 0;
          this.transactions = [];
          this.initializeChart();
          return;
        }

        this.currentBalance = emergencyWallet.balance;
        
        if (allTransactions) {
          const walletTransactions = allTransactions.filter((t: any) => t.walletId === emergencyWallet.id);
          
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


}
