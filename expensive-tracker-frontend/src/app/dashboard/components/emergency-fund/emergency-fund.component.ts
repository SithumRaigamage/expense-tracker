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
import { Subscription } from 'rxjs';

interface EmergencyTransaction {
  date: Date;
  amount: number;
  type: 'deposit' | 'withdrawal';
  balance: number;
}

export type EmergencyChartOptions = {
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
};

@Component({
  selector: 'app-emergency-fund',
  templateUrl: './emergency-fund.component.html',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule]
})
export class EmergencyFundComponent implements OnInit, OnDestroy {
  public chartOptions!: Partial<EmergencyChartOptions>;

  private readonly COLORS = {
    primary: '#10B981',
    textMuted: '#A3AED0',
    grid: '#E2E8F0',
  };

  private subscription: Subscription = new Subscription();
  transactions: EmergencyTransaction[] = [];
  currentBalance: number = 35000;
  targetGoal: number = 100000;
  monthlySaveGoal: number = 5000;

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private initializeChart(): void {
    this.chartOptions = {
      series: [{
        name: 'Balance',
        data: this.transactions.map(t => t.balance)
      }],
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
        labels: {
          style: {
            colors: Array(12).fill(this.COLORS.textMuted),
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
          formatter: (value) => `LKR ${(value/1000).toFixed(0)}K`
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
          formatter: (val) => `LKR ${val.toLocaleString()}`
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
      colors: [this.COLORS.primary],
      theme: {
        mode: 'light',
        palette: 'palette1'
      }
    };
  }

  private loadTransactions(): void {
    const currentDate = new Date();
    this.subscription.add(
      this.transactionService
        .getMonthlyTransactions(currentDate.getMonth(), currentDate.getFullYear())
        .subscribe(transactions => {
          // Only include transactions with category 'Emergency Fund'
          const emergencyFundTransactions = transactions.filter(t => t.category === 'Emergency Fund');
          let runningBalance = 0;
          this.transactions = emergencyFundTransactions
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(t => {
              const isDeposit = t.type === 'income';
              runningBalance += isDeposit ? t.amount : -t.amount;
              return {
                date: t.date,
                amount: t.amount,
                type: isDeposit ? 'deposit' : 'withdrawal',
                balance: runningBalance
              };
            });

          this.currentBalance = runningBalance;
          this.initializeChart();
        })
    );
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}
