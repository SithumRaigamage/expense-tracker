import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductbudgetService } from '../services/productbudget.service';
import { ProductBudget } from '../models/ProductBudget';

@Component({
  selector: 'app-budget-planner',
  templateUrl: './budget-planner.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class BudgetPlannerComponent implements OnInit {
  productgoals: ProductBudget[] = [];

  constructor(private productBudgetService: ProductbudgetService) {}

  ngOnInit(): void {
    this.productBudgetService.getGoals().subscribe(goals => {
      this.productgoals = goals;
    });
  }

  calculateProgress(goal: ProductBudget): number {
    return Math.round((goal.savedAmount / goal.targetAmount) * 100);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  getProgressColor(progress: number): string {
    if (progress < 25) return 'bg-red-500';
    if (progress < 50) return 'bg-orange-500';
    if (progress < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  }
}
