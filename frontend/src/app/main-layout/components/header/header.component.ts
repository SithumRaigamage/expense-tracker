import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SidebarService } from '../../../services/sidebar-service.service';
import { CommonModule } from '@angular/common';
import { ThemeToggleButtonComponent } from "./theme-toggle-button/theme-toggle-button.component";
import { NotificationDropdownComponent } from "./notification-dropdown/notification-dropdown.component";
import { UserDropdownComponent } from "./user-dropdown/user-dropdown.component";
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  imports: [
    CommonModule,
    RouterModule,
    ThemeToggleButtonComponent,
    NotificationDropdownComponent,
    UserDropdownComponent
  ],
  styleUrls: ['./header.component.css'],
  standalone: true
})
export class HeaderComponent implements OnInit, OnDestroy {
  isApplicationMenuOpen = false;
  isMobileOpen = false;

  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  constructor(private sidebarService: SidebarService) {}

  ngOnInit(): void {
    this.isMobileOpen = this.sidebarService.isMobileOpen;
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  handleToggle(): void {
    this.sidebarService.toggleSidebar();
    this.isMobileOpen = !this.isMobileOpen;
  }

  toggleApplicationMenu(): void {
    this.isApplicationMenuOpen = !this.isApplicationMenuOpen;
  }

  handleKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.inputRef.nativeElement.focus();
    }
  }
}
