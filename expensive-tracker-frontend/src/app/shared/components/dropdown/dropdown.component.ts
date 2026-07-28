import { Component, Input, Output, EventEmitter } from '@angular/core';

import { DropdownDirective } from '../../../core/directives/dropdown.directive';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [DropdownDirective],
  template: `
    @if (isOpen) {
      <div
        [appDropdown]="isOpen"
        (closeDropdown)="onClose.emit()"
        class="absolute z-[100000] right-0 mt-2 rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
        [class]="class">
        <ng-content></ng-content>
      </div>
    }
    `
})
export class DropdownComponent {
  @Input() isOpen = false;
  @Input() class = '';
  @Output() onClose = new EventEmitter<void>();
}
