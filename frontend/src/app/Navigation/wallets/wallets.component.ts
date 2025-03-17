import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faWallet, faPlus, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Wallet } from '../../models/Wallet';

@Component({
  selector: 'app-wallets',
  templateUrl: './wallets.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule]
})
export class WalletsComponent implements OnInit {
  faWallet = faWallet;
  faPlus = faPlus;
  faPencil = faPencil;
  faTrash = faTrash;

  walletForm!: FormGroup;
  isDrawerOpen = false;
  selectedWallet: Wallet | null = null;

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
    }
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initForm();
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
        // Update existing wallet
        const index = this.wallets.findIndex(w => w.id === this.selectedWallet!.id);
        if (index !== -1) {
          this.wallets[index] = { ...this.selectedWallet, ...walletData };
        }
      } else {
        // Add new wallet
        const newWallet: Wallet = {
          ...walletData,
          id: Date.now().toString() // Simple ID generation
        };
        this.wallets.push(newWallet);
      }

      this.closeDrawer();
    }
  }

  deleteWallet(id: string) {
    if (confirm('Are you sure you want to delete this wallet?')) {
      this.wallets = this.wallets.filter(wallet => wallet.id !== id);
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
}
