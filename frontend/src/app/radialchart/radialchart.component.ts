import { Component, OnInit, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexFill,
  NgApexchartsModule,
  ChartComponent
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  colors: string[];
};

@Component({
  selector: 'app-radialchart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './radialchart.component.html',
  styleUrl: './radialchart.component.css'
})
export class RadialChartComponent implements OnInit, OnChanges {
  @ViewChild("chart") chart!: ChartComponent;
  @Input() percentage: number = 0;
  @Input() showPercentage: boolean = false;

  public chartOptions: ChartOptions;

  constructor() {
    this.chartOptions = {
      series: [0], // Will be updated with percentage
      chart: {
        height: 330,
        type: "radialBar",
        offsetY: -10
      },
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 135,
          hollow: {
            margin: 0,
            size: "70%",
            background: "transparent"
          },
          track: {
            background: "#e7e7e7",
            strokeWidth: "97%",
            margin: 5,
            dropShadow: {
              enabled: false,
              top: -3,
              left: 0,
              blur: 4,
              opacity: 0.35
            }
          },
          dataLabels: {
            show: true,
            name: {
              offsetY: -10,
              show: true,
              color: "#888",
              fontSize: "17px"
            },
            value: {
              formatter: function(val: number) {
                return val.toFixed(0) + "%";
              },
              color: "#111",
              fontSize: "36px",
              show: true
            }
          }
        }
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: "dark",
          type: "horizontal",
          shadeIntensity: 0.5,
          gradientToColors: ["#22c55e"],
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100]
        }
      },
      colors: ["#22c55e"],
      labels: ["Progress"]
    };
  }

  ngOnInit(): void {
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['percentage']) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    // Ensure percentage is between 0 and 100
    const validPercentage = Math.min(Math.max(this.percentage, 0), 100);
    this.chartOptions.series = [validPercentage];

    // Update chart visibility based on showPercentage
    if (this.chartOptions.plotOptions &&
        this.chartOptions.plotOptions.radialBar &&
        this.chartOptions.plotOptions.radialBar.dataLabels &&
        this.chartOptions.plotOptions.radialBar.dataLabels.value) {
      this.chartOptions.plotOptions.radialBar.dataLabels.value.show = this.showPercentage;
    }
  }
}
