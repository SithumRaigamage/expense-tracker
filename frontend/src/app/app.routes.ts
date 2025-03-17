import { Routes } from '@angular/router';
import { DashboardComponent } from './dasboard/dasboard.component';
import { TransactionsComponent } from './Navigation/transactions/transactions.component';
import { BudgetComponent } from './Navigation/budget/budget.component';
import { EmergencyFundComponent } from './Navigation/emergency-fund/emergency-fund.component';
import { ProfileComponent } from './Navigation/settings/profile/profile.component';
import { PreferencesComponent } from './Navigation/settings/preferences/preferences.component';


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
    path: 'settings',
    children: [
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
    path: '**',
    redirectTo: 'dashboard'
  }
];
