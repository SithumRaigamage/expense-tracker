import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductbudgetService } from '../../services/productbudget.service';
import { ProductBudget } from '../../models/ProductBudget';

type DrawerMode = 'add' | 'edit' | 'addMoney' | null;

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './budget.component.html',
  styleUrl: './budget.component.css'
})
export class BudgetComponent implements OnInit {
  goals: ProductBudget[] = [];
  isDrawerOpen = false;
  drawerMode: DrawerMode = null;
  currentGoal: Omit<ProductBudget, 'id'> = this.getEmptyGoal();
  addAmount = 0;
  selectedGoalId: string | null = null;

  constructor(private productBudgetService: ProductbudgetService) {}

  ngOnInit(): void {
    this.loadGoals();
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

  openDrawer(mode: DrawerMode, goal?: ProductBudget): void {
    this.drawerMode = mode;
    this.isDrawerOpen = true;

    if (goal && (mode === 'edit' || mode === 'addMoney')) {
      this.currentGoal = { ...goal };
      this.selectedGoalId = goal.id;
    } else {
      this.currentGoal = this.getEmptyGoal();
      this.selectedGoalId = null;
    }
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.drawerMode = null;
    this.currentGoal = this.getEmptyGoal();
    this.addAmount = 0;
    this.selectedGoalId = null;
  }

  getDrawerTitle(): string {
    switch (this.drawerMode) {
      case 'add': return 'Add New Goal';
      case 'edit': return 'Edit Goal';
      case 'addMoney': return 'Add Money to Goal';
      default: return '';
    }
  }

  submitForm(): void {
    if (this.validateGoal(this.currentGoal)) {
      if (this.drawerMode === 'add') {
        this.productBudgetService.addGoal(this.currentGoal);

        console.log(this.currentGoal);
      } else if (this.drawerMode === 'edit' && this.selectedGoalId) {
        this.productBudgetService.updateGoal({
          ...this.currentGoal,
          id: this.selectedGoalId
        });
      }
      this.closeDrawer();
    }
  }

  submitAddMoney(): void {
    if (this.addAmount > 0 && this.selectedGoalId) {
      this.productBudgetService.addMoney(this.selectedGoalId, this.addAmount);
      this.closeDrawer();
    }
  }

  deleteGoal(id: string): void {
    if (confirm('Are you sure you want to delete this goal?')) {
      this.productBudgetService.deleteGoal(id);
    }
  }

  private loadGoals(): void {
    this.productBudgetService.getGoals().subscribe(goals => {
      this.goals = goals;
      console.log(goals);
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
}
