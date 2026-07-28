import { Component } from '@angular/core';
import { Currency, SettingsService } from '../../../../services/settings.service';

import { FormsModule } from '@angular/forms';
import { CurrencyService } from '../../../../core/services/currency.service';

@Component({
  selector: 'app-currency',
  imports: [FormsModule],
  templateUrl: './currency.component.html',
})
export class CurrencyComponent {

  selectedCurrency: string = 'LKR'; // Default currency
  currencies: Currency[] = [];

  constructor(
    private settingsService: SettingsService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.loadCurrencies();
    this.selectedCurrency = this.currencyService.getActiveCurrency();
  }



  loadCurrencies(): void {
    this.settingsService.getCurrencies().subscribe({
      next: (currencies) => {
        this.currencies = currencies;
      },
      error: (error) => {
        console.error('Error loading currencies:', error);
      }
    });
  }

  onCurrencyChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newCurrency = select.value;
    this.currencyService.setCurrency(newCurrency);
    this.selectedCurrency = newCurrency;
    alert('Currency updated successfully');
  }

}
