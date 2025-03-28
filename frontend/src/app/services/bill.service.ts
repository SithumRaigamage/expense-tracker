import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Bill, BillTransaction } from '../models/Bill';
import { WalletService, WalletTransaction } from './wallet.service';

@Injectable({
  providedIn: 'root'
})
export class BillsService {
  private bills = new BehaviorSubject<Bill[]>([
    {
      id: '1',
      name: 'Mobile Data Plan',
      category: 'Subscription',
      amount: 2000.00,
      dueDate: new Date('2024-03-28'),
      status: 'Upcoming',
      iconUrl: 'assets/images/upcoming_bills/mobitel_logo.png',
      provider: 'Mobitel',
      reminderSet: true,
      isSubscription: true,
      deductFrom: 'bank',
      lastPaidDate: new Date('2024-02-28'),
      nextDueDate: new Date('2024-03-28')
    },
    {
      id: '2',
      name: 'Spotify Premium',
      category: 'Subscription',
      amount: 350.00,
      dueDate: new Date('2024-03-25'),
      status: 'Upcoming',
      iconUrl: 'assets/images/upcoming_bills/spotify_logo.png',
      provider: 'Spotify',
      reminderSet: true,
      isSubscription: true,
      deductFrom: 'bank',
      lastPaidDate: new Date('2024-02-25'),
      nextDueDate: new Date('2024-03-25')
    },
    {
      id: '3',
      name: 'Voice Plan',
      category: 'Subscription',
      amount: 200.00,
      dueDate: new Date('2024-03-25'),
      status: 'Upcoming',
      iconUrl: 'assets/images/upcoming_bills/dialog_logo.png',
      provider: 'Dialog',
      reminderSet: true,
      isSubscription: true,
      deductFrom: 'bank',
      lastPaidDate: new Date('2024-02-25'),
      nextDueDate: new Date('2024-03-25')
    }
  ]);

  private completedBills = new BehaviorSubject<BillTransaction[]>([
    {
      id: '1',
      billId: '1',
      amount: 2000.00,
      paidDate: new Date('2024-02-28'),
      walletId: '1', // assuming bank wallet id
      billName: 'Mobile Data Plan',
      provider: 'Mobitel'
    },
    {
      id: '2',
      billId: '2',
      amount: 350.00,
      paidDate: new Date('2024-02-25'),
      walletId: '1',
      billName: 'Spotify Premium',
      provider: 'Spotify'
    },
    {
      id: '3',
      billId: '3',
      amount: 200.00,
      paidDate: new Date('2024-02-25'),
      walletId: '1',
      billName: 'Voice Plan',
      provider: 'Dialog'
    }
  ]);

  // Rename completedBills to transactions
  private transactions = this.completedBills;

  // Update observables
  bills$ = this.bills.asObservable();
  transactions$ = this.transactions.asObservable();

  constructor(private walletService: WalletService) {
    // Instead of adding past bills to current bills,
    // add their transactions to completedBills
    const pastTransactions: BillTransaction[] = [
      {
        id: '4',
        billId: '4',
        amount: 2000.00,
        paidDate: new Date('2024-02-28'),
        walletId: '1',
        billName: 'Mobile Data Plan',
        provider: 'Mobitel'
      },
      {
        id: '5',
        billId: '5',
        amount: 350.00,
        paidDate: new Date('2024-02-25'),
        walletId: '1',
        billName: 'Spotify Premium',
        provider: 'Spotify'
      }
    ];

    // Add past transactions to completed bills
    this.transactions.next([
      ...this.transactions.getValue(),
      ...pastTransactions
    ]);

    // Check for due subscriptions daily
    this.checkSubscriptions();
    setInterval(() => this.checkSubscriptions(), 24 * 60 * 60 * 1000);
  }

  private checkSubscriptions(): void {
    const bills = this.bills.getValue();
    const today = new Date();

    bills.forEach(bill => {
      if (bill.isSubscription && bill.selectedWalletId) {
        const dueDate = new Date(bill.nextDueDate || bill.dueDate);

        if (dueDate <= today) {
          this.processSubscriptionPayment(bill);
        }
      }
    });
  }

  private getEmptyBill(): Partial<Bill> {
    return {
      name: '',
      category: '',
      amount: 0,
      dueDate: new Date(),
      provider: '',
      iconUrl: '',
      isSubscription: false,
      selectedWalletId: '',
      deductFrom: 'bank' // default value
    };
  }

