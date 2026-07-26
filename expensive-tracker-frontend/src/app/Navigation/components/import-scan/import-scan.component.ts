import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faReceipt, faFileCsv, faCommentSms, faFileImport, faCamera,
  faSpinner, faCheck, faTriangleExclamation, faCircleQuestion, faPlus
} from '@fortawesome/free-solid-svg-icons';
import {
  ImportService, ReceiptScanResult, ImportSummary, ImportOptions
} from '../../../services/import.service';
import { TransactionService } from '../../../services/transaction.service';
import { WalletService } from '../../../services/wallet.service';
import { Wallet } from '../../../core/models/Wallet';

interface Category { _id: string; name: string; type: 'income' | 'expense'; }

type MainTab = 'receipt' | 'import';
type ImportMode = 'file' | 'text' | 'sms';

@Component({
  selector: 'app-import-scan',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './import-scan.component.html'
})
export class ImportScanComponent implements OnInit {
  // Icons
  faReceipt = faReceipt; faFileCsv = faFileCsv; faCommentSms = faCommentSms;
  faFileImport = faFileImport; faCamera = faCamera; faSpinner = faSpinner;
  faCheck = faCheck; faTriangleExclamation = faTriangleExclamation;
  faCircleQuestion = faCircleQuestion; faPlus = faPlus;

  activeTab: MainTab = 'receipt';
  importMode: ImportMode = 'file';

  wallets: Wallet[] = [];
  categories: Category[] = [];

  // Shared import options
  selectedWalletId = '';
  defaultCategoryId = '';

  // ---- Receipt state ----
  receiptFile: File | null = null;
  receiptPreviewUrl: string | null = null;
  scanning = false;
  scanResult: ReceiptScanResult | null = null;
  receiptError = '';
  creatingExpense = false;
  expenseCreated = false;

  // ---- Import state ----
  csvFile: File | null = null;
  csvText = '';
  smsText = '';
  importing = false;
  importError = '';
  summary: ImportSummary | null = null;
  lastRunWasPreview = false;

  constructor(
    private importService: ImportService,
    private transactionService: TransactionService,
    private walletService: WalletService
  ) {}

  ngOnInit(): void {
    this.walletService.wallets$.subscribe((wallets) => {
      this.wallets = wallets.filter((w) => w.isActive !== false);
      if (!this.selectedWalletId && this.wallets.length) {
        this.selectedWalletId = this.wallets[0].id;
      }
    });
    this.transactionService.getCategories().subscribe((cats) => {
      this.categories = cats as Category[];
    });
  }

  setTab(tab: MainTab): void {
    this.activeTab = tab;
  }

  // ================= Receipt =================
  onReceiptSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.receiptFile = file;
    this.scanResult = null;
    this.receiptError = '';
    this.expenseCreated = false;
    if (this.receiptPreviewUrl) URL.revokeObjectURL(this.receiptPreviewUrl);
    this.receiptPreviewUrl = file ? URL.createObjectURL(file) : null;
  }

  scanReceipt(): void {
    if (!this.receiptFile || this.scanning) return;
    this.scanning = true;
    this.receiptError = '';
    this.scanResult = null;
    this.importService.scanReceipt(this.receiptFile).subscribe({
      next: (result) => { this.scanResult = result; this.scanning = false; },
      error: (err) => { this.receiptError = err.message; this.scanning = false; }
    });
  }

  /** Create an expense from the (possibly user-edited) receipt suggestion. */
  createFromReceipt(): void {
    if (!this.scanResult || this.creatingExpense) return;
    const s = this.scanResult.suggestion;

    if (!s.amount || s.amount <= 0) { this.receiptError = 'Enter a valid amount before saving.'; return; }
    if (!s.category) { this.receiptError = 'Pick a category before saving.'; return; }
    if (!this.selectedWalletId) { this.receiptError = 'Pick a wallet before saving.'; return; }

    const category = this.categories.find((c) => c._id === s.category);
    this.creatingExpense = true;
    this.receiptError = '';

    this.transactionService.addTransaction({
      amount: s.amount,
      description: s.title || s.merchant || 'Receipt expense',
      category: s.category,
      type: category?.type ?? 'expense',
      date: s.date ? new Date(s.date) : new Date(),
      walletId: this.selectedWalletId
    } as any).subscribe({
      next: () => { this.creatingExpense = false; this.expenseCreated = true; },
      error: (err) => { this.creatingExpense = false; this.receiptError = err.message; }
    });
  }

  // ================= Import =================
  setImportMode(mode: ImportMode): void {
    this.importMode = mode;
    this.summary = null;
    this.importError = '';
  }

  onCsvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.csvFile = input.files?.[0] ?? null;
    this.summary = null;
  }

  private buildOptions(dryRun: boolean): ImportOptions {
    return {
      walletId: this.selectedWalletId || undefined,
      defaultCategoryId: this.defaultCategoryId || undefined,
      dryRun
    };
  }

  /** Preview (dry run) or commit the import depending on `dryRun`. */
  runImport(dryRun: boolean): void {
    if (this.importing) return;
    this.importError = '';
    this.summary = null;

    if (!this.selectedWalletId) { this.importError = 'Select a wallet to import into.'; return; }

    const options = this.buildOptions(dryRun);
    let request$;

    if (this.importMode === 'file') {
      if (!this.csvFile) { this.importError = 'Choose a .csv file first.'; return; }
      request$ = this.importService.importBankFile(this.csvFile, options);
    } else if (this.importMode === 'text') {
      if (!this.csvText.trim()) { this.importError = 'Paste some CSV text first.'; return; }
      request$ = this.importService.importBankText(this.csvText, options);
    } else {
      const messages = this.smsText.split(/\r?\n/).map((m) => m.trim()).filter(Boolean);
      if (!messages.length) { this.importError = 'Paste at least one SMS message.'; return; }
      request$ = this.importService.importSms(messages, options);
    }

    this.importing = true;
    this.lastRunWasPreview = dryRun;
    request$.subscribe({
      next: (summary) => {
        this.summary = summary;
        this.importing = false;
        if (!dryRun && summary.created > 0) this.transactionService.refreshTransactions();
      },
      error: (err) => { this.importError = err.message; this.importing = false; }
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'created': return 'text-green-600 bg-green-50';
      case 'preview': return 'text-indigo-600 bg-indigo-50';
      case 'duplicate': return 'text-amber-600 bg-amber-50';
      case 'unmatched': return 'text-gray-500 bg-gray-100';
      default: return 'text-red-600 bg-red-50';
    }
  }
}
