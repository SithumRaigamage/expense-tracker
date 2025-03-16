import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

interface Wallet {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  paymentMethod?: string;
}

@Component({
  selector: 'app-manage-wallets',
  imports: [CommonModule],
  templateUrl: './manage-wallets.component.html',
  styleUrl: './manage-wallets.component.css'
})
export class ManageWalletsComponent implements OnInit {
  wallets: Wallet[] = [
    {
      id: '1',
      name: 'Main Wallet',
      type: 'cash',
      balance: 1500.00,
      currency: 'LKR'
    },
    {
      id: '2',
      name: 'Bank Account',
      type: 'bank',
      balance: 10000.00,
      currency: 'LKR',
      paymentMethod: 'Visa'
    },
    {
      id: '3',
      name: 'Credit Card',
      type: 'credit',
      balance: 500.00,
      currency: 'LKR',
      paymentMethod: 'MasterCard'
    },
    {
      id: '4',
      name: 'Savings Account',
      type: 'savings',
      balance: 20000.00,
      currency: 'LKR'
    }
  ]; // Add some test data

  ngOnInit(): void {
    // Fetch wallets from your service
    console.log('ManageWalletsComponent initialized');
    console.log('Wallets:', this.wallets);
  }

  getWalletIconClass(type: string): string {
    const baseClasses = 'text-white';
    const typeClasses: { [key: string]: string } = {
      'cash': 'bg-green-500',
      'bank': 'bg-blue-500',
      'credit': 'bg-purple-500',
      'savings': 'bg-yellow-500',
      'default': 'bg-gray-500'
    };

    return `${baseClasses} ${typeClasses[type] || typeClasses['default']}`;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}
