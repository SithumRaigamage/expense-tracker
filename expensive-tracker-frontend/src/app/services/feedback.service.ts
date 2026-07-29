import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { toUserMessage } from '../core/utils/http-error';

export interface FeedbackSubmission {
  category: string;
  title: string;
  description: string;
  sentiment: number;
  rating?: number;
  deviceInfo?: string;
}

export interface Feedback extends FeedbackSubmission {
  _id: string;
  status: 'new' | 'triaged' | 'resolved';
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Sends feedback to the API.
 *
 * The form previously logged its payload to the console and cleared itself, so
 * every bug report and feature request a user wrote was discarded on submit.
 */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/feedback`;

  submit(feedback: FeedbackSubmission): Observable<Feedback> {
    return this.http.post<ApiResponse<Feedback>>(this.apiUrl, feedback).pipe(
      map(res => res.data),
      catchError(error =>
        throwError(() => new Error(toUserMessage(error, 'Could not send your feedback.')))
      )
    );
  }

  /** Everything this user has sent, newest first. */
  mine(): Observable<Feedback[]> {
    return this.http.get<ApiResponse<Feedback[]>>(this.apiUrl).pipe(
      map(res => res.data),
      catchError(error =>
        throwError(() => new Error(toUserMessage(error, 'Could not load your feedback.')))
      )
    );
  }
}
