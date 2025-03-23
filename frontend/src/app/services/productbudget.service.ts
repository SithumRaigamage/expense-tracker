import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProductBudget } from '../models/ProductBudget';

@Injectable({
  providedIn: 'root'
})
export class ProductbudgetService {

  private goals = new BehaviorSubject<ProductBudget[]>([
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
      name: 'Monitor Stand',
      imageUrl: 'assets/images/product_goals/monitor_stand.png',
      targetAmount: 9000,
      savedAmount: 4000,
      targetDate: new Date('2025-03-31')
    }
  ]);

  getGoals(): Observable<ProductBudget[]> {
    return this.goals.asObservable();
  }

  addGoal(goal: Omit<ProductBudget, 'id'>): void {
    const currentGoals = this.goals.getValue();
    const newGoal = {
      ...goal,
      id: (currentGoals.length + 1).toString()
    };
    this.goals.next([...currentGoals, newGoal]);
  }

  updateGoal(goal: ProductBudget): void {
    const currentGoals = this.goals.getValue();
    const index = currentGoals.findIndex(g => g.id === goal.id);
    if (index !== -1) {
      currentGoals[index] = goal;
      this.goals.next([...currentGoals]);
    }
  }

  deleteGoal(id: string): void {
    const currentGoals = this.goals.getValue();
    this.goals.next(currentGoals.filter(goal => goal.id !== id));
  }

  addMoney(id: string, amount: number): void {
    const currentGoals = this.goals.getValue();
    const index = currentGoals.findIndex(g => g.id === id);
    if (index !== -1) {
      currentGoals[index] = {
        ...currentGoals[index],
        savedAmount: currentGoals[index].savedAmount + amount
      };
      this.goals.next([...currentGoals]);
    }
  }
}
