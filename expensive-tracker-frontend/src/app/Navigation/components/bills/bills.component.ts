import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormsModule } from '@angular/forms';
import { BillsService } from '../../../services/bill.service';
import { WalletService } from '../../../services/wallet.service';
import { Bill, BillTransaction } from '../../../core/models/Bill';
import { Wallet } from '../../../core/models/Wallet';
import { CurrencyService } from '../../../core/services/currency.service';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { ExcelExportService } from '../../../services/excel-export.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDownload, faEdit, faPlus } from '@fortawesome/free-solid-svg-icons';
import { SideDrawerComponent } from '../../../shared/components/side-drawer/side-drawer.component';
import { NotificationService } from '../../../shared/services/notification.service';
import { DialogService } from '../../../shared/services/dialog.service';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [FormsModule, AppCurrencyPipe, FontAwesomeModule, SideDrawerComponent],
  templateUrl: './bills.component.html',
})
export class BillsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  bills: Bill[] = [];
  transactions: BillTransaction[] = [];
  availableWallets: Wallet[] = [];
  isDrawerOpen = false;
  drawerMode: 'add' | 'edit' = 'add';
  currentBill: Partial<Bill> = this.getEmptyBill();
  categories = ['Utilities', 'Subscription', 'Entertainment', 'Internet', 'Insurance'];
  faDownload = faDownload;
  faEdit = faEdit;
  faPlus = faPlus;

  constructor(
    private billsService: BillsService,
    private walletService: WalletService,
    public currencyService: CurrencyService,
    private excelExportService: ExcelExportService,
    private readonly notifications: NotificationService,
    private readonly dialogs: DialogService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.billsService.getBills().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(bills => {
      this.bills = bills;
    });

    this.billsService.getTransactions().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(transactions => {
      this.transactions = transactions;
    });

    this.walletService.getAllWallets().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(wallets => {
      this.availableWallets = wallets.filter(w =>
        (w.type === 'cash' || w.type === 'bank') && w.balance > 0
      );
    });
  }

  private getEmptyBill(): Partial<Bill> {
    return {
      name: '',
      category: '',
      amount: 0,
      dueDate: new Date(),
      provider: '',
      iconUrl: '',
      isSubscription: false,
      selectedWalletId: ''
    };
  }

  openDrawer(mode: 'add' | 'edit', bill?: Bill): void {
    this.drawerMode = mode;
    this.isDrawerOpen = true;
    this.currentBill = mode === 'add' ? this.getEmptyBill() : { ...bill };
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.currentBill = this.getEmptyBill();
  }

  submitForm(): void {
    if (this.validateBill()) {
      if (this.drawerMode === 'add') {
        this.billsService.addBill(this.currentBill as Omit<Bill, 'id' | 'status'>);
      } else {
        this.billsService.updateBill(
          this.currentBill.id!,
          this.currentBill as Partial<Bill>
        );
      }
      this.closeDrawer();
    }
  }

  deleteBill(id: string): void {
    this.dialogs.confirmDelete('bill').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (confirmed) {
        this.billsService.deleteBill(id);
        this.notifications.success('Bill deleted.');
      }
    });
  }

  private validateBill(): boolean {
    return !!(
      this.currentBill.name &&
      this.currentBill.category &&
      this.currentBill.amount &&
      this.currentBill.dueDate &&
      this.currentBill.provider
    );
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  exportBills(): void {
    if (this.bills.length === 0) return;
    
    const exportData = this.excelExportService.formatDataForExport(this.bills);
    this.excelExportService.exportToExcel(exportData, 'MyBills', 'Bills');
  }
}
