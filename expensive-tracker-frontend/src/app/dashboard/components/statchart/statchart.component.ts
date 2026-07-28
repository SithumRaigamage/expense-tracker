import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import { ChartTabComponent } from "../../../shared/components/chart-tab/chart-tab.component";
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { TransactionService } from '../../../services/transaction.service';
import { CurrencyService } from '../../../core/services/currency.service';
import {
  ApexChart,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexYAxis,
  ApexGrid,
  ApexMarkers,
  ApexStroke,
  ApexFill,
  ApexDataLabels,
  ApexTooltip,
  ApexLegend,
  ChartComponent,
  NgApexchartsModule
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  markers: ApexMarkers;
  stroke: ApexStroke;
  fill: ApexFill;
  colors: string[];
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  legend: ApexLegend;
};

@Component({
  selector: 'app-statchart',
  standalone: true,
  imports: [CommonModule, ChartTabComponent, EmptyStateComponent, SkeletonComponent, NgApexchartsModule],
  templateUrl: './statchart.component.html',
})
export class StatchartComponent implements OnInit {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions!: ChartOptions;
  faChartLine = faChartLine;
  hasTransactions = true;
  isLoading = true;

  private monthlyData = {
    income: Array(12).fill(0),
    expenses: Array(12).fill(0)
  };

  private readonly COLORS = {
    income: '#22C55E', // Green for income
    expense: '#EF4444', // Red for expenses
    textMuted: '#6B7280' // Gray for labels
  };

  constructor(private transactionService: TransactionService, private currencyService: CurrencyService) {
    this.initializeChart('monthly');
  }

  ngOnInit() {
    this.loadTransactionData();
    this.currencyService.activeCurrency$.subscribe(() => {
      this.loadTransactionData();
    });
  }

