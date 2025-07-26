import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricsComponent } from "../dasboard/components/metrics/metrics.component";
import { MonthlyStatComponent } from "./components/monthly-stat/monthly-stat.component";
import { StatchartComponent } from "./components/statchart/statchart.component";
import { RecentTransactionsComponent } from "./components/recent-transactions/recent-transactions.component";
import { ManageWalletsComponent } from "./components/manage-wallets/manage-wallets.component";
import { BudgetPlannerComponent } from "./components/budget-planner/budget-planner.component";
import { UpcomingBillsComponent } from "./components/upcoming-bills/upcoming-bills.component";
import { EmergencyFundComponent } from "./components/emergency-fund/emergency-fund.component";
import { FinancialEducationComponent } from "./components/financial-education/financial-education.component";


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MetricsComponent, MonthlyStatComponent, StatchartComponent, RecentTransactionsComponent, ManageWalletsComponent, BudgetPlannerComponent, UpcomingBillsComponent, EmergencyFundComponent, FinancialEducationComponent],
  templateUrl: './dasboard.component.html',
  styleUrl: './dasboard.component.css'
})
export class DashboardComponent {
}
