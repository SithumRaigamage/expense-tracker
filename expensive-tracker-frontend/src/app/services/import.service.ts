import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ReceiptSuggestion {
  title: string | null;
  amount: number | null;
  date: string | null;
  merchant: string | null;
  category: string | null;      // category _id, if matched
  categoryName: string | null;
}

export interface ReceiptScanResult {
  receipt: string;              // stored image URL
  ocrConfigured: boolean;
  suggestion: ReceiptSuggestion;
  rawText: string;
}

export interface ImportResultRow {
  description: string;
  amount: number;
  direction: 'debit' | 'credit';
  date: string | null;
  category: string | null;
  status: 'created' | 'duplicate' | 'unmatched' | 'preview' | 'error';
  error?: string;
}

export interface ImportSummary {
  total: number;
  created: number;
  duplicates: number;
  unmatched: number;
  dryRun: boolean;
  results: ImportResultRow[];
}

export interface ImportOptions {
  walletId?: string;
  defaultCategoryId?: string;
  dryRun?: boolean;
}

/**
 * Talks to the automation endpoints: receipt OCR scanning and bank/SMS import.
 * The auth interceptor attaches the JWT to every request.
 */
@Injectable({ providedIn: 'root' })
export class ImportService {
  private http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl;

  /** Upload a receipt image and get back pre-filled expense fields. */
  scanReceipt(file: File): Observable<ReceiptScanResult> {
    const form = new FormData();
    form.append('receipt', file);
    return this.http
      .post<ApiResponse<ReceiptScanResult>>(`${this.apiUrl}/expenses/receipt/scan`, form)
      .pipe(map((r) => r.data), catchError(this.handleError));
  }

  /** Import a bank statement uploaded as a .csv file. */
  importBankFile(file: File, options: ImportOptions = {}): Observable<ImportSummary> {
    const form = new FormData();
    form.append('file', file);
    this.appendOptions(form, options);
    return this.http
      .post<ApiResponse<ImportSummary>>(`${this.apiUrl}/imports/bank`, form)
      .pipe(map((r) => r.data), catchError(this.handleError));
  }

  /** Import a bank statement pasted as CSV text. */
  importBankText(csv: string, options: ImportOptions = {}): Observable<ImportSummary> {
    return this.http
      .post<ApiResponse<ImportSummary>>(`${this.apiUrl}/imports/bank`, { csv, ...options })
      .pipe(map((r) => r.data), catchError(this.handleError));
  }

  /** Import transactions from pasted bank SMS alerts (one per line). */
  importSms(messages: string[], options: ImportOptions = {}): Observable<ImportSummary> {
    return this.http
      .post<ApiResponse<ImportSummary>>(`${this.apiUrl}/imports/sms`, { messages, ...options })
      .pipe(map((r) => r.data), catchError(this.handleError));
  }

  private appendOptions(form: FormData, options: ImportOptions): void {
    if (options.walletId) form.append('walletId', options.walletId);
    if (options.defaultCategoryId) form.append('defaultCategoryId', options.defaultCategoryId);
    if (options.dryRun !== undefined) form.append('dryRun', String(options.dryRun));
  }

  private handleError(error: HttpErrorResponse | Error): Observable<never> {
    const body = error instanceof HttpErrorResponse ? error.error : null;
    const message = body?.error || body?.message || error?.message || 'Import failed';
    return throwError(() => new Error(message));
  }
}
