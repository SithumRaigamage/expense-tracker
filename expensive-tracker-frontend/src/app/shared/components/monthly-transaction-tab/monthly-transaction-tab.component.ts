import { Component, Output, EventEmitter } from '@angular/core';


type TabOption = 'income' | 'expense' | 'all';

@Component({
  selector: 'app-monthly-transaction-tab',
  standalone: true,
  imports: [],
  template: `
    <div class="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
      <button
        (click)="setSelected('income')"
        [class]="'px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ' + getButtonClass('income')"
      >
        Income
      </button>
      <button
        (click)="setSelected('expense')"
        [class]="'px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ' + getButtonClass('expense')"
      >
        Expense
      </button>
      <button
        (click)="setSelected('all')"
        [class]="'px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ' + getButtonClass('all')"
      >
        All
      </button>
    </div>
  `
})
export class MonthlyTransactionTabComponent {
  @Output() tabChanged = new EventEmitter<TabOption>();
  selected: TabOption = 'all';

  getButtonClass(option: TabOption): string {
    return this.selected === option
      ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800'
      : 'text-gray-500 dark:text-gray-400';
  }

  setSelected(option: TabOption): void {
    this.selected = option;
    this.tabChanged.emit(option);
  }
}
