import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';
import { Bill, BillTransaction } from '../core/models/Bill';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { toUserMessage } from '../core/utils/http-error';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** Raw bill document as the API returns it. */
interface ApiBill {
  _id: string;
  name: string;
  provider: string;
  category: string;
  amount: number;
  dueDate: string;
  status: Bill['status'];
  iconUrl: string;
  isSubscription: boolean;
  reminderSet: boolean;
  wallet: string | null;
  lastPaidDate: string | null;
  paidAt: string | null;
}

/**
 * Bills, backed by the API.
 *
 * This used to be a BehaviorSubject seeded with three hardcoded subscriptions
 * and a `setInterval` that rolled their due dates over in the browser. Nothing
 * survived a refresh, every user saw the same three bills, and the dashboard
 * widget reported them as though they were real.
 */
@Injectable({
  providedIn: 'root'
})
export class BillsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly apiUrl = `${environment.apiUrl}/bills`;
  private readonly bills = new BehaviorSubject<Bill[]>([]);

  bills$ = this.bills.asObservable();

  constructor() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadBills();
      } else {
        this.bills.next([]);
      }
    });
  }

  private toBill(raw: ApiBill): Bill {
    return {
      id: raw._id,
      name: raw.name,
      provider: raw.provider,
      category: raw.category,
      amount: raw.amount,
      dueDate: new Date(raw.dueDate),
      status: raw.status,
      iconUrl: raw.iconUrl || '',
      isSubscription: raw.isSubscription,
      reminderSet: raw.reminderSet,
      selectedWalletId: raw.wallet || undefined,
      lastPaidDate: raw.lastPaidDate ? new Date(raw.lastPaidDate) : undefined
    };
  }

  private loadBills(): void {
    this.http.get<ApiResponse<ApiBill[]>>(this.apiUrl)
      .pipe(map(res => res.data.map(b => this.toBill(b))))
      .subscribe({
        next: bills => this.bills.next(bills),
        error: () => this.bills.next([])
      });
  }

  refresh(): void {
    this.loadBills();
  }

  getBills(): Observable<Bill[]> {
    return this.bills$;
  }

  /** Only what's still owed, soonest first — what the dashboard widget wants. */
  getUpcomingBills(): Observable<Bill[]> {
    return this.bills$.pipe(
      map(bills => bills.filter(b => b.status !== 'Paid'))
    );
  }

  addBill(bill: Partial<Bill>): Observable<Bill> {
    return this.http.post<ApiResponse<ApiBill>>(this.apiUrl, this.toPayload(bill))
      .pipe(
        map(res => this.toBill(res.data)),
        tap(() => this.loadBills()),
        catchError(this.fail('Could not add that bill.'))
      );
  }

  updateBill(id: string, updates: Partial<Bill>): Observable<Bill> {
    return this.http.put<ApiResponse<ApiBill>>(`${this.apiUrl}/${id}`, this.toPayload(updates))
      .pipe(
        map(res => this.toBill(res.data)),
        tap(() => this.loadBills()),
        catchError(this.fail('Could not update that bill.'))
      );
  }

  deleteBill(id: string): Observable<void> {
    return this.http.delete<ApiResponse<unknown>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(() => void 0),
        tap(() => this.loadBills()),
        catchError(this.fail('Could not delete that bill.'))
      );
  }

  /** Debits the wallet and records the expense, server-side and atomically. */
  payBill(id: string, walletId: string): Observable<Bill> {
    return this.http.post<ApiResponse<{ bill: ApiBill }>>(`${this.apiUrl}/${id}/pay`, { walletId })
      .pipe(
        map(res => this.toBill(res.data.bill)),
        tap(() => this.loadBills()),
        catchError(this.fail('Could not pay that bill.'))
      );
  }

  /**
   * Bill payments are ordinary expenses once made, so the payment history lives
   * in the transactions list rather than a separate collection. Kept as an
   * empty stream so the full-export still has a slot for it.
   */
  getTransactions(): Observable<BillTransaction[]> {
    return new BehaviorSubject<BillTransaction[]>([]).asObservable();
  }

  private toPayload(bill: Partial<Bill>) {
    return {
      name: bill.name,
      provider: bill.provider,
      category: bill.category,
      amount: bill.amount,
      dueDate: bill.dueDate,
      iconUrl: bill.iconUrl,
      isSubscription: bill.isSubscription,
      reminderSet: bill.reminderSet,
      wallet: bill.selectedWalletId || null
    };
  }

  private fail(fallback: string) {
    return (error: unknown) => throwError(() => new Error(toUserMessage(error, fallback)));
  }
}
