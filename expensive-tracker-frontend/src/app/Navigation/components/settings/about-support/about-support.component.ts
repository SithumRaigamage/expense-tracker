import { Component } from '@angular/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { WalletService } from '../../../../services/wallet.service';
import { TransactionService } from '../../../../services/transaction.service';
import { ProductBudgetService } from '../../../../services/product-budget.service';
import { BillsService } from '../../../../services/bill.service';
import { ExcelExportService } from '../../../../services/excel-export.service';
import { forkJoin, take, finalize } from 'rxjs';

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
  isExporting = false;
  faDownload = faDownload;

  constructor(
    private walletService: WalletService,
    private transactionService: TransactionService,
    private budgetService: ProductBudgetService,
    private billsService: BillsService,
    private excelExportService: ExcelExportService
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
    ).subscribe({
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
        alert('Failed to export data. Please try again.');
      }
    });
  }
}
