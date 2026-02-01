import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGear, faEye, faEyeSlash, faTimes, faArrowsRotate, faChartPie } from '@fortawesome/free-solid-svg-icons';
import { DashboardService, WidgetConfig } from '../services/dashboard.service';
import { MetricsComponent } from "./components/metrics/metrics.component";
import { MonthlyStatComponent } from "./components/monthly-stat/monthly-stat.component";
import { StatchartComponent } from "./components/statchart/statchart.component";
import { RecentTransactionsComponent } from "./components/recent-transactions/recent-transactions.component";
import { ManageWalletsComponent } from "./components/manage-wallets/manage-wallets.component";

import { BudgetPlannerComponent } from "./components/budget-planner/budget-planner.component";
import { UpcomingBillsComponent } from './components/upcoming-bills/upcoming-bills.component';
import { EmergencyFundComponent } from './components/emergency-fund/emergency-fund.component';
import { FinancialEducationComponent } from './components/financial-education/financial-education.component';
import { ExpenseBreakdownComponent } from './components/expense-breakdown/expense-breakdown.component';
import { WalletService } from '../services/wallet.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    MetricsComponent,
    MonthlyStatComponent,
    StatchartComponent,
    RecentTransactionsComponent,
    ManageWalletsComponent,
    BudgetPlannerComponent,
    UpcomingBillsComponent,
    EmergencyFundComponent,
    FinancialEducationComponent,
    FinancialEducationComponent,
    ExpenseBreakdownComponent
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  faGear = faGear;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faTimes = faTimes;
  faArrowsRotate = faArrowsRotate;
  faChartPie = faChartPie;

  isCustomizing = false;
  widgets: WidgetConfig[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.dashboardService.widgets$.subscribe(widgets => {
      this.widgets = widgets;
    });

    // Load flow data for Expense Breakdown charts
    // Removed inline flow data fetching as it is now handled in ExpenseBreakdownComponent
  }

  toggleDrawer() {
    this.isCustomizing = !this.isCustomizing;
  }

  toggleWidget(id: string) {
    this.dashboardService.toggleWidget(id);
  }

  resetWidgets() {
    this.dashboardService.resetToDefault();
  }

  isVisible(id: string): boolean {
    return this.dashboardService.isWidgetVisible(id);
  }


}
