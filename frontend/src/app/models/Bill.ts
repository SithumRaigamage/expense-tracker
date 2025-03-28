export interface Bill {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDate: Date;
  status: 'Upcoming' | 'Due Today' | 'Overdue' | 'Paid';
  iconUrl: string;
  provider: string;
  reminderSet?: boolean;
  isSubscription: boolean;
  selectedWalletId?: string;
  lastPaidDate?: Date;
  nextDueDate?: Date;
  deductFrom: 'cash' | 'bank';
}

export interface BillTransaction {
  id: string;
  billId: string;
  amount: number;
  paidDate: Date;
  walletId: string;
  billName: string;
  provider: string;
}
