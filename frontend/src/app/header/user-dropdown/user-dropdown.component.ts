import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DropdownComponent } from '../../shared/components/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../shared/components/dropdown-item/dropdown-item.component';

@Component({
  selector: 'app-user-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DropdownComponent,
    DropdownItemComponent
  ],
  templateUrl: './user-dropdown.component.html'
})
export class UserDropdownComponent {
  isOpen = false;

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }
}
