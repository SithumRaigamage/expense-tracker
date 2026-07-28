import { Component, OnInit, HostListener, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faMoneyCheckDollar,
  faGaugeHigh,
  faWallet,
  faChartLine,
  faShieldHalved,
  faGear,
  faCircleQuestion,
  faBullseye,
  faFileInvoiceDollar,
  faGraduationCap,
  faComments,
  faLock,
  faStar,
  faFeed,
  faBell,
  faChevronRight,
  faChevronDown,
  faFileImport
} from '@fortawesome/free-solid-svg-icons';
import { SidebarService } from '../../../services/sidebar-service.service';

interface SubNavItem {
  name: string;
  path: string;
  badge?: string;
  isLocked?: boolean;
  isNew?: boolean;
  isUpcoming?: boolean;
  isOpen?: boolean;
}

interface NavItem {
  name: string;
  icon: IconDefinition;
  path: string;
  badge?: string;
  isLocked?: boolean;
  isNew?: boolean;
  isUpcoming?: boolean;
  subItems?: SubNavItem[];
  isOpen?: boolean;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  standalone: true,
  imports: [RouterModule, FontAwesomeModule]
})
export class SidebarComponent implements OnInit {
  private router = inject(Router);
  sidebarService = inject(SidebarService);

  private readonly destroyRef = inject(DestroyRef);

  isExpanded = true;
  isMobileOpen = false;
  isHovered = false;
  lockIcon = faLock;
  sparklesIcon = faStar;
  chevronRight = faChevronRight;
  chevronDown = faChevronDown;

  navItems: NavItem[] = [
    {
      icon: faGaugeHigh,
      name: 'Dashboard',
      path: '/dashboard',
      isNew: false,
      isLocked: false
    },
    {
      icon: faWallet,
      name: 'Wallets',
      path: '/wallets',
      isNew: false,
      isLocked: false
    },
    {
      icon: faMoneyCheckDollar,
      name: 'Transactions',
      path: '/transactions',
      isNew: false,
      isLocked: false
    },
    {
      icon: faFileImport,
      name: 'Import & Scan',
      path: '/import',
      isNew: true,
      isLocked: false
    },
    {
      icon: faChartLine,
      name: 'Product Budget',
      path: '/budget',
      isNew: false,
      isLocked: false
    },
    {
      icon: faGraduationCap,
      name: 'Financial Education',
      path: '/financial-education',
      isUpcoming: true,
      isNew: false,
      isLocked: false
    },
    {
      icon: faComments,
      name: 'Chat',
      path: '/chat',
      isUpcoming: true,
      isNew: false,
      isLocked: false
    }
  ];

  othersItems: NavItem[] = [
    {
      icon: faGear,
      name: 'Settings',
      path: '/settings',
      isOpen: false,
      isUpcoming: false,
      isNew: false,
      subItems: [
        { name: 'Profile', path: '/settings/profile', isLocked: false, isNew: false, isUpcoming: false },
        { name: 'About & Support', path: '/settings/about & support', isLocked: false, isNew: false, isUpcoming: true },
      ]
    },
    {
      icon: faCircleQuestion,
      name: 'Help Center',
      path: '/help',
      isOpen: false,
      isUpcoming: false,
      isNew: false,
      isLocked: false,
      subItems: [
        { name: 'FAQs', path: '/help/faqs', isLocked: false, isNew: false, isUpcoming: true },
        { name: 'Documentation', path: '/help/docs', isLocked: false, isNew: false, isUpcoming: true },
        { name: 'Contact Support', path: '/help/support', isLocked: false, isNew: false, isUpcoming: false },
        { name: 'Troubleshooting', path: '/help/troubleshooting', isLocked: false, isNew: false, isUpcoming: true },
        { name: 'Release Notes', path: '/help/release-notes', isLocked: false, isNew: true, isUpcoming: false },
      ]
    },
    {
      icon: faFeed,
      name: 'Feedback',
      path: '/feedback',
      isUpcoming: true,
      isNew: false,
      isLocked: false
    }
  ];

  constructor() {
    const library = inject(FaIconLibrary);

    // Add icons to the library
    library.addIcons(
      faMoneyCheckDollar,
      faGaugeHigh,
      faWallet,
      faChartLine,
      faShieldHalved,
      faGear,
      faCircleQuestion,
      faBullseye,
      faFileInvoiceDollar,
      faGraduationCap,
      faComments,
      faLock,
      faStar,
      faFeed,
      faBell,
      faChevronRight,
      faChevronDown,
      faFileImport
    );

    // Update parent item lock status based on subitems
    this.updateParentLockStatus();
  }

  /**
   * Updates the lock status of parent navigation items based on their subitems.
   * If all subitems are locked, the parent will be locked.
   * If at least one subitem is not locked, the parent will not be locked.
   */
  updateParentLockStatus(): void {
    this.othersItems.forEach(item => {
      if (item.subItems && item.subItems.length > 0) {
        // Check if all subitems are locked
        const allSubitemsLocked = item.subItems.every(subItem => subItem.isLocked === true);
        
        // Only auto-lock parent if it doesn't have an explicit lock status and all subitems are locked
        if (item.isLocked === undefined || item.isLocked === null) {
          item.isLocked = allSubitemsLocked;
        }
      }
    });
  }

  /**
   * Checks if an item should be displayed based on its lock status and subitems
   */
  shouldDisplayItem(item: NavItem): boolean {
    // If item is explicitly locked, don't show it
    if (item.isLocked === true) {
      return false;
    }
    
    // If item has no subitems, show it if not locked
    if (!item.subItems || item.subItems.length === 0) {
      return !item.isLocked;
    }
    
    // If item has subitems, show it if at least one subitem is not locked
    return item.subItems.some(subItem => !subItem.isLocked);
  }

  ngOnInit(): void {
    this.sidebarService.isOpen$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      state => this.isExpanded = state
    );
    this.sidebarService.isMobileOpen$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      state => this.isMobileOpen = state
    );
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  // The mobile backdrop closes the sidebar on click; Escape is its keyboard
  // equivalent.
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isMobileOpen) {
      this.sidebarService.toggleMobile();
    }
  }

  toggleSubNav(item: NavItem, event: Event): void {
    event.preventDefault();

    // Only toggle if the item has subitems and is not completely locked
    if (item.subItems && !item.isLocked) {
      item.isOpen = !item.isOpen;
    }
  }
}
