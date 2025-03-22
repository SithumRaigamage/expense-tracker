import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Transaction } from '../../models/Transaction';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.css'
})
export class TransactionsComponent implements OnInit {
  faPlus = faPlus;
  faPencil = faPencil;
  faTrash = faTrash;

  transactions: Transaction[] = [];
  isDrawerOpen = false;
  selectedTransaction: Transaction | null = null;
  transactionForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService
  ) {
    this.transactionForm = this.createForm();
  }

  ngOnInit() {
    this.transactionService.getTransactions().subscribe(transactions => {
      this.transactions = transactions;
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      date: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      category: ['', Validators.required],
      type: ['expense', Validators.required]
    });
  }

  openDrawer(transaction?: Transaction) {
    this.selectedTransaction = transaction || null;
    if (transaction) {
      this.transactionForm.patchValue({
        date: this.formatDateForInput(transaction.date),
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        type: transaction.type
      });
    } else {
      this.transactionForm.reset({ type: 'expense' });
    }
    this.isDrawerOpen = true;
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    this.selectedTransaction = null;
    this.transactionForm.reset({ type: 'expense' });
  }

  onSubmit() {
    if (this.transactionForm.valid) {
      const formValue = {
        ...this.transactionForm.value,
        date: new Date(this.transactionForm.value.date)
      };

      if (this.selectedTransaction) {
        this.transactionService.updateTransaction({
          ...this.selectedTransaction,
          ...formValue
        });
      } else {
        this.transactionService.addTransaction(formValue);
      }
      this.closeDrawer();
    }
  }

  deleteTransaction(id: number) {
    this.transactionService.deleteTransaction(id);
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
