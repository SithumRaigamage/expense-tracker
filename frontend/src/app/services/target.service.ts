import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Target } from '../models/Target';


@Injectable({
  providedIn: 'root'
})
export class TargetService {
  private targets = new BehaviorSubject<Target[]>([]);

  constructor() {
    this.targets.next([
      {
        id: 1,
        month: new Date(2025, 2, 1), // March 2025
        targetAmount: 65000,
        currentSavings: 35000
      },
      {
        id: 2,
        month: new Date(2025, 1, 1), // February 2025
        targetAmount: 60000,
        currentSavings: 55000
      },
      {
        id: 3,
        month: new Date(2025, 0, 1), // January 2025
        targetAmount: 55000,
        currentSavings: 50000
      },
      {
        id: 4,
        month: new Date(2024, 11, 1), // December 2024
        targetAmount: 50000,
        currentSavings: 48000
      },
      {
        id: 5,
        month: new Date(2024, 10, 1), // November 2024
        targetAmount: 45000,
        currentSavings: 42000
      },
      {
        id: 6,
        month: new Date(2024, 9, 1), // October 2024
        targetAmount: 40000,
        currentSavings: 38000
      }
    ]);
  }

  getTargets(): Observable<Target[]> {
    return this.targets.asObservable();
  }

  getCurrentMonthTarget(): Observable<Target | undefined> {
    return this.targets.pipe(
      map(targets => {
        const currentDate = new Date();
        return targets.find(target =>
          target.month.getMonth() === currentDate.getMonth() &&
          target.month.getFullYear() === currentDate.getFullYear()
        );
      })
    );
  }

  getLastMonthTarget(): Observable<Target | undefined> {
    return this.targets.pipe(
      map(targets => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return targets.find(target =>
          target.month.getMonth() === lastMonth.getMonth() &&
          target.month.getFullYear() === lastMonth.getFullYear()
        );
      })
    );
  }

  getAverageTarget(): Observable<{
    averageTarget: number;
    averageSavings: number;
  }> {
    return this.targets.pipe(
      map(targets => {
        if (targets.length === 0) {
          return { averageTarget: 0, averageSavings: 0 };
        }

        // Get last 3 months targets
        const sortedTargets = targets
          .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
          .slice(0, 3);

        // Apply weights: current month (0.5), last month (0.3), two months ago (0.2)
        const weights = [0.5, 0.3, 0.2];
        let weightedTarget = 0;
        let weightedSavings = 0;
        let totalWeight = 0;

        sortedTargets.forEach((target, index) => {
          if (index < weights.length) {
            weightedTarget += target.targetAmount * weights[index];
            weightedSavings += target.currentSavings * weights[index];
            totalWeight += weights[index];
          }
        });

        return {
          averageTarget: weightedTarget / totalWeight,
          averageSavings: weightedSavings / totalWeight
        };
      })
    );
  }

  getPreviousPeriodAverage(): Observable<number> {
    return this.targets.pipe(
      map(targets => {
        const currentDate = new Date();
        const threeMonthsAgo = new Date(currentDate);
        threeMonthsAgo.setMonth(currentDate.getMonth() - 3);

        const previousPeriodTargets = targets
          .filter(target => {
            const targetDate = new Date(target.month);
            return targetDate >= threeMonthsAgo && targetDate < currentDate;
          })
          .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());

        if (previousPeriodTargets.length === 0) return 0;

        // Apply weights to previous period
        const weights = [0.4, 0.35, 0.25];
        let weightedSum = 0;
        let totalWeight = 0;

        previousPeriodTargets.forEach((target, index) => {
          if (index < weights.length) {
            weightedSum += target.currentSavings * weights[index];
            totalWeight += weights[index];
          }
        });

        return weightedSum / totalWeight;
      })
    );
  }

  addTarget(target: Omit<Target, 'id'>): void {
    const current = this.targets.getValue();
    const newTarget = {
      ...target,
      id: Math.max(...current.map(t => t.id), 0) + 1
    };
    this.targets.next([...current, newTarget]);
  }

  updateTarget(updatedTarget: Target): void {
    const current = this.targets.getValue();
    const index = current.findIndex(t => t.id === updatedTarget.id);
    if (index !== -1) {
      current[index] = updatedTarget;
      this.targets.next([...current]);
    }
  }

  deleteTarget(id: number): void {
    const current = this.targets.getValue();
    this.targets.next(current.filter(target => target.id !== id));
  }
}
