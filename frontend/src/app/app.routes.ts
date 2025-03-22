import { Routes } from '@angular/router';
import { DashboardComponent } from './dasboard/dasboard.component';
import { TransactionsComponent } from './Navigation/transactions/transactions.component';
import { BudgetComponent } from './Navigation/budget/budget.component';
import { EmergencyFundComponent } from './Navigation/emergency-fund/emergency-fund.component';
import { WalletsComponent } from './Navigation/wallets/wallets.component';
import { ProfileComponent } from './Navigation/settings/profile/profile.component';
import { PreferencesComponent } from './Navigation/settings/preferences/preferences.component';
import { HelpComponent } from './Navigation/help/help.component';
import { MonthlyTargetComponent } from './Navigation/monthly-target-nav/monthly-target.component';
import { BillsComponent } from './Navigation/bills/bills.component';

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
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'profile',
        component: ProfileComponent,
        title: 'Profile Settings'
      },
      {
        path: 'preferences',
        component: PreferencesComponent,
        title: 'Preferences'
      }
    ]
  },
  {
    path: 'help',
    component: HelpComponent,
    title: 'Help Center'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
