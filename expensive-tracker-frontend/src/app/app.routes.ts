import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

/**
 * Every route is lazy-loaded. Importing the page components eagerly pulled the
 * entire application — settings, help centre, chat, education, every chart
 * library — into the initial bundle, so first paint paid for screens most users
 * never open. Only the shell and the route actually requested are downloaded now.
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  // Auth routes (without layout)
  {
    path: 'login',
    loadComponent: () => import('./auth/components/login/login.component').then(m => m.LoginComponent),
    title: 'Sign In'
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/components/register/register.component').then(m => m.RegisterComponent),
    title: 'Create Account'
  },
  // Protected routes (with main layout)
  {
    path: '',
    loadComponent: () => import('./main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard'
      },
      {
        path: 'wallets',
        loadComponent: () => import('./Navigation/components/wallets/wallets.component').then(m => m.WalletsComponent),
        title: 'Wallets'
      },
      {
        path: 'manage-wallets',
        loadComponent: () => import('./dashboard/components/manage-wallets/manage-wallets.component').then(m => m.ManageWalletsComponent),
        title: 'Manage Wallets'
      },
      {
        path: 'transactions',
        loadComponent: () => import('./Navigation/components/transactions/transactions.component').then(m => m.TransactionsComponent),
        title: 'Transactions'
      },
      {
        path: 'import',
        loadComponent: () => import('./Navigation/components/import-scan/import-scan.component').then(m => m.ImportScanComponent),
        title: 'Import & Scan'
      },
      {
        path: 'budget',
        loadComponent: () => import('./Navigation/components/budget/budget.component').then(m => m.BudgetComponent),
        title: 'Budget Planner'
      },
      {
        path: 'bills',
        loadComponent: () => import('./Navigation/components/bills/bills.component').then(m => m.BillsComponent),
        title: 'Bills & Payments'
      },
      {
        path: 'financial-education',
        loadComponent: () => import('./Navigation/components/education/education.component').then(m => m.EducationComponent),
        title: 'Financial Education'
      },
      {
        path: 'financial-education/:articleId',
        loadComponent: () => import('./Navigation/components/education/article/article.component').then(m => m.ArticleComponent),
        title: 'Financial Education'
      },
      {
        path: 'chat',
        loadComponent: () => import('./Navigation/components/chat/chat.component').then(m => m.ChatComponent),
        title: 'Chat'
      },
      {
        path: 'settings',
        title: 'Settings',
        loadComponent: () => import('./Navigation/components/settings/settings.component').then(m => m.SettingsComponent),
        children: [
          { path: '', redirectTo: 'profile', pathMatch: 'full' },
          {
            path: 'profile',
            loadComponent: () => import('./Navigation/components/settings/profile/profile.component').then(m => m.ProfileComponent),
            title: 'Profile Settings'
          },
          {
            path: 'currency',
            loadComponent: () => import('./Navigation/components/settings/currency/currency.component').then(m => m.CurrencyComponent),
            title: 'Currency Settings'
          },
          {
            path: 'about & support',
            loadComponent: () => import('./Navigation/components/settings/about-support/about-support.component').then(m => m.AboutSupportComponent),
            title: 'About & Support'
          }
        ]
      },
      {
        path: 'help',
        loadComponent: () => import('./Navigation/components/help/help.component').then(m => m.HelpComponent),
        title: 'Help Center',
        children: [
          { path: '', redirectTo: 'help', pathMatch: 'full' },
          {
            path: 'faqs',
            loadComponent: () => import('./Navigation/components/settings/faq/faq.component').then(m => m.FaqComponent),
            title: 'FAQs'
          },
          {
            path: 'docs',
            loadComponent: () => import('./Navigation/components/settings/documentation/documentation.component').then(m => m.DocumentationComponent),
            title: 'Documentation'
          },
          {
            path: 'support',
            loadComponent: () => import('./Navigation/components/settings/support/support.component').then(m => m.SupportComponent),
            title: 'Contact Support'
          },
          {
            path: 'troubleshooting',
            loadComponent: () => import('./Navigation/components/settings/troubleshooting/troubleshooting.component').then(m => m.TroubleshootingComponent),
            title: 'Troubleshooting'
          },
          {
            path: 'release-notes',
            loadComponent: () => import('./Navigation/components/settings/release-notes/release-notes.component').then(m => m.ReleaseNotesComponent),
            title: 'Release Notes'
          }
        ]
      },
      {
        path: 'feedback',
        loadComponent: () => import('./Navigation/components/feedback/feedback.component').then(m => m.FeedbackComponent),
        title: 'Feedback'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
