import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CurrencyService } from '../../core/services/currency.service';

@Pipe({
  name: 'appCurrency',
  standalone: true,
  pure: false // Impure to detect service state changes
})
export class AppCurrencyPipe implements PipeTransform {
  private currencyService = inject(CurrencyService);

  private currencyPipe = new CurrencyPipe('en-US');
  
  // Memoization cache
  private lastValue: number | undefined;
  private lastSource: string | undefined;
  private lastTarget: string | undefined;
  private lastRates: Record<string, number> | null = null;
  private lastOutput: string | null = null;

  /**
   * Swap the leading ASCII hyphen-minus for a real minus sign (U+2212).
   *
   * CSS treats a hyphen as a line-break opportunity, so "-LKR15,000.00" in a
   * narrow card could break straight after the sign and leave the minus stranded
   * on its own line above the amount — which reads as a bullet, not a negative.
   * U+2212 is not a break opportunity, and is the correct character for a
   * negative number anyway. There is nothing else in a formatted amount that can
   * break, so this alone keeps every balance on one line.
   */
  private static withRealMinus(formatted: string): string {
    return formatted.startsWith('-') ? `−${formatted.slice(1)}` : formatted;
  }

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
      
      const formatted = this.currencyPipe.transform(
        converted,
        targetCurrency,
        'symbol',
        '1.2-2'
      );

      this.lastOutput = formatted === null ? null : AppCurrencyPipe.withRealMinus(formatted);

      // Update cache
      this.lastValue = value;
      this.lastSource = sourceCurrency;
      this.lastTarget = targetCurrency;
      this.lastRates = rates;
    }

    return this.lastOutput;
  }
}
