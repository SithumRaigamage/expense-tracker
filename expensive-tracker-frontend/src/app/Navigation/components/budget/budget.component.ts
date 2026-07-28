import { Component, OnInit, HostListener, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductBudgetService } from '../../../services/product-budget.service';
import { ProductBudget } from '../../../core/models/ProductBudget';
import { WalletService } from '../../../services/wallet.service';
import { Wallet } from '../../../core/models/Wallet';
import { CurrencyService } from '../../../core/services/currency.service';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { ExcelExportService } from '../../../services/excel-export.service';
import { faDownload, faEdit, faPlus, faPlusCircle, faUpload, faRefresh, faFileUpload, faFileImport, faTrash, faBullseye } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SideDrawerComponent } from '../../../shared/components/side-drawer/side-drawer.component';
import { NotificationService } from '../../../shared/services/notification.service';
import { DialogService } from '../../../shared/services/dialog.service';

type DrawerMode = 'add' | 'edit' | 'addMoney' | null;

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule, AppCurrencyPipe, FontAwesomeModule, SideDrawerComponent, EmptyStateComponent],
  templateUrl: './budget.component.html',
})
export class BudgetComponent implements OnInit {
  private readonly notifications = inject(NotificationService);
  private readonly dialogs = inject(DialogService);
  private productBudgetService = inject(ProductBudgetService);
  private walletService = inject(WalletService);
  currencyService = inject(CurrencyService);
  private excelExportService = inject(ExcelExportService);

  private readonly destroyRef = inject(DestroyRef);

  goals: ProductBudget[] = [];
  filteredGoals: ProductBudget[] = [];
  faDownload = faDownload;
  faEdit = faEdit;
  faPlus = faPlus;
  faPlusCircle = faPlusCircle;
  faUpload = faUpload;
  faRefresh = faRefresh;
  faFileUpload = faFileUpload;
  faFileImport = faFileImport;
  faTrash = faTrash;
  faBullseye = faBullseye;
  isDrawerOpen = false;
  drawerMode: DrawerMode = null;
  currentGoal: Omit<ProductBudget, 'id'> = this.getEmptyGoal();
  addAmount = 0;
  selectedGoalId: string | null = null;
  availableWallets: Wallet[] = [];
  selectedWalletId = '';
  isLoading = false;
  searchQuery = '';
  sortOption = 'progress';
  filterOption = 'all';

  // Custom Dropdown States
  isSortOpen = false;
  isFilterOpen = false;

  // Image upload properties
  imageInputTab: 'url' | 'upload' = 'url';
  uploadedFile: File | null = null;
  isUploading = false;

  // JSON import properties
  activeTab: 'manual' | 'upload' = 'manual';
  selectedFile: File | null = null;
  jsonPreview: Omit<ProductBudget, 'id'>[] | null = null;
  jsonError: string | null = null;

  ngOnInit(): void {
    this.loadGoals();
    this.loadWallets();
    this.filteredGoals = [...this.goals];
  }

  private getEmptyGoal(): Omit<ProductBudget, 'id'> {
    return {
      name: '',
      imageUrl: '',
      targetAmount: 0,
      savedAmount: 0,
      targetDate: new Date()
    };
  }

  // Image upload functionality
  triggerFileInput(): void {
    document.getElementById('imageUpload')?.click();
  }

