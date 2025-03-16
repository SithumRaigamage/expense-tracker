import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
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

interface Transaction {
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
export class EmergencyFundComponent implements OnInit {
  public chartOptions!: Partial<EmergencyChartOptions>;

  private readonly COLORS = {
    primary: '#10B981',
    textMuted: '#A3AED0',
    grid: '#E2E8F0',
  };

  transactions: Transaction[] = [
    {
      date: new Date('2024-03-01'),
      amount: 25000,
      type: 'deposit',
      balance: 25000
    },
    {
      date: new Date('2024-03-10'),
      amount: 15000,
      type: 'deposit',
      balance: 40000
    },
    {
      date: new Date('2024-03-15'),
      amount: 5000,
      type: 'withdrawal',
      balance: 35000
    }
  ];

  currentBalance: number = 35000;
  targetGoal: number = 100000;
  monthlySaveGoal: number = 5000;

  constructor() {
    this.initializeChart();
  }

  ngOnInit(): void {}

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
        theme: 'dark',
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
