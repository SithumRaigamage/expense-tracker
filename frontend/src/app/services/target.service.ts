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
    // Initialize with sample data
    this.targets.next([
      {
        id: 1,
        month: new Date(),
        targetAmount: 50000,
        currentSavings: 11500
      },
      {
        id: 2,
        month: new Date(2021, 1),
        targetAmount: 60000,
        currentSavings: 20000
      },
      {
        id: 3,
        month: new Date(2021, 2),
        targetAmount: 70000,
        currentSavings: 250
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
        const sum = targets.reduce((acc, target) => ({
          target: acc.target + target.targetAmount,
          savings: acc.savings + target.currentSavings
        }), { target: 0, savings: 0 });

        return {
          averageTarget: sum.target / targets.length,
          averageSavings: sum.savings / targets.length
        };
      })
    );
  }

  getPreviousPeriodAverage(): Observable<number> {
    return this.targets.pipe(
      map(targets => {
        const currentDate = new Date();
        const previousPeriodTargets = targets.filter(target => {
          const targetDate = new Date(target.month);
          return targetDate.getTime() < currentDate.getTime();
        });

        if (previousPeriodTargets.length === 0) return 0;

        const sum = previousPeriodTargets.reduce((acc, target) =>
          acc + target.currentSavings, 0);
        return sum / previousPeriodTargets.length;
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
