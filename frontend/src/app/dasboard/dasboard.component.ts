import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricsComponent } from "../dasboard/components/metrics/metrics.component";
import { MonthlyStatComponent } from "./components/monthly-stat/monthly-stat.component";
import { StatchartComponent } from "./components/statchart/statchart.component";
import { RecentTransactionsComponent } from "./components/recent-transactions/recent-transactions.component";
import { ManageWalletsComponent } from "./components/manage-wallets/manage-wallets.component";
import { BudgetPlannerComponent } from "./components/budget-planner/budget-planner.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MetricsComponent, MonthlyStatComponent, StatchartComponent, RecentTransactionsComponent, ManageWalletsComponent, BudgetPlannerComponent],
  templateUrl: './dasboard.component.html',
  styleUrl: './dasboard.component.css'
})
export class DashboardComponent {
}
