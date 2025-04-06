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
import { AboutSupportComponent } from './settings/about-support/about-support.component';
import { DocumentationComponent } from './settings/documentation/documentation.component';
import { FaqComponent } from './settings/faq/faq.component';
import { TroubleshootingComponent } from './settings/troubleshooting/troubleshooting.component';
import { ReleaseNotesComponent } from './settings/release-notes/release-notes.component';
import { SupportComponent } from './settings/support/support.component';

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
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', component: ProfileComponent, title: 'Profile Settings' },
      { path: 'payment-methods', component: PaymentMethodsComponent, title: 'Payment Methods' },
      { path: 'currency', component: CurrenyComponent, title: 'Currency Settings' },
      { path: 'about & support', component: AboutSupportComponent, title: 'About & Support' }
    ]
  },
  {
    path: 'help',
    component: HelpComponent,
    title: 'Help Center',
    children: [
      { path: '', redirectTo: 'help', pathMatch: 'full' },
      { path: 'faqs', component: FaqComponent, title: 'FAQs' },
      { path: 'docs', component: DocumentationComponent, title: 'Documentation' },
      { path: 'support', component: SupportComponent, title: 'Contact Support' },
      { path: 'troubleshooting', component: TroubleshootingComponent, title: 'Troubleshooting' },
      { path: 'release-notes', component: ReleaseNotesComponent, title: 'Release Notes' }
    ]
  }
];
