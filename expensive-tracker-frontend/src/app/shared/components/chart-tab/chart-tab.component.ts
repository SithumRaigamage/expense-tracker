import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { SegmentedControlComponent, SegmentOption } from '../segmented-control/segmented-control.component';

type TabOption = 'monthly' | 'quarterly' | 'annually' | 'trends';

/**
 * Period switch for the income-vs-expenses chart. Shares its markup with every
 * other segmented control in the app; `periodChanged` is unchanged for callers.
 */
@Component({
  selector: 'app-chart-tab',
  standalone: true,
  host: { class: 'block max-w-full min-w-0' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SegmentedControlComponent],
  template: `
    <app-segmented-control
      [options]="options"
      [selected]="selected"
      ariaLabel="Chart period"
      (selectedChange)="setSelected($event)">
    </app-segmented-control>
  `
})
export class ChartTabComponent {
  @Output() periodChanged = new EventEmitter<TabOption>();

  selected: TabOption = 'monthly';

  readonly options: SegmentOption<TabOption>[] = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annually', label: 'Annually' },
    { value: 'trends', label: 'Trends' }
  ];

  setSelected(option: TabOption): void {
    this.selected = option;
    this.periodChanged.emit(option);
  }
}