  handleImageUpload(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];

      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.notifications.error('That image is larger than 2 MB. Pick a smaller one.');
        fileInput.value = '';
        this.uploadedFile = null;
        return;
      }

      // Check file type
      if (!file.type.match('image.*')) {
        this.notifications.error('That file is not an image.');
        fileInput.value = '';
        this.uploadedFile = null;
        return;
      }

      // Store the file reference
      this.uploadedFile = file;

      // Set uploading status to show loading indicator
      this.isUploading = true;

      // Convert to base64 string for preview and storage
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        // readAsDataURL always yields a string; the guard is for the type, and
        // a non-string result falls through to the same empty preview as no file.
        this.currentGoal.imageUrl = typeof e.target?.result === 'string' ? e.target.result : '';
        // Hide loading indicator
        this.isUploading = false;
      };

      reader.onerror = () => {
        this.notifications.error('Could not read that file. Please try again.');
        this.isUploading = false;
        this.uploadedFile = null;
        fileInput.value = '';
      };

      reader.readAsDataURL(file);
    }
  }

  openDrawer(mode: DrawerMode, goal?: ProductBudget): void {
    this.drawerMode = mode;
    this.isDrawerOpen = true;
    this.activeTab = 'manual'; // Default to manual entry when opening drawer

    // Reset form data
    if (mode === 'edit' && goal) {
      this.currentGoal = {
        name: goal.name,
        imageUrl: goal.imageUrl,
        targetAmount: goal.targetAmount,
        savedAmount: goal.savedAmount,
        targetDate: goal.targetDate
      };
      this.selectedGoalId = goal.id;
    } else if (mode === 'add') {
      this.currentGoal = this.getEmptyGoal();
    } else if (mode === 'addMoney' && goal) {
      this.selectedGoalId = goal.id;
      this.addAmount = 0;
    }

    // Reset file upload data
    this.resetFileUpload();
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;

    // Reset image upload state when closing
    if (this.drawerMode === 'add' || this.drawerMode === 'edit') {
      this.imageInputTab = 'url';
      this.uploadedFile = null;
      this.isUploading = false;
    }

    // Reset JSON upload state
    this.resetFileUpload();

    this.drawerMode = null;
    this.currentGoal = this.getEmptyGoal();
    this.addAmount = 0;
    this.selectedGoalId = null;
    this.selectedWalletId = '';

    // Re-apply filters after closing the drawer
    this.applyFilters();
  }

  getDrawerTitle(): string {
    switch (this.drawerMode) {
      case 'add': return 'Add New Product Goal';
      case 'edit': return 'Edit Goal';
      case 'addMoney': return 'Add Money to Goal';
      default: return '';
    }
  }

  switchTab(tab: 'manual' | 'upload') {
    if (this.activeTab !== tab) {
      this.activeTab = tab;

      // Reset form data when switching tabs
      if (tab === 'manual') {
        this.resetFileUpload();
      } else {
        this.currentGoal = this.getEmptyGoal();
      }
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.processJsonData();
    }
  }

  processJsonData() {
    if (!this.selectedFile) {
      this.jsonError = 'No file selected';
      this.jsonPreview = null;
      return;
    }

    // Clear previous data
    this.jsonError = null;
    this.jsonPreview = null;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);

        // Validate the JSON structure
        if (!Array.isArray(json)) {
          this.jsonError = 'Invalid JSON format: Expected an array of goals';
          return;
        }

        // Validate each goal
        const goals: Omit<ProductBudget, 'id'>[] = [];
        const errors: string[] = [];

        json.forEach((item, index) => {
          // Validate required fields
          if (!item.name) errors.push(`Goal ${index + 1}: Missing name`);
          if (!item.targetAmount) errors.push(`Goal ${index + 1}: Missing targetAmount`);
          if (!item.targetDate) errors.push(`Goal ${index + 1}: Missing targetDate`);

          // Convert target amount to number if it's a string
          if (typeof item.targetAmount === 'string') {
            item.targetAmount = parseFloat(item.targetAmount);
          }

          // Convert saved amount to number if it's a string
          if (typeof item.savedAmount === 'string') {
            item.savedAmount = parseFloat(item.savedAmount);
          }

          // Convert target date to Date object
          if (item.targetDate) {
            try {
              item.targetDate = new Date(item.targetDate);
            } catch {
              errors.push(`Goal ${index + 1}: Invalid date format`);
            }
          }

          // If valid, add to goals array
          if (item.name && item.targetAmount && item.targetDate) {
            goals.push({
              name: item.name,
              imageUrl: item.imageUrl || '',
              targetAmount: item.targetAmount,
              savedAmount: item.savedAmount || 0,
              targetDate: new Date(item.targetDate)
            });
          }
        });

        if (errors.length > 0) {
          this.jsonError = `Validation errors:\n${errors.join('\n')}`;
          return;
        }

        if (goals.length === 0) {
          this.jsonError = 'No valid goals found in the file';
          return;
        }

        this.jsonPreview = goals;
      } catch (e) {
        console.error('Error parsing JSON:', e);
        this.jsonError = 'Failed to parse JSON file. Please check the file format.';
      }
    };

    reader.onerror = () => {
      this.jsonError = 'Error reading file';
    };

    reader.readAsText(this.selectedFile);
  }

  importGoals() {
    if (!this.jsonPreview || this.isLoading) {
      return;
    }

    this.isLoading = true;

    // Use the bulkAddGoals method
    this.productBudgetService.bulkAddGoals(this.jsonPreview).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        if (result.failedCount > 0 && result.failedGoals) {
          // Create a more detailed message about the failures
          const failureDetails = result.failedGoals
            .map(g => `• ${g.name}: ${g.error}`)
            .join('\n');

          // Use a simple alert with details
          this.notifications.error(`Imported ${result.successCount}. ${result.failedCount} failed: ${failureDetails}`);
        } else if (result.failedCount > 0) {
          this.notifications.error(`Imported ${result.successCount} goals; ${result.failedCount} failed.`);
        } else {
          this.notifications.success(`Imported ${result.successCount} goals.`);
        }

        // Refresh the goals list with a small delay to ensure backend processing is complete
        setTimeout(() => {
          this.productBudgetService.refreshGoals();
          this.loadGoals();
          // Apply filters to the refreshed data
          setTimeout(() => {
            this.applyFilters();
          }, 300);
        }, 500);

        this.closeDrawer();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error importing goals:', error);
        this.notifications.error(error?.message || 'Could not import those goals.');
        this.isLoading = false;
      }
    });
  }

  resetFileUpload() {
    this.selectedFile = null;
    this.jsonPreview = null;
    this.jsonError = null;
  }

  submitForm(): void {
    if (this.validateGoal(this.currentGoal)) {
      if (this.drawerMode === 'add') {
        this.productBudgetService.addGoal(this.currentGoal).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.loadGoals(); // Refresh goals
            this.closeDrawer();
          },
          error: (error) => {
            console.error('Error adding goal:', error);
            this.notifications.error(error?.message || 'Could not add that goal.');
          }
        });
      } else if (this.drawerMode === 'edit' && this.selectedGoalId) {
        this.productBudgetService.updateGoal({
          ...this.currentGoal,
          id: this.selectedGoalId
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.loadGoals(); // Refresh goals
            this.closeDrawer();
          },
          error: (error) => {
            console.error('Error updating goal:', error);
            this.notifications.error(error?.message || 'Could not update that goal.');
          }
        });
      }
    }
  }

  /**
   * Hands the whole contribution to the server, which debits the wallet and
   * credits the goal in one transaction.
   *
   * This used to run as two independent writes from the browser — debit, then
   * credit, with a best-effort undo of the debit if the credit failed. Closing
   * the tab in between left the money deducted from the wallet and attached to
   * nothing. The clamping below is only there to keep the input honest; the
   * server clamps again against balances it reads inside the transaction.
   */
  submitAddMoney(): void {
    if (this.isLoading || this.addAmount <= 0 || !this.selectedGoalId || !this.selectedWalletId) {
      return;
    }

    const goalId = this.selectedGoalId;
    const walletId = this.selectedWalletId;
    this.isLoading = true;

    this.productBudgetService.contribute(goalId, walletId, this.addAmount).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ goal, appliedAmount, isFullyFunded }) => {
        this.isLoading = false;
        this.loadGoals();
        // The wallet balance changed server-side; pull the new one.
        this.walletService.refreshWallets();

        const currency = this.currencyService.getActiveCurrency();
        this.notifications.success(
          isFullyFunded
            ? `"${goal.name}" is now fully funded.`
            : `Added ${currency} ${appliedAmount.toLocaleString()} to "${goal.name}".`
        );

        this.closeDrawer();
      },
      error: (error) => {
        this.isLoading = false;
        this.notifications.error(error?.message || 'Could not add money to this goal.');
      }
    });
  }

  deleteGoal(id: string): void {
    this.dialogs.confirmDelete('goal').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.productBudgetService.deleteGoal(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.loadGoals();
          this.notifications.success('Goal deleted.');
        },
        error: (error) => {
          this.notifications.error(error?.message || 'Could not delete that goal.');
        }
      });
    });
  }

  private loadGoals(): void {
    this.productBudgetService.getGoals().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (goals) => {
        this.goals = goals;
        this.applyFilters(); // Apply filters after loading goals
      },
      error: (error) => {
        console.error('Error loading goals:', error);
        this.notifications.error(error?.message || 'Could not load your goals.');
      }
    });
  }

  exportBudget(): void {
    if (this.goals.length === 0) return;
    
    const exportData = this.excelExportService.formatDataForExport(this.goals);
    this.excelExportService.exportToExcel(exportData, 'SavingsGoals', 'Savings Goals');
  }

  /**
   * Apply search, sort, and filtering to the goals
   */
  /**
   * Reset all search and filter options to default values
   */
  resetFilters(): void {
    this.searchQuery = '';
    this.sortOption = 'progress';
    this.filterOption = 'all';
    this.applyFilters();
  }

  applyFilters(): void {
    // Start with all goals
    let result = [...this.goals];

    // Apply search filter if searchQuery is not empty
    if (this.searchQuery.trim()) {
      const searchLower = this.searchQuery.toLowerCase().trim();
      result = result.filter(goal =>
        goal.name.toLowerCase().includes(searchLower) ||
        // Also search in other fields that might be relevant
        (goal.targetAmount.toString().includes(searchLower)) ||
        (goal.savedAmount.toString().includes(searchLower))
      );
    }

    // Apply status filter
    if (this.filterOption === 'ongoing') {
      result = result.filter(goal =>
        (goal.savedAmount / goal.targetAmount) * 100 < 100
      );
    } else if (this.filterOption === 'completed') {
      result = result.filter(goal =>
        (goal.savedAmount / goal.targetAmount) * 100 >= 100
      );
    }

    // Apply sorting
    switch (this.sortOption) {
      case 'progress':
        result.sort((a, b) =>
          (b.savedAmount / b.targetAmount) - (a.savedAmount / a.targetAmount)
        );
        break;
      case 'amount':
        result.sort((a, b) => b.targetAmount - a.targetAmount);
        break;
      case 'date':
        result.sort((a, b) =>
          new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
        );
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    // Update filtered goals
    this.filteredGoals = result;
  }

  private loadWallets(): void {
    this.walletService.getAllWallets().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(wallets => {
      // Only get cash and bank wallets with positive balance
      this.availableWallets = wallets.filter(wallet =>
        (wallet.type === 'cash' || wallet.type === 'bank') &&
        wallet.balance > 0
      );
    });
  }

  private validateGoal(goal: Omit<ProductBudget, 'id'>): boolean {
    return !!(goal.name && goal.targetAmount > 0 && goal.targetDate);
  }

  getProgressColor(progress: number): string {
    if (progress >= 100) {
      return '#22C55E'; // Green for completed
    } else if (progress >= 75) {
      return '#3B82F6'; // Blue for near completion
    } else if (progress >= 50) {
      return '#EAB308'; // Yellow for halfway
    } else if (progress >= 25) {
      return '#F97316'; // Orange for started
    } else {
      return '#EF4444'; // Red for early stages
    }
  }

  /**
   * Calculate the maximum amount that can be added to the goal
   * The max is either the wallet balance or the remaining amount needed, whichever is smaller
   */
  getMaxInputAmount(): number {
    if (!this.selectedWalletId || !this.selectedGoalId) {
      return 0;
    }

    const selectedWallet = this.availableWallets.find(w => w.id === this.selectedWalletId);
    if (!selectedWallet) {
      return 0;
    }

    const remainingAmount = this.currentGoal.targetAmount - this.currentGoal.savedAmount;

    // Return the smaller of wallet balance or remaining amount needed
    return Math.min(selectedWallet.balance, remainingAmount);
  }

  /**
   * Set amount to a percentage of the selected wallet balance, but limited by the remaining goal amount
   */
  setAmountPercentage(percentage: number): void {
    if (!this.selectedWalletId) {
      return;
    }

    const selectedWallet = this.availableWallets.find(w => w.id === this.selectedWalletId);
    if (!selectedWallet) {
      return;
    }

    const calculatedAmount = selectedWallet.balance * (percentage / 100);
    const remainingAmount = this.currentGoal.targetAmount - this.currentGoal.savedAmount;

    // Use the smaller of calculated amount or remaining amount
    this.addAmount = Math.min(calculatedAmount, remainingAmount);
  }

  /**
   * Set amount to the remaining amount needed to reach the goal target
   */
  setRemainingAmount(): void {
    const remainingAmount = this.currentGoal.targetAmount - this.currentGoal.savedAmount;

    if (!this.selectedWalletId) {
      return;
    }

    const selectedWallet = this.availableWallets.find(w => w.id === this.selectedWalletId);
    if (!selectedWallet) {
      return;
    }

    // Use the smaller of remaining amount or wallet balance
    this.addAmount = Math.min(remainingAmount, selectedWallet.balance);
  }

  /**
   * Select a wallet and automatically set a suggested amount
   */
  selectWallet(walletId: string): void {
    this.selectedWalletId = walletId;

    // Automatically suggest 50% of wallet balance or remaining amount, whichever is smaller
    const selectedWallet = this.availableWallets.find(w => w.id === walletId);
    if (selectedWallet) {
      const remainingAmount = this.currentGoal.targetAmount - this.currentGoal.savedAmount;
      const suggestedAmount = selectedWallet.balance * 0.5; // 50% of wallet balance

      this.addAmount = Math.min(suggestedAmount, remainingAmount);
    }
  }

  /**
   * Show a success message to the user
   * @param message The success message to display
   */
  toggleSortDropdown() {
    this.isSortOpen = !this.isSortOpen;
    if (this.isSortOpen) this.isFilterOpen = false;
  }

  toggleFilterDropdown() { // Renamed from toggleFilter
    this.isFilterOpen = !this.isFilterOpen;
    if (this.isFilterOpen) this.isSortOpen = false;
  }

  // Both dropdowns have a transparent backdrop that closes them on click;
  // Escape is the keyboard equivalent.
  @HostListener('document:keydown.escape')
  onEscape() {
    this.isSortOpen = false;
    this.isFilterOpen = false;
  }

  selectSort(option: string) {
    this.sortOption = option;
    this.applyFilters();
    this.isSortOpen = false;
  }

  selectFilter(option: string) {
    this.filterOption = option;
    this.applyFilters();
    this.isFilterOpen = false;
  }

}
