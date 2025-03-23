import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Bill } from '../models/Bill';

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
      reminderSet: true
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
      reminderSet: true
    },
    {
      id: '3',
      name: 'Voice Plan',
      category: 'Subscription',
      amount:200.00,
      dueDate: new Date('2024-03-25'),
      status: 'Upcoming',
      iconUrl: 'assets/images/upcoming_bills/dialog_logo.png',
      provider: 'Dialog',
      reminderSet: true
    }
  ]);

  bills$ = this.bills.asObservable();

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
}
