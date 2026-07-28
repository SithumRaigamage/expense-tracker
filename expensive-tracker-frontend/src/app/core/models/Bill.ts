export type BillStatus = 'Upcoming' | 'Due Today' | 'Overdue' | 'Paid';

export interface Bill {
  id: string;
  name: string;
  provider: string;
  category: string;
  amount: number;
  dueDate: Date;
  /** Derived server-side from dueDate and payment state — never sent on write. */
  status: BillStatus;
  iconUrl: string;
  isSubscription: boolean;
  reminderSet?: boolean;
  /** The wallet a payment is drawn from. Replaced the old `deductFrom` field,
   *  which named a wallet *type* and so couldn't point at a specific account. */
  selectedWalletId?: string;
  lastPaidDate?: Date;
}

/**
 * A settled bill payment. Payments are written as ordinary expenses now, so
 * this is what the export layer reads rather than a separate collection.
 */
export interface BillTransaction {
  id: string;
  billId: string;
  amount: number;
  paidDate: Date;
  walletId: string;
  billName: string;
  provider: string;
}
