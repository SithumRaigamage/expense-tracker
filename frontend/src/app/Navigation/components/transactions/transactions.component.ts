import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TransactionService } from '../../../services/transaction.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Transaction } from '../../../core/models/Transaction';

interface Category {
  _id: string;
  name: string;
  type: 'income' | 'expense';
}

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
  categories: Category[] = [];
  isDrawerOpen = false;
  selectedTransaction: Transaction | null = null;
  transactionForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService
  ) {
    this.transactionForm = this.createForm();
  }

  ngOnInit() {
    this.loadTransactions();
    this.loadCategories();

    // Also load categories after a short delay to ensure auth is ready
    setTimeout(() => {
      this.loadCategories();
    }, 1000);

    // Reset category when type changes
    this.transactionForm.get('type')?.valueChanges.subscribe(() => {
      this.transactionForm.get('category')?.setValue('');
    });
  }

  private loadTransactions() {
    this.transactionService.getTransactions().subscribe({
      next: (transactions) => {
        this.transactions = transactions;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.errorMessage = 'Failed to load transactions';
      }
    });
  }

  private loadCategories() {
    this.transactionService.getCategories().subscribe({
      next: (categories) => {
        console.log('Categories received in component:', categories);
        console.log('Sample category structure:', categories[0]);
        this.categories = categories;
        // If no categories loaded, try to refresh
        if (categories.length === 0) {
          console.log('No categories found, refreshing...');
          this.transactionService.refreshCategories();
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        // Try to refresh categories on error
        this.transactionService.refreshCategories();
      }
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
      this.isLoading = true;
      this.errorMessage = '';

      const formValue = {
        ...this.transactionForm.value,
        date: new Date(this.transactionForm.value.date)
      };

      const operation = this.selectedTransaction
        ? this.transactionService.updateTransaction({
            ...this.selectedTransaction,
            ...formValue
          })
        : this.transactionService.addTransaction(formValue);

      operation.subscribe({
        next: (transaction) => {
          console.log('Transaction saved:', transaction);
          this.closeDrawer();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error saving transaction:', error);
          this.errorMessage = error.message || 'Failed to save transaction';
          this.isLoading = false;
        }
      });
    }
  }

  deleteTransaction(id: string | number) {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.transactionService.deleteTransaction(id).subscribe({
        next: () => {
          console.log('Transaction deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting transaction:', error);
          this.errorMessage = error.message || 'Failed to delete transaction';
        }
      });
    }
  }

  getCategoriesByType(type: 'income' | 'expense'): Category[] {
    console.log('Getting categories by type:', type, 'Available categories:', this.categories);
    return this.categories.filter(cat => cat.type === type);
  }

  // Getter for current transaction type
  get currentTransactionType(): 'income' | 'expense' {
    return this.transactionForm.get('type')?.value || 'expense';
  }

  // Getter for filtered categories
  get filteredCategories(): Category[] {
    const type = this.currentTransactionType;

    // Helper function to determine category type if missing
    const getCategoryType = (category: Category): 'income' | 'expense' => {
      if (category.type) {
        return category.type;
      }

      // Fallback: determine type based on category name
      const incomeKeywords = ['salary', 'income', 'freelance', 'investment', 'bonus'];
      const categoryName = category.name.toLowerCase();

      return incomeKeywords.some(keyword => categoryName.includes(keyword)) ? 'income' : 'expense';
    };

    const filtered = this.categories.filter(cat => getCategoryType(cat) === type);
    console.log(`Filtered categories for ${type}:`, filtered);
    console.log('Category type determination:', this.categories.map(cat => ({
      name: cat.name,
      originalType: cat.type,
      determinedType: getCategoryType(cat),
      matches: getCategoryType(cat) === type
    })));

    return filtered;
  }

  // Debug method to check categories
  debugCategories() {
    console.log('=== CATEGORY DEBUG INFO ===');
    console.log('Total categories:', this.categories.length);
    console.log('All categories:', this.categories);
    console.log('Form type value:', this.transactionForm.get('type')?.value);
    console.log('Current transaction type:', this.currentTransactionType);
    console.log('Filtered categories:', this.filteredCategories);
    console.log('Income categories:', this.categories.filter(c => c.type === 'income'));
    console.log('Expense categories:', this.categories.filter(c => c.type === 'expense'));
    console.log('=== END DEBUG ===');
  }

  // Force refresh categories from server
  forceRefreshCategories() {
    console.log('Force refreshing categories...');
    this.transactionService.forceRefreshCategories().subscribe({
      next: (categories: Category[]) => {
        console.log('Categories refreshed:', categories);
        this.categories = categories;
      },
      error: (error: any) => {
        console.error('Error refreshing categories:', error);
      }
    });
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Manual method to create categories if they don't exist
  createCategoriesIfNeeded() {
    console.log('Manual trigger: Creating categories...');
    this.isLoading = true;
    this.transactionService.createCategories().subscribe({
      next: (categories) => {
        console.log('Categories created via manual trigger:', categories);
        this.categories = categories;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating categories manually:', error);
        this.errorMessage = 'Failed to create categories';
        this.isLoading = false;
      }
    });
  }
}
