import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SidebarComponent } from "./components/sidebar/sidebar.component";
import { HeaderComponent } from "./components/header/header.component";
import { RouterModule } from '@angular/router';
import { SidebarService } from '../services/sidebar-service.service';

@Component({
  selector: 'app-main-layout',
  imports: [HeaderComponent, SidebarComponent, RouterModule],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  private readonly sidebarService = inject(SidebarService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Mirrors the sidebar's expanded state so the content area can reserve the
   * matching width. Hover-expansion is deliberately not tracked: the sidebar is
   * fixed, so hovering it overlays the content rather than displacing it, and
   * shifting the whole page under the pointer would be worse than the overlap.
   */
  isSidebarExpanded = true;

  constructor() {
    this.sidebarService.isOpen$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isOpen => (this.isSidebarExpanded = isOpen));
  }
}
