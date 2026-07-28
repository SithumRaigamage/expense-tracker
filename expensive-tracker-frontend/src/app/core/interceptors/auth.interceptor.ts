import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TokenService } from '../services/token.service';

/**
 * Endpoints where a 401 means "these credentials are wrong", not "your session
 * expired". Redirecting on these would sign a user out for mistyping their
 * current password, or bounce a failed login away from its own error message.
 */
const CREDENTIAL_ENDPOINTS = [
  '/users/login',
  '/users/register',
  '/users/change-password',
  '/users/change-email'
];

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private tokenService: TokenService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // The session token is an httpOnly cookie: there is nothing to attach by
    // hand, the browser just needs permission to send it.
    const authReq = req.clone({ withCredentials: true });

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // A rejected token used to be handled ad-hoc in each service, which only
        // ever produced a "please login again" message: the user was left on a
        // dashboard of failed widgets with no way back. Recover centrally.
        if (error.status === 401 && !this.isCredentialCheck(req.url)) {
          this.endSession();
        }
        return throwError(() => error);
      })
    );
  }

  private isCredentialCheck(url: string): boolean {
    return CREDENTIAL_ENDPOINTS.some(endpoint => url.includes(endpoint));
  }

  private endSession(): void {
    // Same keys AuthService clears. The cookie is the server's to delete; a
    // rejected one is already useless, so dropping the local state is enough.
    this.tokenService.markSignedOut();
    localStorage.removeItem('user');

    // Already heading to login (e.g. several widgets 401 at once) — don't stack
    // navigations or overwrite the originally requested page.
    if (this.router.url.startsWith('/login')) {
      return;
    }

    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url, sessionExpired: true }
    });
  }
}
