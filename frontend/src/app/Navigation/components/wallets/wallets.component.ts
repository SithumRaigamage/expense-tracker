import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faWallet, faPlus, faPencil, faTrash, faMoneyBillWave, faBuildingColumns,
  faCreditCard, faPiggyBank, faBitcoinSign, faChartLine, faHandHoldingDollar,
  faRefresh, faExclamationTriangle, faEdit, faArrowRight, faUpload,
  faFileUpload, faFileImport
} from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { Wallet } from '../../../core/models/Wallet';
import { WalletService } from '../../../services/wallet.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { Router } from '@angular/router';
import { ToastmsgService } from '../../../services/toastmsg.service';

import { materialImports } from '../../../shared/material.module';

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
  faUpload = faUpload;
  faFileUpload = faFileUpload;
  faFileImport = faFileImport;

  walletForm!: FormGroup;
  isDrawerOpen = false;
  selectedWallet: Wallet | null = null;
  wallets: Wallet[] = [];
  error: string | null = null;
  isLoading = false;
  isAuthError = false;
  activeTab: 'manual' | 'upload' = 'manual';

  // File upload related properties
  selectedFile: File | null = null;
  jsonPreview: Wallet[] | null = null;
  jsonError: string | null = null;

  private subscription: Subscription;

  constructor(
    private fb: FormBuilder,
    private walletService: WalletService,
    private dialogService: DialogService,
    private router: Router,
    private toastService: ToastmsgService
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
        // Check if it's an authentication error
        this.isAuthError = error?.includes('Not authenticated') || error?.includes('authorized') || false;
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
    this.activeTab = 'manual';  // Always default to manual when editing

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
    this.resetFileUpload();
  }

  switchTab(tab: 'manual' | 'upload') {
    if (this.activeTab !== tab) {
      this.activeTab = tab;

      // Reset form data when switching tabs
      if (tab === 'manual') {
        this.resetFileUpload();
      } else {
        this.walletForm.reset({
          currency: 'LKR'
        });
      }
    }
  }

  onSubmit() {
    if (this.walletForm.valid && !this.isLoading) {
      this.isLoading = true;
      const walletData = this.walletForm.value;

      if (this.selectedWallet) {
        this.walletService.updateWallet(this.selectedWallet.id, walletData).subscribe({
          next: () => {
            console.log('Wallet updated successfully');
            this.toastService.show('Wallet updated successfully', 'warning');
            this.closeDrawer();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error updating wallet:', error);
            this.toastService.show(error.message || 'Error updating wallet', 'error');
            this.isLoading = false;
          }
        });
      } else {
        this.walletService.addWallet(walletData).subscribe({
          next: () => {
            console.log('Wallet added successfully');
            this.toastService.show('Wallet added successfully', 'success');
            this.closeDrawer();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error adding wallet:', error);
            this.toastService.show(error.message || 'Error adding wallet', 'error');
            this.isLoading = false;
          }
        });
      }
    }
  }

  // File upload methods
  onFileSelected(event: Event) {
    const element = event.target as HTMLInputElement;
    const file = element.files?.[0];

    if (!file) {
      return;
    }

    this.selectedFile = file;
    this.jsonError = null;
    this.jsonPreview = null;

    if (!file.name.endsWith('.json')) {
      this.jsonError = 'Please select a valid JSON file';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const json = JSON.parse(e.target.result);
        this.processJsonData(json);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        this.jsonError = 'Invalid JSON format. Please check the file structure.';
      }
    };

    reader.onerror = () => {
      this.jsonError = 'Error reading file. Please try again.';
    };

    reader.readAsText(file);
  }

  processJsonData(data: any) {
    // Validate the JSON structure
    if (!Array.isArray(data)) {
      this.jsonError = 'Invalid JSON format. Expected an array of wallets.';
      return;
    }

    const validWallets: Wallet[] = [];
    const errors: string[] = [];

    data.forEach((item: any, index: number) => {
      if (!item.name) {
        errors.push(`Wallet at index ${index} is missing a name`);
      }

      if (!item.type || !['cash', 'bank', 'credit', 'savings', 'crypto', 'investment', 'loan'].includes(item.type)) {
        errors.push(`Wallet "${item.name || index}" has an invalid type`);
      }

      if (item.balance === undefined || isNaN(Number(item.balance))) {
        errors.push(`Wallet "${item.name || index}" has an invalid balance`);
      }

      if (!errors.length) {
        validWallets.push({
          id: '', // Will be assigned by server
          name: item.name,
          type: item.type,
          balance: Number(item.balance),
          currency: item.currency || 'LKR',
          paymentMethod: item.paymentMethod || '',
          user: '' // Will be assigned by server
        });
      }
    });

    if (errors.length) {
      this.jsonError = `Found ${errors.length} issues in your data:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n...and ${errors.length - 3} more issues` : ''}`;
      return;
    }

    if (validWallets.length === 0) {
      this.jsonError = 'No valid wallets found in the file.';
      return;
    }

    this.jsonPreview = validWallets;
  }

  importWallets() {
    if (!this.jsonPreview || this.isLoading) {
      return;
    }

    this.isLoading = true;

    // Use the updated bulkAddWallets method that now handles sequential processing
    this.walletService.bulkAddWallets(this.jsonPreview).subscribe({
      next: (result) => {
        console.log(`Successfully imported ${result.successCount} wallets`);
        if (result.failedCount > 0 && result.failedWallets) {
          // Create a more detailed message about the failures
          const failureDetails = result.failedWallets
            .map(w => `• ${w.name}: ${w.error}`)
            .join('\n');

          // Show success and warning
          this.toastService.show(`Successfully imported ${result.successCount} wallets`, 'success');
          this.toastService.show(`${result.failedCount} wallet(s) failed to import`, 'warning');
        } else if (result.failedCount > 0) {
          this.toastService.show(`${result.successCount} wallets imported successfully. ${result.failedCount} wallets failed.`, 'warning');
        } else {
          this.toastService.show(`${result.successCount} wallets imported successfully!`, 'success');
        }
        this.closeDrawer();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error importing wallets:', error);
        this.toastService.show(error.message || 'Error importing wallets', 'error');
        this.isLoading = false;
      }
    });
  }

  resetFileUpload() {
    this.selectedFile = null;
    this.jsonPreview = null;
    this.jsonError = null;
  }

  deleteWallet(id: string) {
    this.dialogService.confirmDelete('wallet').subscribe(result => {
      if (result) {
        this.walletService.deleteWallet(id).subscribe({
          next: () => {
            console.log('Wallet deleted successfully');
            this.toastService.show('Wallet deleted successfully', 'error');
          },
          error: (error) => {
            console.error('Error deleting wallet:', error);
            this.toastService.show(error.message || 'Error deleting wallet', 'error');
          }
        });
      }
    });
  }

  refreshWallets() {
    this.walletService.clearError();
    this.walletService.refreshWallets();
  }

  goToLogin() {
    this.router.navigate(['/login']);
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
