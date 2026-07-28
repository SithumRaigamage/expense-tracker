import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { CurrencyService } from '../../../core/services/currency.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-currency-switcher',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="relative">
      <button
        (click)="toggleDropdown()"
        class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors">
        <fa-icon [icon]="faGlobe" class="text-gray-500 dark:text-gray-400"></fa-icon>
        <span>{{ (activeCurrency$ | async) }}</span>
      </button>
    
      <!-- Dropdown Menu -->
      @if (isOpen) {
        <div class="absolute right-0 z-50 mt-2 w-24 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:border-gray-700 max-h-60 overflow-y-auto">
          <div class="py-1">
            @for (currency of supportedCurrencies; track currency) {
              <button
                (click)="selectCurrency(currency)"
                class="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
                [class.bg-gray-50]="(activeCurrency$ | async) === currency"
                [class.dark:bg-gray-700]="(activeCurrency$ | async) === currency"
                [class.font-bold]="(activeCurrency$ | async) === currency">
                {{ currency }}
              </button>
            }
          </div>
        </div>
      }
    
      <!-- Overlay to close -->
      @if (isOpen) {
~~        <div aria-hidden="true" (click)="isOpen = false" class="fixed inset-0 z-40 bg-transparent cursor-default"></div>
      }
    </div>
    `
})
export class CurrencySwitcherComponent {
  isOpen = false;
  activeCurrency$: Observable<string>;
  supportedCurrencies: string[];
  faGlobe = faGlobe;

  constructor(private currencyService: CurrencyService) {
    this.activeCurrency$ = this.currencyService.activeCurrency$;
    this.supportedCurrencies = this.currencyService.supportedCurrencies;
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  selectCurrency(currency: string) {
    this.currencyService.setCurrency(currency);
    this.isOpen = false;
  }

  // The overlay closes the dropdown on click; Escape is its keyboard equivalent.
  @HostListener('document:keydown.escape')
  onEscape() {
    this.isOpen = false;
  }
}
