import { Component } from '@angular/core';
import { Currency, SettingsService } from '../../../../services/settings.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-currency',
  imports: [CommonModule, FormsModule],
  templateUrl: './currency.component.html',
})
export class CurrencyComponent {

  selectedCurrency: string = 'LKR'; // Default currency
  currencies: Currency[] = [];

  ngOnInit(): void {
    this.loadCurrencies();
  }

  constructor(private settingsService: SettingsService) {}



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
    this.settingsService.updateCurrency(select.value).subscribe({
      next: () => {
        this.selectedCurrency = select.value;
        alert('Currency updated successfully');
      },
      error: (error) => {
        console.error('Error updating currency:', error);
        alert('Failed to update currency');
      }
    });
  }

}
