import { Routes } from '@angular/router';
import { DashboardComponent } from './dasboard/dasboard.component';
import { TransactionsComponent } from './Navigation/transactions/transactions.component';
import { BudgetComponent } from './Navigation/budget/budget.component';
import { EmergencyFundComponent } from './Navigation/emergency-fund/emergency-fund.component';
import { WalletsComponent } from './Navigation/wallets/wallets.component';
import { ProfileComponent } from './settings/profile/profile.component';

import { HelpComponent } from './Navigation/help/help.component';
import { MonthlyTargetComponent } from './Navigation/target/target.component';
import { BillsComponent } from './Navigation/bills/bills.component';
import { SettingsComponent } from './settings/settings.component';
import { PaymentMethodsComponent } from './settings/payment-methods/payment-methods.component';
import { CurrenyComponent } from './settings/curreny/curreny.component';

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
      { path: '', redirectTo: 'profile', pathMatch: 'full' }, // Add this line
      { path: 'profile', component: ProfileComponent, title: 'Profile Settings' },
      { path: 'payment-methods', component: PaymentMethodsComponent, title: 'Payment Methods' },
      {path: 'currency', component: CurrenyComponent, title: 'Currency Settings' },
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
