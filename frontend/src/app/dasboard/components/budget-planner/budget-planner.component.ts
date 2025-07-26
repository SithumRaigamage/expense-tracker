import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductbudgetService } from '../../../services/productbudget.service';
import { ProductBudget } from '../../../models/ProductBudget';
import { WalletService } from '../../../services/wallet.service';
import { Wallet } from '../../../models/Wallet';

@Component({
  selector: 'app-budget-planner',
  templateUrl: './budget-planner.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class BudgetPlannerComponent implements OnInit {
  productgoals: ProductBudget[] = [];
  isLoading: boolean = true;
  error: string | null = null;

  constructor(
    private productBudgetService: ProductbudgetService,
    private walletService: WalletService
  ) {}

  ngOnInit(): void {
    this.loadGoals();
  }

  private loadGoals(): void {
    this.isLoading = true;
    this.error = null;

    this.productBudgetService.getGoals().subscribe({
      next: (goals) => {
        this.productgoals = goals;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading goals:', err);
        this.error = 'Failed to load budget goals';
        this.isLoading = false;
      }
    });
  }

  refreshGoals(): void {
    this.productBudgetService.refreshGoals();
    this.loadGoals();
  }

  calculateProgress(goal: ProductBudget): number {
    if (goal.targetAmount <= 0) return 0;
    const percentage = (goal.savedAmount / goal.targetAmount) * 100;
    return Math.min(Math.round(percentage), 100);
  }

  getProgressColor(progress: number): string {
    if (progress < 25) return 'bg-red-500 dark:bg-red-600';
    if (progress < 50) return 'bg-yellow-500 dark:bg-yellow-600';
    if (progress < 75) return 'bg-blue-500 dark:bg-blue-600';
    return 'bg-green-500 dark:bg-green-600';
  }

  formatCurrency(amount: number): string {
    return `LKR ${amount.toLocaleString()}`;
  }

  formatDate(date: Date | string): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
