import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface BudgetGoal {
  id: string;
  name: string;
  imageUrl: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: Date;
}

@Component({
  selector: 'app-budget-planner',
  templateUrl: './budget-planner.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class BudgetPlannerComponent implements OnInit {
  goals: BudgetGoal[] = [
    {
      id: '1',
      name: 'Apple AirPods 4',
      imageUrl: 'assets/images/product_goals/airpods4.png',
      targetAmount: 42000,
      savedAmount: 0,
      targetDate: new Date('2025-12-31')
    },
    {
      id: '2',
      name:'Monitor Stand',
      imageUrl: 'assets/images/product_goals/monitor_stand.png',
      targetAmount: 9000,
      savedAmount: 4000,
      targetDate: new Date('2025-03-31')
    }
  ];

  ngOnInit(): void {
    // Fetch goals from service
  }

  calculateProgress(goal: BudgetGoal): number {
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
