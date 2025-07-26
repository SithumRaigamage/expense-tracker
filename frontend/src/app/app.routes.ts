import { Routes } from '@angular/router';
import { DashboardComponent } from './dasboard/dasboard.component';
import { TransactionsComponent } from './Navigation/components/transactions/transactions.component';
import { BudgetComponent } from './Navigation/components/budget/budget.component';
import { EmergencyFundComponent } from './Navigation/components/emergency-fund/emergency-fund.component';
import { WalletsComponent } from './Navigation/components/wallets/wallets.component';
import { ProfileComponent } from './Navigation/components/settings/profile/profile.component';
import { HelpComponent } from './Navigation/components/help/help.component';
import { BillsComponent } from './Navigation/components/bills/bills.component';
import { SettingsComponent } from './Navigation/components/settings/settings.component';
import { PaymentMethodsComponent } from './Navigation/components/settings/payment-methods/payment-methods.component';
import { CurrenyComponent } from './Navigation/components/settings/curreny/curreny.component';
import { AboutSupportComponent } from './Navigation/components/settings/about-support/about-support.component';
import { DocumentationComponent } from './Navigation/components/settings/documentation/documentation.component';
import { FaqComponent } from './Navigation/components/settings/faq/faq.component';
import { TroubleshootingComponent } from './Navigation/components/settings/troubleshooting/troubleshooting.component';
import { ReleaseNotesComponent } from './Navigation/components/settings/release-notes/release-notes.component';
import { SupportComponent } from './Navigation/components/settings/support/support.component';
import { FeedbackComponent } from './feedback/feedback.component';
import { ChatComponent } from './Navigation/components/chat/chat.component';
import { EducationComponent } from './education/education.component';
import { AuthGuard } from './core/guards/auth.guard';
import { ManageWalletsComponent } from './dasboard/components/manage-wallets/manage-wallets.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  // Auth routes (without layout)
  {
    path: 'login',
    loadComponent: () => import('./core/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./core/auth/register/register.component').then(m => m.RegisterComponent)
  },
  // Protected routes (with main layout)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
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
        path: 'manage-wallets',
        component: ManageWalletsComponent,
        title: 'Manage Wallets'
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
        path: 'bills',
        component: BillsComponent,
        title: 'Bills & Payments'
      },
      {
        path: 'financial-education',
        component: EducationComponent,
        title: 'Financial Education'
      },
      {
        path: 'chat',
        component: ChatComponent,
        title: 'Chat'
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
      },
      {
        path: 'feedback',
        component: FeedbackComponent,
        title: 'Feedback'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  }
];
