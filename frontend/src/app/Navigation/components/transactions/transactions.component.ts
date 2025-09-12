import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TransactionService } from '../../../services/transaction.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPlus, faPencil, faTrash, faUpload, faFileUpload, faFileImport,
  faEdit, faRefresh, faFilter, faSearch, faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { Transaction } from '../../../core/models/Transaction';
import { ToastmsgService } from '../../../services/toastmsg.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

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
  faUpload = faUpload;
  faFileUpload = faFileUpload;
  faFileImport = faFileImport;
  faEdit = faEdit;
  faRefresh = faRefresh;
  faFilter = faFilter;
  faSearch = faSearch;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;
  faDownload = faDownload;

  // All loaded transactions
  allTransactions: Transaction[] = [];
  // Filtered transactions (before pagination)
  filteredTransactions: Transaction[] = [];
  // Displayed transactions (after pagination)
  transactions: Transaction[] = [];
  categories: Category[] = [];
  isDrawerOpen = false;
  selectedTransaction: Transaction | null = null;
  transactionForm: FormGroup;
  filterForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  activeTab: 'manual' | 'upload' = 'manual';
  pdfFileName = 'transaction-data.pdf';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  // File upload related properties
  selectedFile: File | null = null;
  jsonPreview: Transaction[] | null = null;
  jsonError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private toastService: ToastmsgService
  ) {
    this.transactionForm = this.createForm();
    this.filterForm = this.createFilterForm();
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

    // Subscribe to filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  private loadTransactions() {
    this.isLoading = true;
    this.transactionService.getAllTransactions().subscribe({
      next: (transactions) => {
        this.allTransactions = transactions;
        this.filteredTransactions = [...this.allTransactions];
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.errorMessage = 'Failed to load transactions';
        this.isLoading = false;
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
    this.activeTab = 'manual'; // Default to manual entry when opening drawer
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    this.selectedTransaction = null;
    this.transactionForm.reset({ type: 'expense' });
    this.resetFileUpload();
  }

  switchTab(tab: 'manual' | 'upload') {
    if (this.activeTab !== tab) {
      this.activeTab = tab;

      // Reset form data when switching tabs
      if (tab === 'manual') {
        this.resetFileUpload();
      } else {
        this.transactionForm.reset({ type: 'expense' });
      }
    }
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
          if (this.selectedTransaction) {
            this.toastService.show('Transaction updated successfully', 'warning');
          } else {
            this.toastService.show('Transaction added successfully', 'success');
          }
          this.closeDrawer();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error saving transaction:', error);
          this.toastService.show(error.message || 'Error saving transaction', 'error');
          this.errorMessage = error.message || 'Failed to save transaction. Please try again.';
          this.isLoading = false;
        }
      });
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
      this.jsonError = 'Invalid JSON format. Expected an array of transactions.';
      return;
    }

    const validTransactions: Transaction[] = [];
    const errors: string[] = [];

    data.forEach((item: any, index: number) => {
      if (!item.description) {
        errors.push(`Transaction at index ${index} is missing a description`);
      }

      if (!item.type || !['income', 'expense'].includes(item.type)) {
        errors.push(`Transaction "${item.description || index}" has an invalid type`);
      }

      if (item.amount === undefined || isNaN(Number(item.amount))) {
        errors.push(`Transaction "${item.description || index}" has an invalid amount`);
      }

      if (!item.category) {
        errors.push(`Transaction "${item.description || index}" is missing a category`);
      }

      if (!item.date) {
        errors.push(`Transaction "${item.description || index}" is missing a date`);
      }

      if (!errors.length) {
        validTransactions.push({
          id: '', // Will be assigned by server
          description: item.description,
          type: item.type,
          amount: Number(item.amount),
          category: item.category,
          date: new Date(item.date)
        });
      }
    });

    if (errors.length) {
      this.jsonError = `Found ${errors.length} issues in your data:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n...and ${errors.length - 3} more issues` : ''}`;
      return;
    }

    if (validTransactions.length === 0) {
      this.jsonError = 'No valid transactions found in the file.';
      return;
    }

    this.jsonPreview = validTransactions;
  }

  importTransactions() {
    if (!this.jsonPreview || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Use the bulkAddTransactions method
    this.transactionService.bulkAddTransactions(this.jsonPreview).subscribe({
      next: (result) => {
        console.log(`Successfully imported ${result.successCount} transactions`);
        if (result.failedCount > 0 && result.failedTransactions) {
          // Create a more detailed message about the failures
          const failureDetails = result.failedTransactions
            .map(t => `• ${t.description}: ${t.error}`)
            .join('\n');

          // Show toast messages
          this.toastService.show(`Successfully imported ${result.successCount} transactions`, 'success');
          this.toastService.show(`${result.failedCount} transaction(s) failed to import`, 'warning');
        } else if (result.failedCount > 0) {
          this.toastService.show(`${result.successCount} transactions imported successfully. ${result.failedCount} transactions failed.`, 'warning');
        } else {
          this.toastService.show(`${result.successCount} transactions imported successfully!`, 'success');
        }
        // Refresh the transactions list with a small delay to ensure backend processing is complete
        setTimeout(() => {
          this.transactionService.refreshTransactions();
          this.loadTransactions();
          // Apply filters to the refreshed data
          setTimeout(() => {
            this.applyFilters();
          }, 300);
        }, 500);

        this.closeDrawer();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error importing transactions:', error);
        this.toastService.show(error.message || 'Failed to import transactions', 'error');
        this.errorMessage = error.message || 'Failed to import transactions. Please try again.';
        this.isLoading = false;
      }
    });
  }

  resetFileUpload() {
    this.selectedFile = null;
    this.jsonPreview = null;
    this.jsonError = null;
  }

  deleteTransaction(id: string | number) {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.transactionService.deleteTransaction(id).subscribe({
        next: () => {
          console.log('Transaction deleted successfully');
          this.toastService.show('Transaction deleted successfully', 'error');
        },
        error: (error) => {
          console.error('Error deleting transaction:', error);
          this.toastService.show(error.message || 'Failed to delete transaction', 'error');
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

  // Helper method to format date for input
  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Filter form creation
  createFilterForm(): FormGroup {
    return this.fb.group({
      startDate: [''],
      endDate: [''],
      type: [''],
      category: [''],
      searchTerm: ['']
    });
  }

  // Apply filters based on filter form values
  applyFilters(): void {
    // Start with all transactions
    let filtered = [...this.allTransactions];
    const filters = this.filterForm.value;

    // Apply type filter
    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    // Apply date range filter
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(t => {
        const transactionDate = t.date instanceof Date ? t.date : new Date(t.date);
        return transactionDate >= startDate;
      });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(t => {
        const transactionDate = t.date instanceof Date ? t.date : new Date(t.date);
        return transactionDate <= endDate;
      });
    }

    // Apply search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(term) ||
        t.category.toLowerCase().includes(term)
      );
    }

    // Update filtered transactions and reset pagination
    this.filteredTransactions = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  // Update pagination based on current page and filtered transactions
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredTransactions.length / this.pageSize);

    // Update displayed transactions based on current page
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.transactions = this.filteredTransactions.slice(startIndex, endIndex);
  }

  // Navigate to a specific page
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  // Reset all filters
  resetFilters(): void {
    this.filterForm.reset();
    this.applyFilters();
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

  downloadPdf() {
    const doc = new jsPDF();

    // Table columns
    const columns = [
    { header: 'Date', dataKey: 'date' },
    { header: 'Description', dataKey: 'description' },
    { header: 'Category', dataKey: 'category' },
    { header: 'Type', dataKey: 'type' },
    { header: 'Amount', dataKey: 'amount' }
    ] as const;

    // Table rows
    type RowType = {
      date: string;
      description: string;
      category: string;
      type: 'income' | 'expense';
      amount: number;
    };

    const rows: RowType[] = this.filteredTransactions.map(t => ({
      date: t.date instanceof Date ? t.date.toISOString().split('T')[0] : t.date,
      description: t.description,
      category: t.category,
      type: t.type,
      amount: t.amount
    }));

    doc.text('Transactions', 14, 16);
    (autoTable as any)(doc, {
      head: [columns.map(col => col.header)],
      body: rows.map(row => columns.map(col => row[col.dataKey as keyof RowType])),
      startY: 20
    });

    doc.save(this.pdfFileName);
  }
}
