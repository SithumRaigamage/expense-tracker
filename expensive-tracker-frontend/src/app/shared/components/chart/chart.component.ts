import { Component, Input, OnChanges, SimpleChanges, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexGrid,
  ApexStroke,
  ApexTitleSubtitle,
  ApexTooltip,
  ApexPlotOptions,
  ApexFill,
  NgApexchartsModule,
  ApexTheme
} from 'ng-apexcharts';
import { Transaction } from '../../../core/models/Transaction';
import { CurrencyService } from '../../../core/services/currency.service';

export interface ChartOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  theme: ApexTheme;
  colors: string[];
  states: {
    hover: {
      filter: {
        type?: string;
        value?: number;
      };
    }
  };
}

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './chart.component.html',
})
export class ChartComponent implements OnChanges, OnInit {
  private currencyService = inject(CurrencyService);

  private readonly destroyRef = inject(DestroyRef);

  @Input() chartType: 'income' | 'expense' | 'all' = 'all';
  @Input() transactions: Transaction[] = [];

  public chartOptions!: Partial<ChartOptions>;

  private readonly COLORS = {
    income: '#22C55E', // Bright green
    expense: '#EF4444', // Bright red
    textMuted: '#A3AED0', // Muted text color
    grid: '#E2E8F0', // Grid color
  };

  constructor() {
    this.initializeChart();
  }

  ngOnInit() {
    this.currencyService.activeCurrency$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.updateChartData();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartType'] || changes['transactions']) {
      this.updateChartData();
    }
  }

  private initializeChart(): void {
    this.chartOptions = {
      series: this.getSeriesData(),
      chart: {
        type: 'bar',
        height: 180,
        toolbar: {
          show: false
        },
        background: 'transparent',
        fontFamily: 'Outfit, sans-serif',
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '65%',
          borderRadius: 5,
          colors: {
            ranges: [],
            backgroundBarColors: [],
            backgroundBarOpacity: 1,
          },
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: false,
        width: 0
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        labels: {
          style: {
            colors: Array(12).fill(this.COLORS.textMuted),
            fontSize: '12px',
            fontWeight: '500',
            fontFamily: 'Outfit, sans-serif'
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
            fontFamily: 'Outfit, sans-serif'
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
          fontFamily: 'Outfit, sans-serif',
        },
        y: {
          formatter: (val) => `LKR ${val.toLocaleString()}`
        }
      },
      fill: {
        opacity: 1
      },
      colors: this.getChartColors(),
      states: {
        hover: {
          filter: {
            type: 'darken' as const,
            value: 0.9
          }
        }
      },
      theme: {
        mode: 'light',
        palette: 'palette1'
      }
    };
  }

  private getMonthlyData(type: 'income' | 'expense'): number[] {
    const monthlyTotals = Array(12).fill(0);

    this.transactions.forEach(transaction => {
      if (transaction.type === type) {
        const month = new Date(transaction.date).getMonth();
        monthlyTotals[month] += transaction.amount;
      }
    });

    return monthlyTotals;
  }

  private getSeriesData() {
    const currency = this.currencyService.getActiveCurrency();
    const convert = (data: number[]) => data.map(v => this.currencyService.convert(v, 'LKR', currency));

    switch (this.chartType) {
      case 'income':
        return [{
          name: 'Income',
          data: convert(this.getMonthlyData('income')),
          color: this.COLORS.income
        }];
      case 'expense':
        return [{
          name: 'Expenses',
          data: convert(this.getMonthlyData('expense')),
          color: this.COLORS.expense
        }];
      default:
        return [
          {
            name: 'Income',
            data: convert(this.getMonthlyData('income')),
            color: this.COLORS.income
          },
          {
            name: 'Expenses',
            data: convert(this.getMonthlyData('expense')),
            color: this.COLORS.expense
          }
        ];
    }
  }

  private getChartColors() {
    switch (this.chartType) {
      case 'income':
        return [this.COLORS.income];
      case 'expense':
        return [this.COLORS.expense];
      default:
        return [this.COLORS.income, this.COLORS.expense];
    }
  }

  private updateChartData(): void {
    if (this.chartOptions) {
      const newSeriesData = this.getSeriesData();
      const currency = this.currencyService.getActiveCurrency();

      this.chartOptions = {
        ...this.chartOptions,
        series: newSeriesData,
        colors: newSeriesData.map(series => series.color as string),
        yaxis: {
          ...this.chartOptions.yaxis,
          labels: {
            ...this.chartOptions.yaxis?.labels,
            style: {
               colors: [this.COLORS.textMuted],
               fontSize: '12px',
               fontWeight: '500',
               fontFamily: 'Outfit, sans-serif'
            },
            formatter: (value) => `${currency} ${(value/1000).toFixed(0)}K`
          }
        } as ApexYAxis,
        tooltip: {
          ...this.chartOptions.tooltip,
           theme: 'dark',
           style: {
             fontSize: '12px',
             fontFamily: 'Outfit, sans-serif',
           },
           y: {
             formatter: (val) => `${currency} ${val.toLocaleString()}`
           }
        } as ApexTooltip
      };
    }
  }
}
