import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ProductBudget } from '../core/models/ProductBudget';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

/** Raw shape returned by POST /productbudgets/:id/contribute. */
interface ApiContributionResult {
  budget: {
    _id: string;
    name: string;
    imageUrl: string;
    targetAmount: number;
    savedAmount: number;
    targetDate: string;
  };
  appliedAmount: number;
  isFullyFunded: boolean;
  walletBalance: number;
}

/** What the server actually did — `appliedAmount` can be less than requested. */
export interface ContributionResult {
  goal: ProductBudget;
  appliedAmount: number;
  isFullyFunded: boolean;
  walletBalance: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductBudgetService {
  private apiUrl = environment.apiUrl;
  private goals = new BehaviorSubject<ProductBudget[]>([]);

  constructor(private http: HttpClient, private authService: AuthService) {
    // Load goals when the service is initialized if user is authenticated
    if (this.authService.isAuthenticated()) {
      this.loadGoals();
    }

    // Also load goals when user becomes authenticated
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadGoals();
      }
    });
  }

  private loadGoals(): void {

    this.http.get<ApiResponse<ProductBudget[]>>(`${this.apiUrl}/productbudgets`)
      .pipe(
        map(response => response.data),
        map(goals => this.mapApiGoalsToProductBudgets(goals)),
        catchError(this.handleError)
      )
      .subscribe({
        next: (goals) => {
          this.goals.next(goals);
        },
        error: (error) => {
          console.error('Error loading product budget goals:', error);
        }
      });
  }

  private mapApiGoalsToProductBudgets(goals: any[]): ProductBudget[] {
    return goals.map(goal => ({
      id: goal._id,
      name: goal.name,
      imageUrl: goal.imageUrl,
      targetAmount: goal.targetAmount,
      savedAmount: goal.savedAmount,
      targetDate: new Date(goal.targetDate)
    }));
  }

  getGoals(): Observable<ProductBudget[]> {
    // If goals are empty, try loading them first
    if (this.goals.getValue().length === 0 && this.authService.isAuthenticated()) {
      this.loadGoals();
    }
    return this.goals.asObservable();
  }

  addGoal(goal: Omit<ProductBudget, 'id'>): Observable<ProductBudget> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/productbudgets`, goal)
      .pipe(
        map(response => response.data),
        map(newGoal => ({
          id: newGoal._id,
          name: newGoal.name,
          imageUrl: newGoal.imageUrl,
          targetAmount: newGoal.targetAmount,
          savedAmount: newGoal.savedAmount,
          targetDate: new Date(newGoal.targetDate)
        })),
        tap(newGoal => {
          const currentGoals = this.goals.getValue();
          this.goals.next([...currentGoals, newGoal]);
        }),
        catchError(this.handleError)
      );
  }

  updateGoal(goal: ProductBudget): Observable<ProductBudget> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }

    const { id, ...goalData } = goal;

    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/productbudgets/${id}`, goalData)
      .pipe(
        map(response => response.data),
        map(updatedGoal => ({
          id: updatedGoal._id,
          name: updatedGoal.name,
          imageUrl: updatedGoal.imageUrl,
          targetAmount: updatedGoal.targetAmount,
          savedAmount: updatedGoal.savedAmount,
          targetDate: new Date(updatedGoal.targetDate)
        })),
        tap(updatedGoal => {
          const currentGoals = this.goals.getValue();
          const index = currentGoals.findIndex(g => g.id === updatedGoal.id);
          if (index !== -1) {
            currentGoals[index] = updatedGoal;
            this.goals.next([...currentGoals]);
          }
        }),
        catchError(this.handleError)
      );
  }

  deleteGoal(id: string): Observable<void> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/productbudgets/${id}`)
      .pipe(
        map(() => void 0),
        tap(() => {
          const currentGoals = this.goals.getValue();
          this.goals.next(currentGoals.filter(goal => goal.id !== id));
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Moves money from a wallet into a goal in a single server-side transaction.
   *
   * The previous implementation read the goal, added to `savedAmount` in the
   * browser and wrote the whole document back — a read-modify-write that loses
   * a concurrent contribution — while the caller separately debited the wallet.
   * Three round trips for one transfer, with no way to keep the two sides in
   * step if any of them failed. The server does both halves together now and
   * returns the amount it actually applied, which may be less than requested
   * when the goal needed less than was offered.
   */
  contribute(id: string, walletId: string, amount: number): Observable<ContributionResult> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http
      .post<ApiResponse<ApiContributionResult>>(
        `${this.apiUrl}/productbudgets/${id}/contribute`,
        { walletId, amount }
      )
      .pipe(
        map(response => {
          const { budget, appliedAmount, isFullyFunded, walletBalance } = response.data;
          return {
            goal: {
              id: budget._id,
              name: budget.name,
              imageUrl: budget.imageUrl,
              targetAmount: budget.targetAmount,
              savedAmount: budget.savedAmount,
              targetDate: new Date(budget.targetDate)
            },
            appliedAmount,
            isFullyFunded,
            walletBalance
          };
        }),
        tap(({ goal }) => {
          const currentGoals = this.goals.getValue();
          const index = currentGoals.findIndex(g => g.id === goal.id);
          if (index !== -1) {
            currentGoals[index] = goal;
            this.goals.next([...currentGoals]);
          }
        }),
        catchError(this.handleError)
      );
  }

  refreshGoals(): void {
    this.loadGoals();
  }

  bulkAddGoals(goals: Omit<ProductBudget, 'id'>[]): Observable<{
    successCount: number;
    failedCount: number;
    failedGoals?: { name: string; error: string }[];
  }> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }


    // Track successful and failed goals
    let successCount = 0;
    let failedCount = 0;
    const failedGoals: { name: string; error: string }[] = [];
    const successfulGoals: ProductBudget[] = [];

    // Create an observable that will emit the final result
    return new Observable(observer => {
      // Process each goal sequentially
      const processGoal = (index: number) => {
        if (index >= goals.length) {
          // All goals processed, update the local BehaviorSubject
          if (successfulGoals.length > 0) {
            const currentGoals = this.goals.getValue();
            this.goals.next([...currentGoals, ...successfulGoals]);
          }

          // Emit the final result
          observer.next({
            successCount,
            failedCount,
            failedGoals: failedGoals.length > 0 ? failedGoals : undefined
          });
          observer.complete();
          return;
        }

        // Process the current goal
        const goal = goals[index];
        this.http.post<ApiResponse<any>>(`${this.apiUrl}/productbudgets`, goal)
          .pipe(
            map(response => response.data),
            map(newGoal => ({
              id: newGoal._id,
              name: newGoal.name,
              imageUrl: newGoal.imageUrl,
              targetAmount: newGoal.targetAmount,
              savedAmount: newGoal.savedAmount,
              targetDate: new Date(newGoal.targetDate)
            })),
            catchError(error => {
              console.error(`Error adding goal '${goal.name}':`, error);
              failedCount++;
              failedGoals.push({
                name: goal.name,
                error: error.message || 'Unknown error'
              });
              return of(null);
            })
          )
          .subscribe({
            next: (newGoal) => {
              if (newGoal) {
                successCount++;
                successfulGoals.push(newGoal);
              }
              // Process the next goal
              processGoal(index + 1);
            },
            error: (error) => {
              console.error(`Unexpected error adding goal '${goal.name}':`, error);
              failedCount++;
              failedGoals.push({
                name: goal.name,
                error: error.message || 'Unknown error'
              });
              // Continue with the next goal despite the error
              processGoal(index + 1);
            }
          });
      };

      // Start processing the goals
      processGoal(0);
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Product Budget Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
