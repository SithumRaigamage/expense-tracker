import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductbudgetService } from '../../../services/productbudget.service';
import { ProductBudget } from '../../../core/models/ProductBudget';
import { WalletService } from '../../../services/wallet.service';
import { Wallet } from '../../../core/models/Wallet';
import { FilterPipe } from './filter.pipe';

type DrawerMode = 'add' | 'edit' | 'addMoney' | null;

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule,FilterPipe],
  templateUrl: './budget.component.html',
  styleUrl: './budget.component.css'
})
export class BudgetComponent implements OnInit {
  goals: ProductBudget[] = [];
  filteredGoals: ProductBudget[] = [];
  isDrawerOpen = false;
  drawerMode: DrawerMode = null;
  currentGoal: Omit<ProductBudget, 'id'> = this.getEmptyGoal();
  addAmount = 0;
  selectedGoalId: string | null = null;
  availableWallets: Wallet[] = [];
  selectedWalletId: string = '';
  isLoading = false;
  searchQuery = '';
  sortOption = 'progress';
  filterOption = 'all';

  // Image upload properties
  imageInputTab: 'url' | 'upload' = 'url';
  uploadedFile: File | null = null;
  isUploading = false;

  constructor(
    private productBudgetService: ProductbudgetService,
    private walletService: WalletService
  ) {}

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
        alert('Image is too large. Maximum size is 2MB.');
        fileInput.value = '';
        this.uploadedFile = null;
        return;
      }

      // Check file type
      if (!file.type.match('image.*')) {
        alert('Only image files are allowed.');
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
      reader.onload = (e: any) => {
        // Set the image URL to the base64 string
        this.currentGoal.imageUrl = e.target.result;
        // Hide loading indicator
        this.isUploading = false;
      };

      reader.onerror = () => {
        alert('Error reading file. Please try again.');
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

    // Reset image upload state
    this.imageInputTab = 'url';
    this.uploadedFile = null;
    this.isUploading = false;

    if (goal && (mode === 'edit' || mode === 'addMoney')) {
      this.currentGoal = { ...goal };
      this.selectedGoalId = goal.id;

      // If editing and the goal has an image URL that appears to be a data URL,
      // switch to upload tab for a better UX
      if (mode === 'edit' && goal.imageUrl && goal.imageUrl.startsWith('data:image')) {
        this.imageInputTab = 'upload';
      }
    } else {
      this.currentGoal = this.getEmptyGoal();
      this.selectedGoalId = null;
    }
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;

    // Reset image upload state when closing
    if (this.drawerMode === 'add' || this.drawerMode === 'edit') {
      this.imageInputTab = 'url';
      this.uploadedFile = null;
      this.isUploading = false;
    }

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

  submitForm(): void {
    if (this.validateGoal(this.currentGoal)) {
      if (this.drawerMode === 'add') {
        this.productBudgetService.addGoal(this.currentGoal).subscribe({
          next: () => {
            this.loadGoals(); // Refresh goals
            this.closeDrawer();
          },
          error: (error) => {
            console.error('Error adding goal:', error);
            alert('Failed to add goal: ' + error.message);
          }
        });
      } else if (this.drawerMode === 'edit' && this.selectedGoalId) {
        this.productBudgetService.updateGoal({
          ...this.currentGoal,
          id: this.selectedGoalId
        }).subscribe({
          next: () => {
            this.loadGoals(); // Refresh goals
            this.closeDrawer();
          },
          error: (error) => {
            console.error('Error updating goal:', error);
            alert('Failed to update goal: ' + error.message);
          }
        });
      }
    }
  }

  submitAddMoney(): void {
    if (this.addAmount > 0 && this.selectedGoalId && this.selectedWalletId) {
      const selectedWallet = this.availableWallets.find(w => w.id === this.selectedWalletId);
      const selectedGoal = this.goals.find(g => g.id === this.selectedGoalId);

      if (!selectedGoal) {
        alert('Goal not found');
        return;
      }

      // Calculate remaining amount needed to reach target
      const remainingAmount = selectedGoal.targetAmount - selectedGoal.savedAmount;

      // Limit the amount to add to the remaining amount needed
      const amountToAdd = Math.min(this.addAmount, remainingAmount);

      if (amountToAdd <= 0) {
        alert('This goal is already fully funded!');
        return;
      }

      if (selectedWallet && selectedWallet.balance >= amountToAdd) {
        // Update wallet balance
        this.walletService.updateWallet(this.selectedWalletId, {
          balance: selectedWallet.balance - amountToAdd
        }).subscribe({
          next: () => {
            // Add money to goal
            console.log(`Adding ${amountToAdd} to goal ${this.selectedGoalId}`);
            this.productBudgetService.addMoney(this.selectedGoalId!, amountToAdd).subscribe({
              next: (updatedGoal) => {
                console.log('Successfully updated goal:', updatedGoal);
                this.loadGoals();

                // Check if goal is now fully funded
                const isFullyFunded = updatedGoal.savedAmount >= updatedGoal.targetAmount;

                if (isFullyFunded) {
                  // Show success message for fully funded goal
                  this.showSuccessMessage(`Congratulations! "${updatedGoal.name}" is now fully funded!`);
                } else {
                  // Show regular success message
                  this.showSuccessMessage(`Successfully added ${amountToAdd.toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })} to "${updatedGoal.name}"`);
                }

                this.closeDrawer();
              },
              error: (error) => {
                console.error('Error adding money to goal:', error);
                console.error('Error details:', error.name, error.status, error.message);
                alert('Failed to add money to goal: ' + error.message);

                // Restore wallet balance if adding money to goal fails
                console.log('Restoring wallet balance...');
                this.walletService.updateWallet(this.selectedWalletId, {
                  balance: selectedWallet.balance
                }).subscribe();
              }
            });
          },
          error: (error) => {
            console.error('Error updating wallet balance:', error);
            alert('Failed to update wallet: ' + error.message);
          }
        });
      } else {
        alert('Insufficient funds in selected wallet');
      }
    }
  }

  deleteGoal(id: string): void {
    if (confirm('Are you sure you want to delete this goal?')) {
      this.productBudgetService.deleteGoal(id).subscribe({
        next: () => {
          // Goal was successfully deleted, now update the UI
          this.loadGoals();
        },
        error: (error) => {
          console.error('Error deleting goal:', error);
          alert('Failed to delete goal: ' + error.message);
        }
      });
    }
  }

  private loadGoals(): void {
    this.productBudgetService.getGoals().subscribe({
      next: (goals) => {
        this.goals = goals;
        this.applyFilters(); // Apply filters after loading goals
      },
      error: (error) => {
        console.error('Error loading goals:', error);
        alert('Failed to load budget goals: ' + error.message);
      }
    });
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
    this.walletService.getAllWallets().subscribe(wallets => {
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
  private showSuccessMessage(message: string): void {
    // For now, use an alert, but this could be replaced with a nicer toast or notification
    alert(message);
  }
}
