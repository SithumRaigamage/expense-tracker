import { Component, OnInit } from '@angular/core';
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
  NgApexchartsModule
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
};

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnInit {
  public chartOptions: Partial<ChartOptions>;

  constructor() {
    this.chartOptions = {
      series: [
        {
          name: 'Expenses',
          data: [45000, 52000, 38000, 43000, 32000, 35000, 42000, 48000, 53000, 41000, 37000, 39000],
          color: '#4318FF'
        }
      ],
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
            colors: Array(12).fill('#A3AED0'),
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
            colors: ['#A3AED0'],
            fontSize: '12px',
            fontWeight: '500',
            fontFamily: 'Inter, sans-serif'
          },
          formatter: (value) => `LKR ${(value/1000).toFixed(0)}K`
        }
      },
      grid: {
        show: true,
        borderColor: '#E2E8F0',
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
      }
    };
  }

  ngOnInit(): void {}
}
