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
  public chartOptions: ChartOptions; // Remove Partial<>

  constructor() {
    this.chartOptions = {
      series: [{
        name: "Sales",
        data: [180, 190, 170, 160, 175, 165, 170, 205, 230, 210, 240, 235]
      },
      {
        name: "Revenue",
        data: [40, 30, 50, 40, 55, 40, 70, 100, 110, 120, 150, 140]
      }] as ApexAxisChartSeries,
      chart: {
        fontFamily: "Outfit, sans-serif",
        height: 310,
        type: "area",
        toolbar: {
          show: false
        }
      },
      colors: ["#465FFF", "#9CB9FF"],
      stroke: {
        curve: "straight",
        width: [2, 2]
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.55,
          opacityTo: 0
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
        x: {
          format: "dd MMM yyyy"
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
            fontSize: "12px",
            colors: ["#6B7280"]
          }
        },
        title: {
          text: "",
          style: {
            fontSize: "0px"
          }
        }
      },
      legend: {
        show: false,
        position: "top",
        horizontalAlign: "left"
      }
    };
  }
}
