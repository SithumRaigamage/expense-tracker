import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faWallet, faPlus, faPencil, faTrash, faMoneyBillWave, faBuildingColumns, faCreditCard, faPiggyBank } from '@fortawesome/free-solid-svg-icons';
import { Wallet } from '../../models/Wallet';
import { WalletService } from '../../services/wallet.service';
import { Subscription } from 'rxjs';

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
    private walletService: WalletService
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
      type: ['cash', Validators.required],
      balance: [0, [Validators.required, Validators.min(0)]],
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
        type: 'cash',
        currency: 'LKR',
        balance: 0
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
      } else {
        this.walletService.addWallet(walletData);
      }

      this.closeDrawer();
    }
  }

  deleteWallet(id: string) {
    if (confirm('Are you sure you want to delete this wallet?')) {
      this.walletService.deleteWallet(id);
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
