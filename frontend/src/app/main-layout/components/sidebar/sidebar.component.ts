import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  faChevronDown
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
  imports: [CommonModule, RouterModule, FontAwesomeModule]
})
export class SidebarComponent implements OnInit {
  isExpanded = true;
  isMobileOpen = false;
  isHovered = false;
  moneyIcon = faMoneyCheckDollar;
  lockIcon = faLock;
  sparklesIcon = faStar;
  chevronRight = faChevronRight;
  chevronDown = faChevronDown;

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
    // {
    //   icon: faFileInvoiceDollar,
    //   name: 'Bills',
    //   path: '/bills',
    //   isNew: false,
    //   isLocked: false
    // },
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
      path: '/settings',
      isOpen: false,
      subItems: [
        { name: 'Profile', path: '/settings/profile' },
        { name: 'Payment Methods', path: '/settings/payment-methods' },
        { name: 'About & Support', path: '/settings/about & support' },
        { name: 'Currency', path: '/settings/currency' },
      ]
    },
    {
      icon: faCircleQuestion,
      name: 'Help Center',
      path: '/help',
      isOpen: false,
      subItems: [
        { name: 'FAQs', path: '/help/faqs' },
        { name: 'Documentation', path: '/help/docs' },
        { name: 'Contact Support', path: '/help/support' },
        { name: 'Troubleshooting', path: '/help/troubleshooting' },
        { name: 'Release Notes', path: '/help/release-notes' },
      ]
    },
    {
      icon: faFeed,
      name: 'Feedback',
      path: '/feedback'
    }
  ];

  constructor(
    private router: Router,
    private sidebarService: SidebarService,
    library: FaIconLibrary
  ) {
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
      faChevronDown
    );
  }

  ngOnInit(): void {
    this.sidebarService.isOpen$.subscribe(
      state => this.isExpanded = state
    );
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  toggleSubNav(item: NavItem, event: Event): void {
    event.preventDefault();
    if (item.subItems) {
      item.isOpen = !item.isOpen;
    }
  }
}
