export interface Wallet {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'savings' | 'crypto' | 'investment' | 'loan';
  balance: number;
  currency: string;
}
