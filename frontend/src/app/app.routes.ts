import { Routes } from '@angular/router';
import { DashboardComponent } from './dasboard/dasboard.component';
import { TransactionsComponent } from './Navigation/transactions/transactions.component';
import { BudgetComponent } from './Navigation/budget/budget.component';
import { EmergencyFundComponent } from './Navigation/emergency-fund/emergency-fund.component';
import { WalletsComponent } from './Navigation/wallets/wallets.component';

import { HelpComponent } from './Navigation/help/help.component';
import { MonthlyTargetComponent } from './Navigation/target/target.component';
import { BillsComponent } from './Navigation/bills/bills.component';
import { SettingsComponent } from './settings/settings.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    title: 'Dashboard'
  },
  {
    path: 'wallets',
    component: WalletsComponent,
    title: 'Wallets'
  },
  {
    path: 'transactions',
    component: TransactionsComponent,
    title: 'Transactions'
  },
  {
    path: 'budget',
    component: BudgetComponent,
    title: 'Budget Planner'
  },
  {
    path: 'emergency-fund',
    component: EmergencyFundComponent,
    title: 'Emergency Fund'
  },
  {
    path: 'monthly-target',
    component: MonthlyTargetComponent,
    title: 'Monthly Target'
  },
  {
    path: 'bills',
    component: BillsComponent,
    title: 'Bills & Payments'
  },
  {
    path: 'settings',
    title: 'Settings',
    component: SettingsComponent,
    children: [
      { path: 'profile', component: SettingsComponent, title: 'Profile Settings' },
      { path: 'payment-methods', component: SettingsComponent, title: 'Payment Methods' },
      { path: 'security', component: SettingsComponent, title: 'Security Settings' }
    ]
  },
  {
    path: 'help',
    component: HelpComponent,
    title: 'Help Center',
    children: [
      { path: 'faqs', component: HelpComponent, title: 'FAQs' },
      { path: 'docs', component: HelpComponent, title: 'Documentation' },
      { path: 'support', component: HelpComponent, title: 'Contact Support' }
    ]
  }
];
