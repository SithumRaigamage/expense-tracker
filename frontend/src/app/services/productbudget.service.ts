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
      savedAmount: 0,
      targetDate: new Date('2025-03-31')
    },
    {
      id: '3',
      name: 'Baseus Wireless Charger',
      imageUrl: 'assets/images/product_goals/wireless-charger-9.png',
      targetAmount: 8000,
      savedAmount: 0,
      targetDate: new Date('2025-12-31')
    },
    {
      id: '4',
      name: 'Ugreen Vertical Laptop Stand Holder',
      imageUrl: 'assets/images/product_goals/ugreen_laptop_stand.png',
      targetAmount: 5000,
      savedAmount: 0,
      targetDate: new Date('2025-12-31')
    },
    {
      id: '5',
      name: 'Ugreen 2 in 1 Wireless Charger',
      imageUrl: 'assets/images/product_goals/ugreen_wireless_charger.png',
      targetAmount: 10000,
      savedAmount: 0,
      targetDate: new Date('2025-12-31')
    },
    {
      id: '6',
      name: 'Ugreen lightning to female aux adapter',
      imageUrl: 'assets/images/product_goals/ugreen_lightning_to_aux.png',
      targetAmount: 2000,
      savedAmount: 0,
      targetDate: new Date('2025-12-31')
    },
    {
      id: '7',
      name: 'MSI Gaming Monitor',
      imageUrl: 'assets/images/product_goals/msi_monitor.png',
      targetAmount: 66000,
      savedAmount: 0,
      targetDate: new Date('2025-12-31')
    },
    {
      id: '8',
      name: 'Kingston 1TB SSD',
      imageUrl: 'assets/images/product_goals/kingston_ssd.png',
      targetAmount: 18500,
      savedAmount: 0,
      targetDate: new Date('2025-12-31')
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
