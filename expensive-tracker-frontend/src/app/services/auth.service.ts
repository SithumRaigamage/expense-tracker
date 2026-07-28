import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError, map } from 'rxjs';
import { TokenService } from '../core/services/token.service';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
  avatar?: string;
  isActive: boolean;
  lastLogin: Date;
  role?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3001/api/v1/users';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private tokenService: TokenService
  ) {
    this.checkToken();
  }

  private checkToken(): void {
    const token = this.tokenService.getToken();
    const userData = this.getUserFromStorage();

    // If we have both token and user data in localStorage, initialize auth state
    if (token && userData) {
      this.currentUserSubject.next(userData);

      // Verify token in the background to ensure it's still valid
      this.verifyToken().subscribe({
        next: (response) => {
          if (response.success) {
            this.currentUserSubject.next(response.data.user);
            // Update stored user data if needed
            this.saveUserToStorage(response.data.user);
          } else {
            this.logout();
          }
        },
        error: () => {
          this.logout();
        }
      });
    } else if (token) {
      // If we have only token but no user data, try to get user data
      this.verifyToken().subscribe({
        next: (response) => {
          if (response.success) {
            this.currentUserSubject.next(response.data.user);
            this.saveUserToStorage(response.data.user);
          } else {
            this.logout();
          }
        },
        error: () => {
          this.logout();
        }
      });
    }
  }  register(userData: { name: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, userData)
      .pipe(
        map(response => response.data),
        tap(data => {
          this.tokenService.saveToken(data.token);
          this.saveUserToStorage(data.user);
          this.currentUserSubject.next(data.user);
        }),
        catchError(this.handleError)
      );
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, credentials)
      .pipe(
        map(response => response.data),
        tap(data => {
          this.tokenService.saveToken(data.token);
          this.saveUserToStorage(data.user);
          this.currentUserSubject.next(data.user);
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    this.tokenService.removeToken();
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  verifyToken(): Observable<ApiResponse<{ user: User; valid: boolean }>> {
    return this.http.get<ApiResponse<{ user: User; valid: boolean }>>(`${this.apiUrl}/verify`)
      .pipe(
        tap(response => {
          if (response.success) {
            this.currentUserSubject.next(response.data.user);
            this.saveUserToStorage(response.data.user);
          }
        }),
        catchError(error => {
          // If there's an error verifying the token, we should clear the auth state
          this.logout();
          return throwError(() => error);
        })
      );
  }

  getToken(): string | null {
    return this.tokenService.getToken();
  }

  private saveUserToStorage(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  private getUserFromStorage(): User | null {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {
        return null;
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    const token = this.tokenService.getToken();
    return !!token;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const currentUser = this.getCurrentUser();
    return !!(currentUser && currentUser.role === 'admin');
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
