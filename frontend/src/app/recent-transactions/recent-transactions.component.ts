import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../dasboard/badge/badge.component';

interface Transaction {
  id: number;
  description: string;
  category: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  paymentMethod: string;
}

@Component({
  selector: 'app-recent-transactions',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  templateUrl: './recent-transactions.component.html'
})
export class RecentTransactionsComponent {
  transactions: Transaction[] = [
    {
      id: 1,
      description: "Monthly Salary",
      category: "Income",
      date: "2024-03-15",
      amount: 350000,
      type: "income",
      paymentMethod: "Bank Transfer"
    },
    {
      id: 2,
      description: "Grocery Shopping",
      category: "Food",
      date: "2024-03-14",
      amount: 15000,
      type: "expense",
      paymentMethod: "Credit Card"
    },
    {
      id: 3,
      description: "Electricity Bill",
      category: "Utilities",
      date: "2024-03-13",
      amount: 8500,
      type: "expense",
      paymentMethod: "Online Payment"
    },
    {
      id: 4,
      description: "Freelance Work",
      category: "Income",
      date: "2024-03-12",
      amount: 45000,
      type: "income",
      paymentMethod: "PayPal"
    },
    {
      id: 5,
      description: "Restaurant Dinner",
      category: "Food",
      date: "2024-03-11",
      amount: 4500,
      type: "expense",
      paymentMethod: "Cash"
    }
  ];

  getBadgeColor(type: string): 'success' | 'error' {
    return type === 'income' ? 'success' : 'error';
  }

  formatCurrency(amount: number): string {
    return `LKR ${amount.toLocaleString()}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
