import { Component, ViewChild } from '@angular/core';
import { ChartTabComponent } from "../chart-tab/chart-tab.component";
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
  imports: [ChartTabComponent, NgApexchartsModule],
  templateUrl: './statchart.component.html',
  styleUrl: './statchart.component.css'
})
export class StatchartComponent {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: ChartOptions;

  private readonly COLORS = {
    income: '#22C55E', // Green for income
    expense: '#EF4444', // Red for expenses
    textMuted: '#6B7280' // Gray for labels
  };

  constructor() {
    this.chartOptions = {
      series: [{
        name: "Income",
        data: [280000, 290000, 270000, 285000, 275000, 265000, 270000, 305000, 330000, 310000, 340000, 335000]
      },
      {
        name: "Expenses",
        data: [240000, 230000, 250000, 240000, 255000, 240000, 270000, 300000, 310000, 320000, 350000, 340000]
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
        theme: 'dark',
        y: {
          formatter: (value) => `LKR ${value.toLocaleString()}`
        }
      },
      xaxis: {
        type: "category",
        categories: [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ],
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
