export interface Wallet {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'savings' | 'credit' | 'crypto' | 'investment' | 'loan' | 'emergencyfund';
  balance: number;
  currency: string;
  paymentMethod?: string;
  user?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
