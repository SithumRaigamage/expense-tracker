import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CurrencyService } from './currency.service';
import { environment } from '../../../environments/environment';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/currency`;
  const userUrl = `${environment.apiUrl}/users`;
  const rates = { USD: 1, LKR: 300, EUR: 0.9 };

  const flushRates = () => {
    const req = httpMock.expectOne(`${apiUrl}/rates`);
    req.flush({ success: true, data: rates });
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(CurrencyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('defaults to LKR and fetches rates on construction', () => {
    expect(service.getActiveCurrency()).toBe('LKR');
    flushRates();
    expect(service.getRates()).toEqual(rates);
  });

  it('restores a previously saved currency from localStorage on construction', () => {
    flushRates(); // the `service` built in beforeEach also fires a /rates request
    localStorage.setItem('preferred_currency', 'EUR');

    const fresh = TestBed.runInInjectionContext(() => new CurrencyService());

    expect(fresh.getActiveCurrency()).toBe('EUR');
    flushRates();
  });

  it('ignores an unsupported saved currency and keeps the LKR default', () => {
    flushRates(); // the `service` built in beforeEach also fires a /rates request
    localStorage.setItem('preferred_currency', 'XXX');

    const fresh = TestBed.runInInjectionContext(() => new CurrencyService());

    expect(fresh.getActiveCurrency()).toBe('LKR');
    flushRates();
  });

  describe('setCurrency', () => {
    beforeEach(() => flushRates());

    it('updates the active currency, persists it, and emits on activeCurrency$', () => {
      let emitted: string | undefined;
      service.activeCurrency$.subscribe((c) => (emitted = c));

      service.setCurrency('EUR');

      expect(service.getActiveCurrency()).toBe('EUR');
      expect(emitted).toBe('EUR');
      expect(localStorage.getItem('preferred_currency')).toBe('EUR');

      const req = httpMock.expectOne(`${userUrl}/profile`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ currency: 'EUR' });
      req.flush({ success: true });
    });

    it('ignores unsupported currency codes entirely', () => {
      service.setCurrency('DOGE');

      expect(service.getActiveCurrency()).toBe('LKR');
      expect(localStorage.getItem('preferred_currency')).toBeNull();
      httpMock.expectNone(`${userUrl}/profile`);
    });

    it('does not fail when the backend profile update errors (e.g. logged out)', () => {
      service.setCurrency('EUR');

      const req = httpMock.expectOne(`${userUrl}/profile`);
      expect(() => req.flush('unauthorized', { status: 401, statusText: 'Unauthorized' })).not.toThrow();
      expect(service.getActiveCurrency()).toBe('EUR');
    });

    it('skips the backend call when updateBackend is false', () => {
      service.setCurrency('EUR', false);

      expect(service.getActiveCurrency()).toBe('EUR');
      httpMock.expectNone(`${userUrl}/profile`);
    });
  });

  describe('convert', () => {
    beforeEach(() => flushRates());

    it('returns 0 for a falsy amount', () => {
      expect(service.convert(0, 'USD', 'EUR')).toBe(0);
    });

    it('returns the same amount when converting between identical currencies', () => {
      expect(service.convert(100, 'USD', 'USD')).toBe(100);
    });

    it('converts using rates relative to USD', () => {
      // 100 USD -> LKR: (100 / 1) * 300 = 30000
      expect(service.convert(100, 'USD', 'LKR')).toBe(30000);
      // 300 LKR -> USD: (300 / 300) * 1 = 1
      expect(service.convert(300, 'LKR', 'USD')).toBe(1);
    });

    it('falls back to a 1:1 rate for a currency missing from the rates map', () => {
      expect(service.convert(50, 'USD', 'ZZZ')).toBe(50);
    });

    it('returns the original amount when rates have not loaded yet', () => {
      const fresh = TestBed.runInInjectionContext(() => new CurrencyService());
      httpMock.expectOne(`${apiUrl}/rates`); // leave unresolved

      expect(fresh.convert(75, 'USD', 'EUR')).toBe(75);
    });
  });

  it('logs and leaves rates null when the rates request fails', () => {
    spyOn(console, 'error');

    const req = httpMock.expectOne(`${apiUrl}/rates`);
    req.flush('boom', { status: 500, statusText: 'Server Error' });

    expect(service.getRates()).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });
});
