import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CurrencyService } from '../../core/services/currency.service';

@Pipe({
  name: 'appCurrency',
  standalone: true,
  pure: false // Impure to detect service state changes
})
export class AppCurrencyPipe implements PipeTransform {
  private currencyPipe = new CurrencyPipe('en-US');
  
  // Memoization cache
  private lastValue: number | undefined;
  private lastSource: string | undefined;
  private lastTarget: string | undefined;
  private lastRates: any;
  private lastOutput: string | null = null;

  constructor(private currencyService: CurrencyService) {}

  transform(value: number, sourceCurrency = 'LKR'): string | null {
    if (value === null || value === undefined) return null;

    const targetCurrency = this.currencyService.getActiveCurrency();
    const rates = this.currencyService.getRates();

    // Check if re-computation is needed
    if (
      value !== this.lastValue || 
      sourceCurrency !== this.lastSource || 
      targetCurrency !== this.lastTarget || 
      rates !== this.lastRates
    ) {
      const converted = this.currencyService.convert(value, sourceCurrency, targetCurrency);
      
      this.lastOutput = this.currencyPipe.transform(
        converted, 
        targetCurrency, 
        'symbol', 
        '1.2-2'
      );

      // Update cache
      this.lastValue = value;
      this.lastSource = sourceCurrency;
      this.lastTarget = targetCurrency;
      this.lastRates = rates;
    }

    return this.lastOutput;
  }
}
