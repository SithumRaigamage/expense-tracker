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
  faComments
} from '@fortawesome/free-solid-svg-icons';
import { SidebarService } from '../services/sidebar-service.service';

interface NavItem {
  name: string;
  icon: IconDefinition;
  path: string;  // Make path required since we're removing subItems
  badge?: string;
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

  navItems: NavItem[] = [
    {
      icon: faGaugeHigh,
      name: 'Dashboard',
      path: '/dashboard',
    },
    {
      icon: faWallet,
      name: 'Wallets',
      path: '/wallets'
    },
    {
      icon: faMoneyCheckDollar,
      name: 'Transactions',
      path: '/transactions'
    },
    {
      icon: faBullseye,
      name: 'Monthly Target',
      path: '/monthly-target'
    },
    {
      icon: faFileInvoiceDollar,
      name: 'Bills',
      path: '/bills'
    },
    {
      icon: faChartLine,
      name: 'Product Budget ',
      path: '/budget'
    },
    {
      icon: faShieldHalved,
      name: 'Emergency Fund',
      path: '/emergency-fund'
    },
    {
      icon: faGraduationCap,
      name: 'Financial Education',
      path: '/financial-education'
    },
    {
      icon: faComments,
      name: 'Chat',
      path: '/chat'
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
