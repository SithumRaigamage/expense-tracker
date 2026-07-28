import { Component, OnInit, inject } from '@angular/core';
import { Currency, SettingsService } from '../../../../services/settings.service';

import { FormsModule } from '@angular/forms';
import { CurrencyService } from '../../../../core/services/currency.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-currency',
  imports: [FormsModule],
  templateUrl: './currency.component.html',
})
export class CurrencyComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private currencyService = inject(CurrencyService);
  private readonly notifications = inject(NotificationService);


  selectedCurrency = 'LKR'; // Default currency
  currencies: Currency[] = [];

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
    this.notifications.success(`Amounts now shown in ${newCurrency}.`);
  }

}
