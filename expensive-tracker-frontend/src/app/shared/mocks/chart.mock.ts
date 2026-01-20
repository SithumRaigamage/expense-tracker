import { Component, Input } from '@angular/core';

@Component({
  selector: 'apx-chart',
  standalone: true,
  template: '<div>Mock Chart</div>'
})
export class MockChartComponent {
  @Input() series: any;
  @Input() chart: any;
  @Input() xaxis: any;
  @Input() yaxis: any;
  @Input() grid: any;
  @Input() markers: any;
  @Input() stroke: any;
  @Input() fill: any;
  @Input() colors: any;
  @Input() tooltip: any;
  @Input() legend: any;
  @Input() dataLabels: any;
  @Input() plotOptions: any;
  @Input() theme: any;
  
  // Method expected by some components using @ViewChild
  public updateOptions(options: any, redrawPaths?: boolean, animate?: boolean, updateSyncedCharts?: boolean): Promise<void> {
    return Promise.resolve();
  }

  public updateSeries(newSeries: any, animate?: boolean): Promise<void> {
    return Promise.resolve();
  }
}

@Component({
  selector: 'app-chart',
  standalone: true,
  template: '<div>Mock App Chart</div>'
})
export class MockAppChartComponent {
  @Input() chartType: any;
  @Input() transactions: any;
}

