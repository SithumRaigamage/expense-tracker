import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faExchangeAlt, faWallet, faMoneyBillWave, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Wallet } from '../../../../core/models/Wallet';
import { WalletService } from '../../../../services/wallet.service';
import { materialImports } from '../../../../shared/material.module';

@Component({
  selector: 'app-transfer-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FontAwesomeModule, 
    MatDialogModule,
    ...materialImports
  ],
  templateUrl: './transfer-dialog.component.html',
})
export class TransferDialogComponent implements OnInit {
  faExchangeAlt = faExchangeAlt;
  faWallet = faWallet;
  faMoneyBillWave = faMoneyBillWave;
  faArrowRight = faArrowRight;

  transferForm: FormGroup;
  wallets: Wallet[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private walletService: WalletService,
    public dialogRef: MatDialogRef<TransferDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { fromWallet?: Wallet }
  ) {
    this.transferForm = this.fb.group({
      fromWalletId: [data.fromWallet?.id || '', Validators.required],
      toWalletId: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      description: ['']
    });
  }

  ngOnInit() {
    this.walletService.getAllWallets().subscribe(wallets => {
      this.wallets = wallets;
    });
  }

  onSubmit() {
    if (this.transferForm.valid && !this.isLoading) {
      const { fromWalletId, toWalletId, amount, description } = this.transferForm.value;
      
      if (fromWalletId === toWalletId) {
        this.error = 'Source and destination wallets must be different';
        return;
      }

      this.isLoading = true;
      this.error = null;

      this.walletService.transferFunds(fromWalletId, toWalletId, amount, description).subscribe({
        next: () => {
          this.isLoading = false;
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isLoading = false;
          this.error = err.message || 'An error occurred during transfer';
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  getWalletIcon(type: string) {
    return this.walletService.getWalletTypeIcon(type);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  }
}
