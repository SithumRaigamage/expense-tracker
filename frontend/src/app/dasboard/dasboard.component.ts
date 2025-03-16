import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Metric } from '../models/Metric';
import { BadgeComponent } from './badge/badge.component';
import { MetricsComponent } from "./metrics/metrics.component";
import { MonthlyTargetComponent } from "../monthly-target/monthly-target.component";
import { MonthlyStatComponent } from "../monthly-stat/monthly-stat.component";
import { StatchartComponent } from "../statchart/statchart.component";
import { RecentTransactionsComponent } from "../recent-transactions/recent-transactions.component";
import { ManageWalletsComponent } from "../manage-wallets/manage-wallets.component";
import { BudgetPlannerComponent } from "../budget-planner/budget-planner.component";
import { UpcomingBillsComponent } from "../upcoming-bills/upcoming-bills.component";
import { EmergencyFundComponent } from "../emergency-fund/emergency-fund.component";


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BadgeComponent, MetricsComponent, MonthlyTargetComponent, MonthlyStatComponent, StatchartComponent, RecentTransactionsComponent, ManageWalletsComponent, BudgetPlannerComponent, UpcomingBillsComponent, EmergencyFundComponent],
  templateUrl: './dasboard.component.html',
  styleUrl: './dasboard.component.css'
})
export class DashboardComponent {
}
