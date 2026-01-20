export interface Transaction {
  id: string | number;
  date: Date;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  walletId: string;
  wallet?: {
    name: string;
    type: string;
  };
}
