import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Bill {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDate: Date;
  status: 'Pending' | 'Paid' | 'Overdue';
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
      name: 'Electricity Bill',
      category: 'Utilities',
      amount: 150.00,
      dueDate: new Date('2024-03-25'),
      status: 'Pending'
    },
    {
      id: '2',
      name: 'Internet Service',
      category: 'Utilities',
      amount: 89.99,
      dueDate: new Date('2024-03-28'),
      status: 'Paid'
    }
  ];

  ngOnInit(): void {
    // Fetch bills from service
  }

  getBillIconClass(category: string): string {
    const baseClasses = 'text-white';
    const categoryClasses: { [key: string]: string } = {
      'Utilities': 'bg-blue-500',
      'Rent': 'bg-purple-500',
      'Insurance': 'bg-green-500',
      'Subscription': 'bg-yellow-500',
      'default': 'bg-gray-500'
    };

    return `${baseClasses} ${categoryClasses[category] || categoryClasses['default']}`;
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500',
      'Paid': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500',
      'Overdue': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500'
    };

    return statusClasses[status] || '';
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
