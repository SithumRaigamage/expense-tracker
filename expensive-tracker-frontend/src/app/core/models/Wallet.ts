export interface Wallet {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'savings' | 'credit' | 'crypto' | 'investment' | 'loan' | 'emergencyfund';
  balance: number;
  currency: string;
  convertedBalance?: number;
  /**
   * Returned by the API but not consumed anywhere. Display currency comes from
   * CurrencyService.getActiveCurrency() via the appCurrency pipe, which treats
   * stored LKR totals as its base. Two dead reads of this field were removed;
   * wire it to something or drop it from the API rather than reading it again.
   */
  primaryCurrency?: string;
  paymentMethod?: string;
  user?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
