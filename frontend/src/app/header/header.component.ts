import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SidebarService } from '../services/sidebar-service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
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
    if (window.innerWidth >= 991) {
      this.sidebarService.toggleSidebar();
    } else {
      this.sidebarService.toggleMobileSidebar();
    }
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
