import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillsService } from '../../services/bill.service';
import { Bill } from '../../models/Bill';


@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bills.component.html',
  styleUrl: './bills.component.css'
})
export class BillsComponent implements OnInit {
  bills: Bill[] = [];
  isDrawerOpen = false;
  drawerMode: 'add' | 'edit' = 'add';
  currentBill: Partial<Bill> = this.getEmptyBill();
  categories = ['Utilities', 'Subscription', 'Entertainment', 'Internet', 'Insurance'];

  constructor(private billsService: BillsService) {}

  ngOnInit(): void {
    this.loadBills();
  }

  private loadBills(): void {
    this.billsService.getBills().subscribe(bills => {
      this.bills = bills;
    });
  }

  private getEmptyBill(): Partial<Bill> {
    return {
      name: '',
      category: '',
      amount: 0,
      dueDate: new Date(),
      provider: '',
      iconUrl: ''
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }
}
