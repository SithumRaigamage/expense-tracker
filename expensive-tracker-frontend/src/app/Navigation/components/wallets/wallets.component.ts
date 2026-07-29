import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faWallet, faPlus, faPencil, faTrash, faMoneyBillWave, faBuildingColumns,
  faCreditCard, faPiggyBank, faBitcoinSign, faChartLine, faHandHoldingDollar,
  faRefresh, faExclamationTriangle, faEdit, faArrowRight, faUpload,
  faFileUpload, faFileImport, faExchangeAlt, faDownload
} from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { Wallet } from '../../../core/models/Wallet';
import { WalletService } from '../../../services/wallet.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { TransferDialogComponent } from './transfer-dialog/transfer-dialog.component';
import { Router } from '@angular/router';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { ExcelExportService } from '../../../services/excel-export.service';
import { SideDrawerComponent } from '../../../shared/components/side-drawer/side-drawer.component';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-wallets',
  templateUrl: './wallets.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, AppCurrencyPipe, SideDrawerComponent]
})
export class WalletsComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  walletService = inject(WalletService);
  private dialogService = inject(DialogService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  currencyService = inject(CurrencyService);
  private excelExportService = inject(ExcelExportService);
  private readonly notifications = inject(NotificationService);

  faWallet = faWallet;
  faPlus = faPlus;
  faPencil = faPencil;
  faTrash = faTrash;
  faMoneyBillWave = faMoneyBillWave;
  faBuildingColumns = faBuildingColumns;
  faCreditCard = faCreditCard;
  faPiggyBank = faPiggyBank;
  faBitcoinSign = faBitcoinSign;
  faChartLine = faChartLine;
  faHandHoldingDollar = faHandHoldingDollar;
  faRefresh = faRefresh;
  faExclamationTriangle = faExclamationTriangle;
  faEdit = faEdit;
  faArrowRight = faArrowRight;
  faUpload = faUpload;
  faFileUpload = faFileUpload;
  faFileImport = faFileImport;
  faExchangeAlt = faExchangeAlt;
  faDownload = faDownload;

  walletForm!: FormGroup;
  isDrawerOpen = false;
  selectedWallet: Wallet | null = null;
  wallets: Wallet[] = [];
  error: string | null = null;
  isLoading = false;
  isAuthError = false;
  activeTab: 'manual' | 'upload' = 'manual';

  currencies = ['LKR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];

  // File upload related properties
  selectedFile: File | null = null;
  jsonPreview: Wallet[] | null = null;
  jsonError: string | null = null;

  private subscription: Subscription;

  constructor() {
    this.subscription = new Subscription();
    this.initForm();
  }

  openTransferDialog(wallet?: Wallet) {
    const dialogRef = this.dialog.open(TransferDialogComponent, {
      width: '500px',
      data: { fromWallet: wallet }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.notifications.success('Transfer complete.');
      }
    });
  }

  ngOnInit() {
    // Subscribe to wallets (now with primary currency)
    this.subscription.add(
      this.walletService.wallets$.subscribe(wallets => {
        this.wallets = wallets;
      })
    );

    // Subscribe to error state
    this.subscription.add(
      this.walletService.error$.subscribe(error => {
        this.error = error;
        // Check if it's an authentication error
        this.isAuthError = error?.includes('Not authenticated') || error?.includes('authorized') || false;
      })
    );

    // Subscribe to loading state
    this.subscription.add(
      this.walletService.loading$.subscribe(loading => {
        this.isLoading = loading;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private initForm() {
    this.walletForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', [Validators.required]],
      balance: [null, [Validators.required, Validators.min(0)]],
      currency: ['LKR', Validators.required],
      paymentMethod: ['']
    });
  }

  // Method to get wallet icon
  getWalletIcon(type: string) {
    return this.walletService.getWalletTypeIcon(type);
  }

  /**
   * Tile colour per wallet type.
   *
   * Every entry gained a dark twin — the light-only tints (`bg-green-100` and
   * friends) rendered as bright blocks against the dark surface once the theme
   * started working.
   */
  getWalletColor(type: string): string {
    const colorMap: Record<string, string> = {
      'cash': 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/15',
      'bank': 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-500/15',
      'credit': 'text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-500/15',
      'savings': 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/15',
      'crypto': 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-500/15',
      'investment': 'text-sky-600 bg-sky-100 dark:text-sky-400 dark:bg-sky-500/15',
      'loan': 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-500/15',
      'emergencyfund': 'text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-500/15'
    };
    return colorMap[type] || 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-white/10';
  }

  /**
   * Human-readable name for a wallet type.
   *
   * The raw value was printed straight into the card, so the stored
   * `emergencyfund` surfaced to users as "Emergencyfund".
   */
  getWalletTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      cash: 'Cash',
      bank: 'Bank',
      credit: 'Credit',
      savings: 'Savings',
      crypto: 'Crypto',
      investment: 'Investment',
      loan: 'Loan',
      emergencyfund: 'Emergency fund'
    };
    return labels[type] ?? type;
  }

  openDrawer(wallet?: Wallet) {
    this.isDrawerOpen = true;
    this.selectedWallet = wallet || null;
    this.activeTab = 'manual';  // Always default to manual when editing

    if (wallet) {
      this.walletForm.patchValue({
        name: wallet.name,
        type: wallet.type,
        balance: wallet.balance,
        currency: wallet.currency,
        paymentMethod: wallet.paymentMethod || ''
      });
    } else {
      this.walletForm.reset({
        currency: 'LKR'
      });
    }
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    this.selectedWallet = null;
    this.walletForm.reset();
    this.resetFileUpload();
  }

  switchTab(tab: 'manual' | 'upload') {
    if (this.activeTab !== tab) {
      this.activeTab = tab;

      // Reset form data when switching tabs
      if (tab === 'manual') {
        this.resetFileUpload();
      } else {
        this.walletForm.reset({
          currency: 'LKR'
        });
      }
    }
  }

  onSubmit() {
    if (this.walletForm.valid && !this.isLoading) {
      this.isLoading = true;
      const walletData = this.walletForm.value;

      if (this.selectedWallet) {
        this.walletService.updateWallet(this.selectedWallet.id, walletData).subscribe({
          next: () => {
            this.closeDrawer();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error updating wallet:', error);
            this.notifications.error(error?.message || 'Could not update that wallet.');
            this.isLoading = false;
          }
        });
      } else {
        this.walletService.addWallet(walletData).subscribe({
          next: () => {
            this.closeDrawer();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error adding wallet:', error);
            this.notifications.error(error?.message || 'Could not add that wallet.');
            this.isLoading = false;
          }
        });
      }
    }
  }

  // File upload methods
  onFileSelected(event: Event) {
    const element = event.target as HTMLInputElement;
    const file = element.files?.[0];

    if (!file) {
      return;
    }

    this.selectedFile = file;
    this.jsonError = null;
    this.jsonPreview = null;

    if (!file.name.endsWith('.json')) {
      this.jsonError = 'Please select a valid JSON file';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        // A null result parses to a SyntaxError, which the catch below already
        // reports as an invalid file.
        const json = JSON.parse(String(e.target?.result ?? ''));
        this.processJsonData(json);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        this.jsonError = 'Invalid JSON format. Please check the file structure.';
      }
    };

    reader.onerror = () => {
      this.jsonError = 'Error reading file. Please try again.';
    };

    reader.readAsText(file);
  }

  // The argument comes straight from a user-supplied file, so it is unknown
  // until these checks have run over it.
  processJsonData(data: unknown) {
    // Validate the JSON structure
    if (!Array.isArray(data)) {
      this.jsonError = 'Invalid JSON format. Expected an array of wallets.';
      return;
    }

    const validWallets: Wallet[] = [];
    const errors: string[] = [];
    const walletTypes = ['cash', 'bank', 'credit', 'savings', 'crypto', 'investment', 'loan', 'emergencyfund'];

    data.forEach((entry: unknown, index: number) => {
      const item = (entry ?? {}) as Record<string, unknown>;
      const name = typeof item['name'] === 'string' ? item['name'] : '';
      const type = item['type'];
      const label = name || index;

      if (!name) {
        errors.push(`Wallet at index ${index} is missing a name`);
      }

      if (typeof type !== 'string' || !walletTypes.includes(type)) {
        errors.push(`Wallet "${label}" has an invalid type`);
      }

      if (item['balance'] === undefined || isNaN(Number(item['balance']))) {
        errors.push(`Wallet "${label}" has an invalid balance`);
      }

      if (!errors.length) {
        validWallets.push({
          id: '', // Will be assigned by server
          name,
          type: type as Wallet['type'],
          balance: Number(item['balance']),
          currency: String(item['currency'] || 'LKR'),
          paymentMethod: String(item['paymentMethod'] || ''),
          user: '' // Will be assigned by server
        });
      }
    });

    if (errors.length) {
      this.jsonError = `Found ${errors.length} issues in your data:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n...and ${errors.length - 3} more issues` : ''}`;
      return;
    }

    if (validWallets.length === 0) {
      this.jsonError = 'No valid wallets found in the file.';
      return;
    }

    this.jsonPreview = validWallets;
  }

  importWallets() {
    if (!this.jsonPreview || this.isLoading) {
      return;
    }

    this.isLoading = true;

    // Use the updated bulkAddWallets method that now handles sequential processing
    this.walletService.bulkAddWallets(this.jsonPreview).subscribe({
      next: (result) => {
        if (result.failedCount > 0 && result.failedWallets) {
          // Create a more detailed message about the failures
          const failureDetails = result.failedWallets
            .map(w => `• ${w.name}: ${w.error}`)
            .join('\n');

          // Use a simple alert with details
          this.notifications.error(`Imported ${result.successCount}. ${result.failedCount} failed: ${failureDetails}`);
        } else if (result.failedCount > 0) {
          this.notifications.error(`Imported ${result.successCount} wallets; ${result.failedCount} failed.`);
        } else {
          this.notifications.success(`Imported ${result.successCount} wallets.`);
        }
        this.closeDrawer();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error importing wallets:', error);
        this.notifications.error(error?.message || 'Could not import those wallets.');
        this.isLoading = false;
      }
    });
  }

  resetFileUpload() {
    this.selectedFile = null;
    this.jsonPreview = null;
    this.jsonError = null;
  }

  deleteWallet(id: string) {
    this.dialogService.confirmDelete('wallet').subscribe(result => {
      if (result) {
        this.walletService.deleteWallet(id).subscribe({
          next: () => this.notifications.success('Wallet deleted.'),
          error: (error) => {
            console.error('Error deleting wallet:', error);
            // We could use another dialog here instead of alert, but keeping it simple for now
            this.notifications.error(error?.message || 'Could not delete that wallet.');
          }
        });
      }
    });
  }

  refreshWallets() {
    this.walletService.clearError();
    this.walletService.refreshWallets();
  }

  exportWallets() {
    if (this.wallets.length === 0) return;
    
    const exportData = this.excelExportService.formatDataForExport(this.wallets);
    this.excelExportService.exportToExcel(exportData, 'MyWallets', 'Wallets');
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  formatCurrency(amount: number, currencyCode = 'LKR'): string {
    const localeMap: Record<string, string> = {
      'LKR': 'en-LK',
      'USD': 'en-US',
      'EUR': 'de-DE',
      'GBP': 'en-GB',
      'JPY': 'ja-JP',
      'CAD': 'en-CA',
      'AUD': 'en-AU',
      'CHF': 'de-CH',
      'CNY': 'zh-CN',
      'INR': 'en-IN'
    };

    return new Intl.NumberFormat(localeMap[currencyCode] || 'en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Form getters for template
  get nameErrors() {
    const control = this.walletForm.get('name');
    return {
      required: control?.hasError('required') && control?.touched,
      minlength: control?.hasError('minlength') && control?.touched
    };
  }

  get balanceErrors() {
    const control = this.walletForm.get('balance');
    return {
      required: control?.hasError('required') && control?.touched,
      min: control?.hasError('min') && control?.touched
    };
  }

  get typeErrors() {
    const control = this.walletForm.get('type');
    return {
      required: control?.hasError('required') && control?.touched
    };
  }

  get formIsValid(): boolean {
    return this.walletForm.valid;
  }

  get hasWallets(): boolean {
    return this.wallets.length > 0;
  }

  get hasError(): boolean {
    return !!this.error;
  }

  get showEmptyState(): boolean {
    return !this.isLoading && !this.hasError && !this.hasWallets;
  }
}