  private loadTransactionData() {
    this.transactionService.getTransactions().subscribe({
      next: transactions => {
        this.hasTransactions = transactions.length > 0;
        this.updateChartData('monthly', this.aggregateMonthlyData(transactions));
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  private aggregateMonthlyData(transactions: any[]) {
    const data = {
      income: Array(12).fill(0),
      expenses: Array(12).fill(0)
    };

    transactions.forEach(transaction => {
      const month = new Date(transaction.date).getMonth();
      if (transaction.type === 'income') {
        data.income[month] += transaction.amount;
      } else {
        data.expenses[month] += transaction.amount;
      }
    });

    return data;
  }

  private aggregateQuarterlyData(monthlyData: any) {
    const data = {
      income: Array(4).fill(0),
      expenses: Array(4).fill(0)
    };

    for (let i = 0; i < 12; i++) {
      const quarter = Math.floor(i / 3);
      data.income[quarter] += monthlyData.income[i];
      data.expenses[quarter] += monthlyData.expenses[i];
    }

    return data;
  }

  private aggregateAnnualData(monthlyData: any) {
    return {
      income: [monthlyData.income.reduce((a: number, b: number) => a + b, 0)],
      expenses: [monthlyData.expenses.reduce((a: number, b: number) => a + b, 0)]
    };
  }

  private aggregateTrendData(transactions: any[]): any {
    const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))].sort();
    const series: any[] = [];
    
    years.forEach(year => {
      const yearData = Array(12).fill(0);
      transactions.filter(t => new Date(t.date).getFullYear() === year && t.type === 'expense')
        .forEach(t => {
          yearData[new Date(t.date).getMonth()] += t.amount;
        });
      
      series.push({
        name: `Expenses ${year}`,
        data: yearData
      });
    });

    return series;
  }

  onPeriodChanged(period: 'monthly' | 'quarterly' | 'annually' | 'trends'): void {
    this.transactionService.getTransactions().subscribe(transactions => {
      this.hasTransactions = transactions.length > 0;

      if (period === 'trends') {
        const trendData = this.aggregateTrendData(transactions);
        this.updateChartData(period, trendData);
        return;
      }

      const monthlyData = this.aggregateMonthlyData(transactions);
      const data = period === 'monthly' ? monthlyData :
                   period === 'quarterly' ? this.aggregateQuarterlyData(monthlyData) :
                   this.aggregateAnnualData(monthlyData);

      this.updateChartData(period, data);
    });
  }

  private getCategories(period: 'monthly' | 'quarterly' | 'annually' | 'trends'): string[] {
    switch (period) {
      case 'monthly':
      case 'trends':
        return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      case 'quarterly':
        return ["Q1", "Q2", "Q3", "Q4"];
      case 'annually':
        return [new Date().getFullYear().toString()];
    }
  }

  private updateChartData(period: 'monthly' | 'quarterly' | 'annually' | 'trends', data: any): void {
    const chartType = period === 'annually' ? 'bar' : 'area';
    
    let series: any[] = [];
    let colors: string[] = [];
    
    const currentCurrency = this.currencyService.getActiveCurrency();
    const convert = (val: number) => this.currencyService.convert(val, 'LKR', currentCurrency);

    if (period === 'trends') {
      series = data.map((s: any) => ({
        ...s,
        data: s.data.map(convert)
      }));
      // Generate some distinct colors for different years
      const palette = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6'];
      colors = series.map((_, i) => palette[i % palette.length]);
    } else {
      series = [{
        name: "Income",
        data: data.income.map(convert)
      },
      {
        name: "Expenses",
        data: data.expenses.map(convert)
      }];
      colors = [this.COLORS.income, this.COLORS.expense];
    }

    const updatedOptions: Partial<ChartOptions> = {
      series: series,
      chart: {
        ...this.chartOptions.chart,
        type: chartType,
        height: 310,
        fontFamily: 'Inter, sans-serif',
        toolbar: {
          show: false
        }
      },
      xaxis: {
        categories: this.getCategories(period),
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        tooltip: {
          enabled: false
        }
      },
      stroke: {
        curve: period === 'annually' ? 'straight' : 'smooth',
        width: period === 'annually' ? 0 : (period === 'trends' ? 3 : [2, 2])
      },
      fill: {
        type: period === 'annually' ? 'solid' : 'gradient',
        gradient: period === 'annually' ? undefined : {
          opacityFrom: period === 'trends' ? 0.3 : 0.4,
          opacityTo: 0.1
        }
      },
      colors: colors,
      markers: {
        size: 0,
        strokeColors: "#fff",
        strokeWidth: 2,
        hover: {
          size: 6
        }
      },
      grid: {
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: [this.COLORS.textMuted],
            fontSize: '12px'
          },
          formatter: (value) => `${currentCurrency} ${(value/1000).toFixed(0)}K`
        }
      },
      tooltip: {
        enabled: true,
        theme: 'light',
        y: {
          formatter: (val) => `${currentCurrency} ${val.toLocaleString()}`
        }
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
        labels: {
          colors: this.COLORS.textMuted
        }
      },
      dataLabels: {
        enabled: false
      }
    };

    this.chartOptions = updatedOptions as ChartOptions;

    if (this.chart) {
      // Update with animation and redraw
      this.chart.updateOptions(updatedOptions, true, true);
    }
  }

  private initializeChart(period: 'monthly' | 'quarterly' | 'annually'): void {
    this.chartOptions = {
      series: [{
        name: "Income",
        data: this.monthlyData.income
      },
      {
        name: "Expenses",
        data: this.monthlyData.expenses
      }] as ApexAxisChartSeries,
      chart: {
        fontFamily: "Inter, sans-serif",
        height: 310,
        type: "area",
        toolbar: {
          show: false
        }
      },
      colors: [this.COLORS.income, this.COLORS.expense],
      stroke: {
        curve: "smooth",
        width: [2, 2]
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.4,
          opacityTo: 0.1
        }
      },
      markers: {
        size: 0,
        strokeColors: "#fff",
        strokeWidth: 2,
        hover: {
          size: 6
        }
      },
      grid: {
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      tooltip: {
        enabled: true,
        theme: 'light',
        y: {
          formatter: (value) => `LKR ${value.toLocaleString()}`
        }
      },
      xaxis: {
        type: "category",
        categories: this.getCategories(period),
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        tooltip: {
          enabled: false
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: [this.COLORS.textMuted],
            fontSize: "12px"
          },
          formatter: (value) => `LKR ${(value/1000).toFixed(0)}K`
        }
      },
      legend: {
        show: true,
        position: "top",
        horizontalAlign: "right",
        labels: {
          colors: this.COLORS.textMuted
        }
      }
    };
  }
}
