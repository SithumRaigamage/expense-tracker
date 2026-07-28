import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private apiUrl = `${environment.apiUrl}/currency`;
  private userUrl = `${environment.apiUrl}/users`;

  private activeCurrencySubject = new BehaviorSubject<string>('LKR');
  public activeCurrency$ = this.activeCurrencySubject.asObservable();

  private ratesSubject = new BehaviorSubject<Record<string, number> | null>(null);
  public rates$ = this.ratesSubject.asObservable();

  // Supported currencies list
  // TODO: Fetch this from backend /supported endpoint for consistency
  public supportedCurrencies: string[] = ['USD', 'LKR', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];

  constructor(private http: HttpClient) {
    this.loadSavedCurrency();
    this.loadRates();
  }

  private loadSavedCurrency() {
    const saved = localStorage.getItem('preferred_currency');
    if (saved && this.supportedCurrencies.includes(saved)) {
      this.activeCurrencySubject.next(saved);
    }
  }

  loadRates() {
    this.http.get<any>(`${this.apiUrl}/rates`).subscribe({
      next: (response) => {
        if (response.success) {
          this.ratesSubject.next(response.data);
        }
      },
      error: (err) => console.error('Failed to load exchange rates', err)
    });
  }

  setCurrency(currency: string, updateBackend = true) {
    if (!this.supportedCurrencies.includes(currency)) return;

    this.activeCurrencySubject.next(currency);
    localStorage.setItem('preferred_currency', currency);

    if (updateBackend) {
      // Optimistically update backend, ignore errors (e.g. if not logged in)
      this.http.put(`${this.userUrl}/profile`, { currency }).subscribe({
        error: () => { /* User might not be logged in, ignore */ }
      });
    }
  }

  getActiveCurrency(): string {
    return this.activeCurrencySubject.value;
  }

  getRates(): Record<string, number> | null {
    return this.ratesSubject.value;
  }

  convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (!amount) return 0;
    if (fromCurrency === toCurrency) return amount;
    
    const rates = this.getRates();
    if (!rates) return amount; // Fallback if rates not loaded

    // Rates are based on USD (USD = 1)
    // Formula: (Amount / Rate[From]) * Rate[To]
    const rateFrom = rates[fromCurrency] || 1;
    const rateTo = rates[toCurrency] || 1;

    return (amount / rateFrom) * rateTo;
  }
}
