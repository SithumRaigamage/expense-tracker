import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-notification-dropdown',
  imports: [CommonModule],
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.css'] // Changed from .scss to .css
})
export class NotificationDropdownComponent {
  isOpen = false;
  notifying = true;

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  handleClick(): void {
    this.toggleDropdown();
    this.notifying = false;
  }
}
