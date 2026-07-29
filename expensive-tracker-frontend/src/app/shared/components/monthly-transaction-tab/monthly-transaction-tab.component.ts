import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { SegmentedControlComponent, SegmentOption } from '../segmented-control/segmented-control.component';

type TabOption = 'income' | 'expense' | 'all';

/**
 * Income / Expense / All switch for the monthly chart. The pill markup and its
 * active-state logic now come from the shared segmented control; this keeps the
 * component's existing `tabChanged` output so callers are unaffected.
 */
@Component({
  selector: 'app-monthly-transaction-tab',
  standalone: true,
  host: { class: 'block max-w-full min-w-0' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SegmentedControlComponent],
  template: `
    <app-segmented-control
      [options]="options"
      [selected]="selected"
      ariaLabel="Transaction type"
      (selectedChange)="setSelected($event)">
    </app-segmented-control>
  `
})
export class MonthlyTransactionTabComponent {
  @Output() tabChanged = new EventEmitter<TabOption>();

  selected: TabOption = 'all';

  readonly options: SegmentOption<TabOption>[] = [
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
    { value: 'all', label: 'All' }
  ];

  setSelected(option: TabOption): void {
    this.selected = option;
    this.tabChanged.emit(option);
  }
}
