import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
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

export type ChartOptions = {
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
};

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnChanges {
  @Input() chartType: 'income' | 'expense' | 'all' = 'all';
  public chartOptions!: Partial<ChartOptions>;

  private readonly COLORS = {
    income: '#22C55E', // Bright green
    expense: '#EF4444', // Bright red
    textMuted: '#A3AED0', // Muted text color
    grid: '#E2E8F0', // Grid color
  };

  private incomeData = [55000, 62000, 48000, 53000, 42000, 45000, 52000, 58000, 63000, 51000, 47000, 49000];
  private expenseData = [45000, 52000, 38000, 43000, 32000, 35000, 42000, 48000, 53000, 41000, 37000, 39000];

  constructor() {
    this.initializeChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartType']) {
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
        fontFamily: 'Inter, sans-serif',
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

  private getSeriesData() {
    switch (this.chartType) {
      case 'income':
        return [{
          name: 'Income',
          data: this.incomeData,
          color: this.COLORS.income
        }];
      case 'expense':
        return [{
          name: 'Expenses',
          data: this.expenseData,
          color: this.COLORS.expense
        }];
      default:
        return [
          {
            name: 'Income',
            data: this.incomeData,
            color: this.COLORS.income
          },
          {
            name: 'Expenses',
            data: this.expenseData,
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
      this.chartOptions.series = newSeriesData;
      this.chartOptions.colors = newSeriesData.map(series => series.color as string);
    }
  }
}
