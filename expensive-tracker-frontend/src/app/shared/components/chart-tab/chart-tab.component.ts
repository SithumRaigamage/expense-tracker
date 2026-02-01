import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

type TabOption = 'monthly' | 'quarterly' | 'annually' | 'trends';

@Component({
  selector: 'app-chart-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-tab.component.html',
})
export class ChartTabComponent {
  @Output() periodChanged = new EventEmitter<TabOption>();
  selected: TabOption = 'monthly';

  getButtonClass(option: TabOption): string {
    return this.selected === option
      ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800'
      : 'text-gray-500 dark:text-gray-400';
  }

  setSelected(option: TabOption): void {
    this.selected = option;
    this.periodChanged.emit(option);
  }
}
