import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { ProductBudget } from '../core/models/ProductBudget';
import { AuthService } from './auth.service';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductbudgetService {
  private apiUrl = 'http://localhost:3001/api/v1';
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
    console.log('Loading product budget goals...');

    this.http.get<ApiResponse<ProductBudget[]>>(`${this.apiUrl}/productbudgets`)
      .pipe(
        map(response => response.data),
        map(goals => this.mapApiGoalsToProductBudgets(goals)),
        catchError(this.handleError)
      )
      .subscribe({
        next: (goals) => {
          console.log('Product budget goals loaded:', goals);
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

  addMoney(id: string, amount: number): Observable<ProductBudget> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Get the current saved amount first
    return this.http.get<ApiResponse<ProductBudget>>(`${this.apiUrl}/productbudgets/${id}`)
      .pipe(
        map(response => response.data),
        switchMap((goal: any) => {
          // Calculate the new total amount
          const currentAmount = goal.savedAmount || 0;
          const newAmount = currentAmount + amount;

          // Update the entire goal using PUT instead of PATCH (which might be having issues)
          return this.http.put<ApiResponse<ProductBudget>>(`${this.apiUrl}/productbudgets/${id}`, {
            savedAmount: newAmount,
            name: goal.name,
            imageUrl: goal.imageUrl,
            targetAmount: goal.targetAmount,
            targetDate: goal.targetDate
          });
        }),
        map((response: ApiResponse<any>) => response.data),
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

    console.log('Bulk adding goals:', goals);

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
