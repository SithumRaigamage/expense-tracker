import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError, map } from 'rxjs';
import { TokenService } from '../core/services/token.service';
import { environment } from '../../environments/environment';

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
  private apiUrl = `${environment.apiUrl}/users`;
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
    const hasSession = this.tokenService.hasSession();
    const userData = this.getUserFromStorage();

    // The cookie itself is unreadable from here, so the cached user plus the
    // session flag are the optimistic starting state; /verify settles it.
    if (!hasSession) {
      return;
    }

    // Show the cached user straight away so the shell doesn't flash empty, then
    // let the server have the final word. (The two branches this replaced —
    // "session and user" versus "session only" — ran identical bodies.)
    if (userData) {
      this.currentUserSubject.next(userData);
    }

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

  register(userData: { name: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, userData)
      .pipe(
        map(response => response.data),
        tap(data => {
          this.tokenService.markSignedIn();
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
          this.tokenService.markSignedIn();
          this.saveUserToStorage(data.user);
          this.currentUserSubject.next(data.user);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Ends the session. Only the server can delete an httpOnly cookie, so the
   * local clear-out is paired with a logout call; the local half runs either
   * way so a failed request can't strand the user in a signed-in-looking shell.
   */
  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession()
    });
  }

  private clearSession(): void {
    this.tokenService.markSignedOut();
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
    return this.tokenService.hasSession();
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
