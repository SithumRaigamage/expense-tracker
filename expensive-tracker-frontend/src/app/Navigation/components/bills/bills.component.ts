import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillsService } from '../../../services/bill.service';
import { WalletService } from '../../../services/wallet.service';
import { Bill, BillTransaction } from '../../../core/models/Bill';
import { Wallet } from '../../../core/models/Wallet';
import { CurrencyService } from '../../../core/services/currency.service';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, AppCurrencyPipe],
  templateUrl: './bills.component.html',
})
export class BillsComponent implements OnInit {
  bills: Bill[] = [];
  transactions: BillTransaction[] = [];
  availableWallets: Wallet[] = [];
  isDrawerOpen = false;
  drawerMode: 'add' | 'edit' = 'add';
  currentBill: Partial<Bill> = this.getEmptyBill();
  categories = ['Utilities', 'Subscription', 'Entertainment', 'Internet', 'Insurance'];

  constructor(
    private billsService: BillsService,
    private walletService: WalletService,
    public currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.billsService.getBills().subscribe(bills => {
      this.bills = bills;
    });

    this.billsService.getTransactions().subscribe(transactions => {
      this.transactions = transactions;
    });

    this.walletService.getAllWallets().subscribe(wallets => {
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
    if (confirm('Are you sure you want to delete this bill?')) {
      this.billsService.deleteBill(id);
    }
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
}
