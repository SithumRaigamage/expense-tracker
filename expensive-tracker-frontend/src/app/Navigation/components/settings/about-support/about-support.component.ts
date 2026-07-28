import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { WalletService } from '../../../../services/wallet.service';
import { TransactionService } from '../../../../services/transaction.service';
import { ProductBudgetService } from '../../../../services/product-budget.service';
import { BillsService } from '../../../../services/bill.service';
import { ExcelExportService } from '../../../../services/excel-export.service';
import { forkJoin, take, finalize } from 'rxjs';
import { NotificationService } from '../../../../shared/services/notification.service';

interface LegalLink {
  title: string;
  url: string;
}

interface Developer {
  name: string;
  role: string;
  avatar: string;
}

@Component({
  selector: 'app-about-support',
  standalone: true,
  imports: [FontAwesomeModule],
  templateUrl: './about-support.component.html',
})
export class AboutSupportComponent {
  private readonly destroyRef = inject(DestroyRef);

  isExporting = false;
  faDownload = faDownload;

  constructor(
    private walletService: WalletService,
    private transactionService: TransactionService,
    private budgetService: ProductBudgetService,
    private billsService: BillsService,
    private excelExportService: ExcelExportService,
    private readonly notifications: NotificationService
  ) {}
  appName = 'ExpenseTracker';
  appVersion = '1.0.0';
  releaseNotes = [
    'Enhanced dashboard visualization',
    'New wallet management features',
    'Improved budget planning tools',
    'Bug fixes and performance improvements'
  ];

  legalLinks: LegalLink[] = [
    { title: 'Terms of Service', url: '/terms' },
    { title: 'Privacy Policy', url: '/privacy' },
    { title: 'License Information', url: '/license' }
  ];

  developer: Developer = {
    name: 'Sithum Raigamage',
    role: 'Developer & Creator',
    avatar: 'assets/images/user/owner.png'
  };

  accessibilityStatement = 'ExpenseTracker aims to simplify wallet management for everyone. We understand managing multiple wallets can be challenging, so we\'ve designed our interface with clear visuals, intuitive navigation, and helpful tooltips to make tracking your expenses as straightforward as possible.';

  exportAllData() {
    this.isExporting = true;
    
    forkJoin({
      wallets: this.walletService.wallets$.pipe(take(1)),
      transactions: this.transactionService.getAllTransactions().pipe(take(1)),
      budget: this.budgetService.getGoals().pipe(take(1)),
      bills: this.billsService.getBills().pipe(take(1)),
      billTransactions: this.billsService.getTransactions().pipe(take(1))
    }).pipe(
      finalize(() => this.isExporting = false)
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.excelExportService.exportAllToExcel({
          'Wallets': data.wallets,
          'Transactions': data.transactions,
          'Budget Goals': data.budget,
          'Upcoming Bills': data.bills,
          'Bill History': data.billTransactions
        }, 'ExpenseTracker_FullExport');
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.notifications.error('Could not export your data. Please try again.');
      }
    });
  }
}
