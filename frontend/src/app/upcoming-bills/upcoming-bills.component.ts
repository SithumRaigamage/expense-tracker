import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Bill {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDate: Date;
  status: 'Upcoming' | 'Due Today' | 'Overdue';
  iconUrl: string;
  provider: string;
  reminderSet?: boolean;
}

@Component({
  selector: 'app-upcoming-bills',
  templateUrl: './upcoming-bills.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class UpcomingBillsComponent implements OnInit {
  upcomingBills: Bill[] = [
    {
      id: '1',
      name: 'Mobile Data Plan',
      category: 'Subscription',
      amount: 2000.00,
      dueDate: new Date('2024-03-28'),
      status: 'Upcoming',
      iconUrl: 'assets/images/upcoming_bills/mobitel_logo.png',
      provider: 'Mobitel',
      reminderSet: true
    },
    {
      id: '2',
      name: 'Spotify Premium',
      category: 'Subscription',
      amount: 350.00,
      dueDate: new Date('2024-03-25'),
      status: 'Upcoming',
      iconUrl: 'assets/images/upcoming_bills/spotify_logo.png',
      provider: 'Spotify',
      reminderSet: true
    },
    {
      id: '3',
      name: 'Voice Plan',
      category: 'Subscription',
      amount:200.00,
      dueDate: new Date('2024-03-25'),
      status: 'Upcoming',
      iconUrl: 'assets/images/upcoming_bills/dialog_logo.png',
      provider: 'Dialog',
      reminderSet: true
    }
  ];

  ngOnInit(): void {
    // Fetch bills from service
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
