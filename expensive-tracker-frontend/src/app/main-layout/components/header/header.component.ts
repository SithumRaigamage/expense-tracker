import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SidebarService } from '../../../services/sidebar-service.service';
import { CommonModule } from '@angular/common';
import { UserDropdownComponent } from "./user-dropdown/user-dropdown.component";
import { CurrencySwitcherComponent } from '../../../shared/components/currency-switcher/currency-switcher.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  imports: [
    CommonModule,
    RouterModule,
    UserDropdownComponent,
    CurrencySwitcherComponent
  ],
  standalone: true
})
export class HeaderComponent {
  private readonly sidebarService = inject(SidebarService);
  private readonly destroyRef = inject(DestroyRef);

  isApplicationMenuOpen = false;
  isMobileOpen = false;

  constructor() {
    // Previously a bare .subscribe() that was never torn down. There was also a
    // document-level Cmd+K handler here that focused a #inputRef template
    // reference the header does not have — pressing Cmd+K anywhere in the app
    // threw on undefined. There is no search field to focus, so the shortcut is
    // gone rather than pointed at nothing.
    this.sidebarService.isMobileOpen$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => (this.isMobileOpen = state));
  }

  handleToggle(): void {
    if (window.innerWidth < 1024) {
      this.sidebarService.toggleMobile();
    } else {
      this.sidebarService.toggleSidebar();
    }
  }

  toggleApplicationMenu(): void {
    this.isApplicationMenuOpen = !this.isApplicationMenuOpen;
  }
}
