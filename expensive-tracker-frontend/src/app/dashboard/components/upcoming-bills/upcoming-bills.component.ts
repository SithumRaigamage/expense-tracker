import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { BillsService } from '../../../services/bill.service';
import { Bill } from '../../../core/models/Bill';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';


@Component({
  selector: 'app-upcoming-bills',
  templateUrl: './upcoming-bills.component.html',
  standalone: true,
  imports: [CommonModule, AppCurrencyPipe]
})
export class UpcomingBillsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  upcomingBills: Bill[] = [];

  constructor(private billsService: BillsService) {}

  ngOnInit(): void {
    this.billsService.getBills().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(bills => {
      // Filter to show only upcoming and due today bills
      this.upcomingBills = bills.filter(bill =>
        bill.status === 'Upcoming' || bill.status === 'Due Today'
      );
    });
  }

  getBillIconClass(category: string): string {
    const baseClasses = 'text-white';
    const categoryClasses: Record<string, string> = {
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
    const statusClasses: Record<string, string> = {
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



  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }
}
