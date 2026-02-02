import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SidebarService } from '../../../services/sidebar-service.service';
import { CommonModule } from '@angular/common';
import { UserDropdownComponent } from "./user-dropdown/user-dropdown.component";
import { CurrencySwitcherComponent } from '../../../shared/components/currency-switcher/currency-switcher.component';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faMoneyCheckDollar } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  imports: [
    CommonModule,
    RouterModule,
    UserDropdownComponent,
    CurrencySwitcherComponent,
    FontAwesomeModule
  ],
  standalone: true
})
export class HeaderComponent implements OnInit, OnDestroy {
  isApplicationMenuOpen = false;
  isMobileOpen = false;
  moneyIcon = faMoneyCheckDollar;

  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  constructor(
    private sidebarService: SidebarService,
    library: FaIconLibrary
  ) {
    library.addIcons(faMoneyCheckDollar);
  }

  ngOnInit(): void {
    this.sidebarService.isMobileOpen$.subscribe(state => {
      this.isMobileOpen = state;
    });
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
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

  handleKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.inputRef.nativeElement.focus();
    }
  }
}
