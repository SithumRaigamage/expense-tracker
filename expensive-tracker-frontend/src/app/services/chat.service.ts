import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** Emitted as the reply arrives. */
export type ChatEvent =
  | { type: 'delta'; text: string }
  | { type: 'error'; message: string }
  | { type: 'done' };

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Talks to the backend chat proxy.
 *
 * The reply arrives as Server-Sent Events rather than one JSON body: composing
 * an answer takes seconds, and buffering it means the user watches a spinner
 * with no sign of progress.
 *
 * `fetch` rather than HttpClient because Angular's client buffers the whole
 * response before emitting — there is no way to read a stream as it arrives.
 * Credentials are opt-in here since the interceptor doesn't see fetch calls.
 */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/chat`;

  /** Whether the server has an API key configured; false hides the feature. */
  isAvailable(): Observable<boolean> {
    return this.http.get<ApiResponse<{ available: boolean }>>(`${this.apiUrl}/status`).pipe(
      map(res => res.data.available),
      catchError(() => of(false))
    );
  }

  async *send(messages: ChatTurn[], signal: AbortSignal): AsyncGenerator<ChatEvent> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal
    });

    if (!response.ok || !response.body) {
      let message = 'The assistant could not be reached.';
      try {
        const body = await response.json();
        message = body?.error || message;
      } catch {
        // Non-JSON error body — keep the default.
      }
      yield { type: 'error', message };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line. A chunk can split a frame in
      // half, so anything after the last separator stays buffered for next time.
      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';

      for (const frame of frames) {
        const event = /^event: (.+)$/m.exec(frame)?.[1];
        const raw = /^data: (.+)$/m.exec(frame)?.[1];
        if (!event || !raw) {
          continue;
        }

        const payload = JSON.parse(raw);
        if (event === 'delta') {
          yield { type: 'delta', text: payload.text };
        } else if (event === 'error') {
          yield { type: 'error', message: payload.message };
        } else if (event === 'done') {
          yield { type: 'done' };
        }
      }
    }
  }
}
