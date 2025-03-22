import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faWallet, faPlus, faPencil, faTrash, faMoneyBillWave, faBuildingColumns, faCreditCard, faPiggyBank } from '@fortawesome/free-solid-svg-icons';
import { Wallet } from '../../models/Wallet';
import { WalletService } from '../../services/wallet.service';
import { Subscription } from 'rxjs';
import { ToastmsgService } from '../../services/toastmsg.service';

@Component({
  selector: 'app-wallets',
  templateUrl: './wallets.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule]
})
export class WalletsComponent implements OnInit, OnDestroy {
  faWallet = faWallet;
  faPlus = faPlus;
  faPencil = faPencil;
  faTrash = faTrash;
  faMoneyBillWave = faMoneyBillWave;  // cash
  faBuildingColumns = faBuildingColumns;  // bank
  faCreditCard = faCreditCard;  // credit
  faPiggyBank = faPiggyBank;  // savings

  walletForm!: FormGroup;
  isDrawerOpen = false;
  selectedWallet: Wallet | null = null;
  wallets: Wallet[] = [];
  private subscription: Subscription;

  constructor(
    private fb: FormBuilder,
    private walletService: WalletService,
    private toastService: ToastmsgService
  ) {
    this.subscription = new Subscription();
  }

  ngOnInit() {
    this.initForm();
    // Subscribe to wallet updates
    this.subscription.add(
      this.walletService.getAllWallets().subscribe(
        wallets => this.wallets = wallets
      )
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private initForm() {
    this.walletForm = this.fb.group({
      id: [''],
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', [Validators.required]], // Remove default value to force selection
      balance: [null, [Validators.required, Validators.min(0)]], // Change 0 to null
      currency: ['LKR', Validators.required],
      paymentMethod: ['']
    });
  }

  openDrawer(wallet?: Wallet) {
    this.isDrawerOpen = true;
    this.selectedWallet = wallet || null;

    if (wallet) {
      this.walletForm.patchValue(wallet);
    } else {
      this.walletForm.reset({
        currency: 'LKR' // Only set default for currency
      });
    }
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    this.selectedWallet = null;
    this.walletForm.reset();
  }

  onSubmit() {
    if (this.walletForm.valid) {
      const walletData = this.walletForm.value;

      if (this.selectedWallet) {
        this.walletService.updateWallet(this.selectedWallet.id, walletData);
        this.toastService.show('Wallet updated successfully', 'success');
      } else {
        this.walletService.addWallet(walletData);
        this.toastService.show('Wallet added successfully', 'success');
      }

      this.closeDrawer();
    }
  }

  deleteWallet(id: string) {
    if (confirm('Are you sure you want to delete this wallet?')) {
      this.walletService.deleteWallet(id);
      this.toastService.show('Wallet deleted successfully', 'success'); // Changed from 'info' to 'warning'
    }
  }

  // Form getters for template
  get nameErrors() {
    const control = this.walletForm.get('name');
    return {
      required: control?.errors?.['required'] && control.touched,
      minlength: control?.errors?.['minLength'] && control.touched
    };
  }

  get balanceErrors() {
    const control = this.walletForm.get('balance');
    return {
      required: control?.errors?.['required'] && control.touched,
      min: control?.errors?.['min'] && control.touched
    };
  }

  get typeErrors() {
    const control = this.walletForm.get('type');
    return {
      required: control?.errors?.['required'] && control.touched
    };
  }

  get formIsValid(): boolean {
    return this.walletForm.valid &&
           this.walletForm.get('type')?.value !== '' &&
           this.walletForm.get('balance')?.value !== null;
  }

  getWalletIcon(type: 'cash' | 'bank' | 'credit' | 'savings') {
    switch (type) {
      case 'cash':
        return this.faMoneyBillWave;
      case 'bank':
        return this.faBuildingColumns;
      case 'credit':
        return this.faCreditCard;
      case 'savings':
        return this.faPiggyBank;
      default:
        return this.faWallet;
    }
  }

  getWalletColor(type: 'cash' | 'bank' | 'credit' | 'savings') {
    switch (type) {
      case 'cash':
        return 'text-green-500';
      case 'bank':
        return 'text-blue-500';
      case 'credit':
        return 'text-purple-500';
      case 'savings':
        return 'text-amber-500';
      default:
        return 'text-gray-500';
    }
  }
}
