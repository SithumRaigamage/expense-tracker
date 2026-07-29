import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SidebarService } from '../../../services/sidebar-service.service';
import { CommonModule } from '@angular/common';
import { UserDropdownComponent } from './user-dropdown/user-dropdown.component';
import { CurrencySwitcherComponent } from '../../../shared/components/currency-switcher/currency-switcher.component';
import { ThemeToggleButtonComponent } from './theme-toggle-button/theme-toggle-button.component';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  imports: [
    CommonModule,
    RouterModule,
    UserDropdownComponent,
    CurrencySwitcherComponent,
    ThemeToggleButtonComponent
  ],
  standalone: true
})
export class HeaderComponent {
  private readonly sidebarService = inject(SidebarService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isMobileOpen = false;
  isSidebarExpanded = true;

  /**
   * The current route's own title, shown as the page heading.
   *
   * Read from the route rather than `Title` because the title strategy appends
   * " · Expensify" for the browser tab, which would be noise on screen.
   */
  readonly pageTitle = signal('');

  constructor() {
    // Previously a bare .subscribe() that was never torn down. There was also a
    // document-level Cmd+K handler here that focused a #inputRef template
    // reference the header does not have — pressing Cmd+K anywhere in the app
    // threw on undefined. There is no search field to focus, so the shortcut is
    // gone rather than pointed at nothing.
    this.sidebarService.isMobileOpen$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => (this.isMobileOpen = state));

    this.sidebarService.isOpen$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => (this.isSidebarExpanded = state));

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        map(() => this.deepestTitle()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(title => this.pageTitle.set(title));

    this.pageTitle.set(this.deepestTitle());
  }

  /** Walks to the leaf route so nested pages report their own title, not the parent's. */
  private deepestTitle(): string {
    let route = this.route.snapshot;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.title ?? '';
  }

  handleToggle(): void {
    if (window.innerWidth < 1024) {
      this.sidebarService.toggleMobile();
    } else {
      this.sidebarService.toggleSidebar();
    }
  }
}
