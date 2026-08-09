import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';
import { TokenService } from '../core/services/token.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tokenService: TokenService;
  let router: { navigate: jasmine.Spy };

  const apiUrl = `${environment.apiUrl}/users`;
  const user = {
    id: '1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    currency: 'USD',
    isActive: true,
    lastLogin: new Date(),
    role: 'user'
  };

  beforeEach(() => {
    localStorage.clear();
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router }
      ]
    });

    tokenService = TestBed.inject(TokenService);
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created with no current user when there is no prior session', () => {
    expect(service).toBeTruthy();
    expect(service.getCurrentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  describe('login', () => {
    it('marks the session as signed in, caches the user and emits it on currentUser$', () => {
      let emitted: unknown;
      service.currentUser$.subscribe((u) => (emitted = u));

      service.login({ email: user.email, password: 'secret123' }).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: { user, token: 'ignored-token' } });

      expect(tokenService.hasSession()).toBeTrue();
      expect(service.getCurrentUser()).toEqual(user);
      expect(emitted).toEqual(user);
      expect(JSON.parse(localStorage.getItem('user') || 'null')).toEqual(
        jasmine.objectContaining({ id: user.id, email: user.email })
      );
    });

    it('surfaces the server error message and leaves the session unset', () => {
      let error: Error | undefined;

      service.login({ email: user.email, password: 'wrong' }).subscribe({
        error: (err) => (error = err)
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({ success: false, error: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

      expect(error?.message).toBe('Invalid credentials');
      expect(tokenService.hasSession()).toBeFalse();
      expect(service.getCurrentUser()).toBeNull();
    });
  });

  describe('register', () => {
    it('marks the session as signed in and emits the new user', () => {
      service.register({ name: user.name, email: user.email, password: 'secret123' }).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/register`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: { user, token: 'ignored-token' } });

      expect(tokenService.hasSession()).toBeTrue();
      expect(service.getCurrentUser()).toEqual(user);
    });
  });

  describe('logout', () => {
    it('clears the session and redirects to /login when the server call succeeds', () => {
      tokenService.markSignedIn();

      service.logout();

      const req = httpMock.expectOne(`${apiUrl}/logout`);
      req.flush({ success: true });

      expect(tokenService.hasSession()).toBeFalse();
      expect(service.getCurrentUser()).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('still clears the local session when the server call fails', () => {
      tokenService.markSignedIn();

      service.logout();

      const req = httpMock.expectOne(`${apiUrl}/logout`);
      req.flush('unreachable', { status: 500, statusText: 'Server Error' });

      expect(tokenService.hasSession()).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('verifyToken', () => {
    it('refreshes the cached user on success', () => {
      const refreshed = { ...user, name: 'Ada, Countess' };

      service.verifyToken().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/verify`);
      req.flush({ success: true, data: { user: refreshed, valid: true } });

      expect(service.getCurrentUser()).toEqual(refreshed);
    });

    it('logs the session out when verification errors', () => {
      tokenService.markSignedIn();

      service.verifyToken().subscribe({ error: () => undefined });

      const req = httpMock.expectOne(`${apiUrl}/verify`);
      req.flush('expired', { status: 401, statusText: 'Unauthorized' });

      const logoutReq = httpMock.expectOne(`${apiUrl}/logout`);
      logoutReq.flush({ success: true });

      expect(tokenService.hasSession()).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('isAdmin', () => {
    it('is false with no current user', () => {
      expect(service.isAdmin()).toBeFalse();
    });

    it('is true only when the current user has the admin role', () => {
      service.login({ email: user.email, password: 'secret123' }).subscribe();
      httpMock.expectOne(`${apiUrl}/login`).flush({
        success: true,
        data: { user: { ...user, role: 'admin' }, token: 'ignored-token' }
      });

      expect(service.isAdmin()).toBeTrue();
    });
  });

  describe('construction with a pre-existing session', () => {
    it('optimistically emits the cached user, then reconciles with /verify', () => {
      tokenService.markSignedIn();
      localStorage.setItem('user', JSON.stringify(user));

      // Re-create the service so its constructor runs against the seeded storage.
      const freshService = TestBed.runInInjectionContext(() => new AuthService());

      expect(freshService.getCurrentUser()).toEqual(
        jasmine.objectContaining({ id: user.id, email: user.email })
      );

      const req = httpMock.expectOne(`${apiUrl}/verify`);
      req.flush({ success: true, data: { user, valid: true } });
    });

    it('does nothing when there is no session flag, even with stale cached user data', () => {
      localStorage.setItem('user', JSON.stringify(user));

      const freshService = TestBed.runInInjectionContext(() => new AuthService());

      expect(freshService.getCurrentUser()).toBeNull();
      httpMock.expectNone(`${apiUrl}/verify`);
    });
  });
});
