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
  faCircleQuestion,
  faBullseye,
  faFileInvoiceDollar,
  faGraduationCap,
  faComments,
  faLock,
  faStar
} from '@fortawesome/free-solid-svg-icons';
import { SidebarService } from '../services/sidebar-service.service';

interface NavItem {
  name: string;
  icon: IconDefinition;
  path: string;  // Make path required since we're removing subItems
  badge?: string;
  isLocked?: boolean;
  isNew?: boolean;
  isUpcoming?: boolean;
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
  moneyIcon = faMoneyCheckDollar;
  lockIcon = faLock;
  sparklesIcon = faStar;

  navItems: NavItem[] = [
    {
      icon: faGaugeHigh,
      name: 'Dashboard',
      path: '/dashboard',
      isNew: false
    },
    {
      icon: faWallet,
      name: 'Wallets',
      path: '/wallets',
      isNew: false
    },
    {
      icon: faMoneyCheckDollar,
      name: 'Transactions',
      path: '/transactions',
      isNew: false
    },
    {
      icon: faBullseye,
      name: 'Monthly Target',
      path: '/monthly-target',
      isNew: false,
      isLocked: false
    },
    {
      icon: faFileInvoiceDollar,
      name: 'Bills',
      path: '/bills',
      isNew: false,
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
      icon: faShieldHalved,
      name: 'Emergency Fund',
      path: '/emergency-fund',
      isUpcoming: true,
      isNew: false,
      isLocked: true
    },
    {
      icon: faGraduationCap,
      name: 'Financial Education',
      path: '/financial-education',
      isUpcoming: true,
      isNew: false,
      isLocked: true
    },
    {
      icon: faComments,
      name: 'Chat',
      path: '/chat',
      isUpcoming: true,
      isNew: false,
      isLocked: true
    }
  ];

  othersItems: NavItem[] = [
    {
      icon: faGear,
      name: 'Settings',
      path: '/settings'
    },
    {
      icon: faCircleQuestion,
      name: 'Help Center',
      path: '/help'
    }
  ];

  constructor(private router: Router, private sidebarService: SidebarService) {}

  ngOnInit(): void {
    this.sidebarService.isOpen$.subscribe(
      state => this.isExpanded = state
    );
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }
}
