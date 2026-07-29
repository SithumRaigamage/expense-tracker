import { Component, Input } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexLegend,
  ApexMarkers,
  ApexPlotOptions,
  ApexStroke,
  ApexTheme,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis
} from 'ng-apexcharts';

import { Transaction } from '../../core/models/Transaction';

@Component({
  // Must match ng-apexcharts' own selector so this stands in for the real
  // chart in tests; an "app-" prefix would stop it substituting.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'apx-chart',
  standalone: true,
  template: '<div>Mock Chart</div>'
})
export class MockChartComponent {
  // Mirrors ng-apexcharts' own input types, so a component that binds something
  // the real chart would reject fails here too rather than passing in tests.
  @Input() series?: ApexAxisChartSeries;
  @Input() chart?: ApexChart;
  @Input() xaxis?: ApexXAxis;
  @Input() yaxis?: ApexYAxis | ApexYAxis[];
  @Input() grid?: ApexGrid;
  @Input() markers?: ApexMarkers;
  @Input() stroke?: ApexStroke;
  @Input() fill?: ApexFill;
  @Input() colors?: string[];
  @Input() tooltip?: ApexTooltip;
  @Input() legend?: ApexLegend;
  @Input() dataLabels?: ApexDataLabels;
  @Input() plotOptions?: ApexPlotOptions;
  @Input() theme?: ApexTheme;

  // Method expected by some components using @ViewChild
  public updateOptions(
    _options: Record<string, unknown>,
    _redrawPaths?: boolean,
    _animate?: boolean,
    _updateSyncedCharts?: boolean
  ): Promise<void> {
    return Promise.resolve();
  }

  public updateSeries(_newSeries: ApexAxisChartSeries, _animate?: boolean): Promise<void> {
    return Promise.resolve();
  }
}

@Component({
  selector: 'app-chart',
  standalone: true,
  template: '<div>Mock App Chart</div>'
})
export class MockAppChartComponent {
  @Input() chartType: 'income' | 'expense' | 'all' = 'all';
  @Input() transactions: Transaction[] = [];
}
