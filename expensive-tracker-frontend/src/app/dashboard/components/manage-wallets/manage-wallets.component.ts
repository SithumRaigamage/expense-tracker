import { Wallet } from '../../../core/models/Wallet';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { WalletService } from '../../../services/wallet.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-manage-wallets',
  imports: [CommonModule,RouterModule],
  templateUrl: './manage-wallets.component.html',
})
export class ManageWalletsComponent implements OnInit {
  wallets: Wallet[] = [];

  constructor(private wallet : WalletService) {}

  ngOnInit(): void {
    this.wallet.getAllWallets().subscribe(wallets => {
      this.wallets = wallets;
    });

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
      currency: 'LKR'
    }).format(amount);
  }
}
