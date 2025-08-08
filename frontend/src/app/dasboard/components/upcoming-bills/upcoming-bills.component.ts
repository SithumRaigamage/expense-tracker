import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillsService } from '../../../services/bill.service';
import { Bill } from '../../../core/models/Bill';


@Component({
  selector: 'app-upcoming-bills',
  templateUrl: './upcoming-bills.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class UpcomingBillsComponent implements OnInit {
  upcomingBills: Bill[] = [];

  constructor(private billsService: BillsService) {}

  ngOnInit(): void {
    this.billsService.getBills().subscribe(bills => {
      // Filter to show only upcoming and due today bills
      this.upcomingBills = bills.filter(bill =>
        bill.status === 'Upcoming' || bill.status === 'Due Today'
      );
    });
  }

  getBillIconClass(category: string): string {
    const baseClasses = 'text-white';
    const categoryClasses: { [key: string]: string } = {
      'Utilities': 'bg-blue-500',
      'Subscription': 'bg-yellow-500',
      'Entertainment': 'bg-pink-500',
      'Internet': 'bg-indigo-500',
      'Insurance': 'bg-green-500',
      'default': 'bg-gray-500'
    };

    return `${baseClasses} ${categoryClasses[category] || categoryClasses['default']}`;
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'Upcoming': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500',
      'Due Today': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500',
      'Overdue': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500'
    };

    return statusClasses[status] || '';
  }

  getDaysUntilDue(dueDate: Date): number {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  toggleReminder(billId: string): void {
    const bill = this.upcomingBills.find(b => b.id === billId);
    if (bill) {
      bill.reminderSet = !bill.reminderSet;
      // TODO: Integrate with notification service
    }
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
