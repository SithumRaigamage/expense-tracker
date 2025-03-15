import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  isMobileOpen = false;

  toggleSidebar(): void {
    // Logic to toggle the sidebar
  }

  toggleMobileSidebar(): void {
    this.isMobileOpen = !this.isMobileOpen;
  }
}
