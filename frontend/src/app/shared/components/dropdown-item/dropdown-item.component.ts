import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dropdown-item',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <ng-container [ngSwitch]="tag">
      <a *ngSwitchCase="'a'"
         [routerLink]="to"
         [class]="baseClassName + ' ' + className"
         (click)="handleClick($event)">
        <ng-content></ng-content>
      </a>
      <button *ngSwitchCase="'button'"
              [class]="baseClassName + ' ' + className"
              (click)="handleClick($event)">
        <ng-content></ng-content>
      </button>
    </ng-container>
  `
})
export class DropdownItemComponent {
  @Input() tag: 'a' | 'button' = 'button';
  @Input() to?: string;
  @Input() baseClassName = 'block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900';
  @Input() className = '';
  @Output() onClick = new EventEmitter<void>();
  @Output() onItemClick = new EventEmitter<void>();

  handleClick(event: MouseEvent): void {
    if (this.tag === 'button') {
      event.preventDefault();
    }
    this.onClick.emit();
    this.onItemClick.emit();
  }
}
