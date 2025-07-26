import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faWallet, faPlus, faPencil, faTrash, faMoneyBillWave, faBuildingColumns, faCreditCard, faPiggyBank, faBitcoinSign, faChartLine, faHandHoldingDollar, faRefresh, faExclamationTriangle, faEdit, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { Wallet } from '../../models/Wallet';
import { WalletService } from '../../services/wallet.service';
import { DialogService } from '../../shared/services/dialog.service';

import { materialImports } from '../../shared/material.module';

@Component({
  selector: 'app-wallets',
  templateUrl: './wallets.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, ...materialImports]
})
export class WalletsComponent implements OnInit, OnDestroy {
  faWallet = faWallet;
  faPlus = faPlus;
  faPencil = faPencil;
  faTrash = faTrash;
  faMoneyBillWave = faMoneyBillWave;
  faBuildingColumns = faBuildingColumns;
  faCreditCard = faCreditCard;
  faPiggyBank = faPiggyBank;
  faBitcoinSign = faBitcoinSign;
  faChartLine = faChartLine;
  faHandHoldingDollar = faHandHoldingDollar;
  faRefresh = faRefresh;
  faExclamationTriangle = faExclamationTriangle;
  faEdit = faEdit;
  faArrowRight = faArrowRight;

  walletForm!: FormGroup;
  isDrawerOpen = false;
  selectedWallet: Wallet | null = null;
  wallets: Wallet[] = [];
  error: string | null = null;
  isLoading = false;
  private subscription: Subscription;

  constructor(
    private fb: FormBuilder,
    private walletService: WalletService,
    private dialogService: DialogService
  ) {
    this.subscription = new Subscription();
    this.initForm();
  }

  ngOnInit() {
    // Subscribe to wallets
    this.subscription.add(
      this.walletService.getAllWallets().subscribe(wallets => {
        this.wallets = wallets;
      })
    );

    // Subscribe to error state
    this.subscription.add(
      this.walletService.error$.subscribe(error => {
        this.error = error;
      })
    );

    // Subscribe to loading state
    this.subscription.add(
      this.walletService.loading$.subscribe(loading => {
        this.isLoading = loading;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private initForm() {
    this.walletForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', [Validators.required]],
      balance: [null, [Validators.required, Validators.min(0)]],
      currency: ['LKR', Validators.required],
      paymentMethod: ['']
    });
  }

  // Method to get wallet icon
  getWalletIcon(type: string) {
    return this.walletService.getWalletTypeIcon(type);
  }

  // Method to get wallet color based on type
  getWalletColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      'cash': 'text-green-600 bg-green-100',
      'bank': 'text-blue-600 bg-blue-100',
      'credit': 'text-purple-600 bg-purple-100',
      'savings': 'text-yellow-600 bg-yellow-100',
      'crypto': 'text-orange-600 bg-orange-100',
      'investment': 'text-indigo-600 bg-indigo-100',
      'loan': 'text-red-600 bg-red-100'
    };
    return colorMap[type] || 'text-gray-600 bg-gray-100';
  }

  openDrawer(wallet?: Wallet) {
    this.isDrawerOpen = true;
    this.selectedWallet = wallet || null;

    if (wallet) {
      this.walletForm.patchValue({
        name: wallet.name,
        type: wallet.type,
        balance: wallet.balance,
        currency: wallet.currency,
        paymentMethod: wallet.paymentMethod || ''
      });
    } else {
      this.walletForm.reset({
        currency: 'LKR'
      });
    }
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    this.selectedWallet = null;
    this.walletForm.reset();
  }

  onSubmit() {
    if (this.walletForm.valid && !this.isLoading) {
      this.isLoading = true;
      const walletData = this.walletForm.value;

      if (this.selectedWallet) {
        this.walletService.updateWallet(this.selectedWallet.id, walletData).subscribe({
          next: () => {
            console.log('Wallet updated successfully');
            this.closeDrawer();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error updating wallet:', error);
            alert(error.message || 'Error updating wallet');
            this.isLoading = false;
          }
        });
      } else {
        this.walletService.addWallet(walletData).subscribe({
          next: () => {
            console.log('Wallet added successfully');
            this.closeDrawer();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error adding wallet:', error);
            alert(error.message || 'Error adding wallet');
            this.isLoading = false;
          }
        });
      }
    }
  }

  deleteWallet(id: string) {
    this.dialogService.confirmDelete('wallet').subscribe(result => {
      if (result) {
        this.walletService.deleteWallet(id).subscribe({
          next: () => {
            console.log('Wallet deleted successfully');
          },
          error: (error) => {
            console.error('Error deleting wallet:', error);
            // We could use another dialog here instead of alert, but keeping it simple for now
            alert(error.message || 'Error deleting wallet');
          }
        });
      }
    });
  }

  refreshWallets() {
    this.walletService.clearError();
    this.walletService.refreshWallets();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Form getters for template
  get nameErrors() {
    const control = this.walletForm.get('name');
    return {
      required: control?.hasError('required') && control?.touched,
      minlength: control?.hasError('minlength') && control?.touched
    };
  }

  get balanceErrors() {
    const control = this.walletForm.get('balance');
    return {
      required: control?.hasError('required') && control?.touched,
      min: control?.hasError('min') && control?.touched
    };
  }

  get typeErrors() {
    const control = this.walletForm.get('type');
    return {
      required: control?.hasError('required') && control?.touched
    };
  }

  get formIsValid(): boolean {
    return this.walletForm.valid;
  }

  get hasWallets(): boolean {
    return this.wallets.length > 0;
  }

  get hasError(): boolean {
    return !!this.error;
  }

  get showEmptyState(): boolean {
    return !this.isLoading && !this.hasError && !this.hasWallets;
  }
}
