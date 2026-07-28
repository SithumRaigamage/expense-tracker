import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AppCurrencyPipe } from './app-currency.pipe';
import { CurrencyService } from '../../core/services/currency.service';

describe('AppCurrencyPipe', () => {
  let pipe: AppCurrencyPipe;
  let currencyService: CurrencyService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [AppCurrencyPipe, provideHttpClient(), provideHttpClientTesting()]
    });

    currencyService = TestBed.inject(CurrencyService);
    pipe = TestBed.inject(AppCurrencyPipe);
  });

  afterEach(() => localStorage.clear());

  it('formats a positive amount in the active currency', () => {
    expect(pipe.transform(15720)).toBe('LKR15,720.00');
  });

  it('passes null and undefined straight through', () => {
    expect(pipe.transform(null as unknown as number)).toBeNull();
    expect(pipe.transform(undefined as unknown as number)).toBeNull();
  });

  it('formats zero rather than treating it as missing', () => {
    expect(pipe.transform(0)).toBe('LKR0.00');
  });

  describe('negative amounts', () => {
    it('uses a real minus sign, not an ASCII hyphen', () => {
      const output = pipe.transform(-15000);

      // A hyphen is a CSS line-break opportunity, so it lets a narrow card break
      // between the sign and the digits.
      expect(output).toBe('−LKR15,000.00');
      expect(output).not.toContain('-');
    });

    it('leaves the rest of the formatting alone', () => {
      expect(pipe.transform(-1234.5)).toBe('−LKR1,234.50');
    });

    it('has no break opportunity anywhere in the output', () => {
      const output = pipe.transform(-1234567.89) ?? '';

      expect(output).not.toMatch(/[-\s]/);
    });
  });

  it('recomputes when the active currency changes', () => {
    const before = pipe.transform(100);

    currencyService.setCurrency('USD', false);
    const after = pipe.transform(100);

    expect(before).not.toBe(after);
    expect(after).toContain('$');
  });
});