  private processSubscriptionPayment(bill: Bill): void {
    if (!bill.selectedWalletId) {
      // Find an appropriate wallet based on deductFrom preference
      this.walletService.getAllWallets()
        .pipe(
          map(wallets => wallets.filter(w => w.type === bill.deductFrom))
        ).subscribe(availableWallets => {
          if (availableWallets.length > 0) {
            // Use the first available wallet of the preferred type
            bill.selectedWalletId = availableWallets[0].id;
            this.processPayment(bill);
          }
        });
    } else {
      this.processPayment(bill);
    }
  }

  // Update processPayment method to move paid bills to completed
  private processPayment(bill: Bill): void {
    const selectedWallet = this.walletService.getWalletById(bill.selectedWalletId!);

    if (!selectedWallet) return;

    // Get the wallet based on deductFrom preference
    this.walletService.getAllWallets()
        .pipe(
            map(wallets => wallets.find(w => w.type === bill.deductFrom))
        ).subscribe(wallet => {
            if (!wallet) {
                console.error('No suitable wallet found for deduction');
                return;
            }

            // Create wallet transaction for deduction
            const walletTransaction: WalletTransaction = {
                amount: -bill.amount, // Negative amount for deduction
                type: 'expense' as const,
                description: `${bill.name} - ${bill.isSubscription ? 'Subscription' : 'Bill'} Payment`,
                category: bill.category,
                date: new Date()
            };

            // Update wallet balance
            this.walletService.addTransaction(wallet.id, walletTransaction);

            // Create bill transaction record
            const billTransaction: BillTransaction = {
                id: Date.now().toString(),
                billId: bill.id,
                amount: bill.amount,
                paidDate: new Date(),
                walletId: wallet.id,
                billName: bill.name,
                provider: bill.provider
            };

            // Add to completed bills/transactions
            this.transactions.next([...this.transactions.getValue(), billTransaction]);

            // Update bill status and dates
            const nextDueDate = new Date(bill.nextDueDate || bill.dueDate);
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);

            this.updateBill(bill.id, {
                status: bill.isSubscription ? 'Upcoming' : 'Paid',
                lastPaidDate: new Date(),
                nextDueDate: bill.isSubscription ? nextDueDate : undefined,
                deductFrom: bill.deductFrom // Preserve deduction preference
            });
        });
}

  getBills(): Observable<Bill[]> {
    return this.bills$;
  }

  addBill(bill: Omit<Bill, 'id' | 'status'>): void {
    const newBill = {
      ...bill,
      id: Date.now().toString(),
      status: this.calculateStatus(bill.dueDate)
    };

    this.bills.next([...this.bills.getValue(), newBill]);
  }

  updateBill(id: string, updates: Partial<Bill>): void {
    const bills = this.bills.getValue();
    const index = bills.findIndex(b => b.id === id);

    if (index !== -1) {
      bills[index] = { ...bills[index], ...updates };
      this.bills.next([...bills]);
    }
  }

  deleteBill(id: string): void {
    const bills = this.bills.getValue();
    this.bills.next(bills.filter(b => b.id !== id));
  }

  private calculateStatus(dueDate: Date): Bill['status'] {
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due Today';
    return 'Upcoming';
  }

  getTransactions(): Observable<BillTransaction[]> {
    return this.transactions$;
  }

  // Add method to get paid bills
  getPaidBills(): Observable<Bill[]> {
    return this.bills$.pipe(
      map(bills => bills.filter(bill => bill.status === 'Paid'))
    );
  }

  // Add method to get bill history
  getBillHistory(): Observable<BillTransaction[]> {
    return this.transactions$.pipe(
      map(transactions =>
        transactions.sort((a, b) => b.paidDate.getTime() - a.paidDate.getTime())
      )
    );
  }

  // Add methods to get upcoming and completed bills
  getUpcomingBills(): Observable<Bill[]> {
    return this.bills$.pipe(
      map(bills => {
        const today = new Date();
        return bills.filter(bill => {
          const dueDate = new Date(bill.dueDate);
          return (
            (bill.status === 'Upcoming' ||
             bill.status === 'Due Today' ||
             bill.status === 'Overdue') &&
            dueDate >= today
          );
        });
      })
    );
  }

  getCompletedBills(): Observable<BillTransaction[]> {
    return this.transactions.asObservable();
  }
}
