import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faMoneyCheckDollar,
  faGaugeHigh,
  faWallet,
  faChartLine,
  faShieldHalved,
  faGear,
  faCircleQuestion
} from '@fortawesome/free-solid-svg-icons';
import { SidebarService } from '../services/sidebar-service.service';

interface NavItem {
  name: string;
  icon: IconDefinition;
  path?: string;  // Make path optional since items with subItems won't have a path
  badge?: string;
  subItems?: Array<{
    name: string;
    path: string;
    pro?: boolean;
    new?: boolean;
  }>;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule]
})
export class SidebarComponent implements OnInit {
  isExpanded = true;
  isMobileOpen = false;
  isHovered = false;
  openSubmenu: { type: 'main' | 'others'; index: number } | null = null;
  moneyIcon = faMoneyCheckDollar;

  navItems: NavItem[] = [
    {
      icon: faGaugeHigh,
      name: 'Dashboard',
      path: '/dashboard',
    },
    {
      icon: faWallet,
      name: 'Transactions',
      path: '/transactions',
    },
    {
      icon: faChartLine,
      name: 'Budget',
      path: '/budget',
    },
    {
      icon: faShieldHalved,
      name: 'Emergency Fund',
      path: '/emergency-fund',
    }
  ];

  othersItems: NavItem[] = [
    {
      icon: faGear,
      name: 'Settings',
      subItems: [
        { name: 'Profile', path: '/settings/profile' },
        { name: 'Preferences', path: '/settings/preferences' }
      ]
    },
    {
      icon: faCircleQuestion,
      name: 'Help Center',
      path: '/help',
    }
  ];

  constructor(private router: Router, private sidebarService: SidebarService) {}

  ngOnInit(): void {
    this.checkActiveRoute();
    this.sidebarService.isOpen$.subscribe(
      state => this.isExpanded = state
    );
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  handleSubmenuToggle(index: number, menuType: 'main' | 'others'): void {
    if (this.openSubmenu?.type === menuType && this.openSubmenu.index === index) {
      this.openSubmenu = null;
    } else {
      this.openSubmenu = { type: menuType, index };
    }
  }

  private checkActiveRoute(): void {
    let submenuMatched = false;
    ['main', 'others'].forEach((menuType) => {
      const items = menuType === 'main' ? this.navItems : this.othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (this.isActive(subItem.path)) {
              this.openSubmenu = {
                type: menuType as 'main' | 'others',
                index
              };
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      this.openSubmenu = null;
    }
  }
}
