import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of, catchError, map } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../services/token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private router = inject(Router);


  canActivate(): Observable<boolean> | boolean {
    // If no token exists, redirect to login immediately
    if (!this.tokenService.hasSession()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Check if we already have a user in the service (from local storage)
    if (this.authService.getCurrentUser()) {
      // We already have a user, allow access but verify in the background
      this.verifyTokenInBackground();
      return true;
    }

    // If we have a token but no user, verify the token and wait for the result
    return this.authService.verifyToken().pipe(
      map(response => {
        if (response.success) {
          return true;
        } else {
          this.router.navigate(['/login']);
          return false;
        }
      }),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }

  private verifyTokenInBackground(): void {
    this.authService.verifyToken().pipe(
      catchError(() => {
        this.authService.logout();
        return of(null);
      })
    ).subscribe();
  }
}
