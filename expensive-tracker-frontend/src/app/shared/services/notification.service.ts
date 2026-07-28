import { Injectable, signal } from '@angular/core';

export type NotificationKind = 'success' | 'error' | 'info';

export interface Notification {
  id: number;
  kind: NotificationKind;
  message: string;
}

/** How long each kind stays up. Errors linger — they're worth reading twice. */
const DISMISS_AFTER: Record<NotificationKind, number> = {
  success: 4000,
  info: 5000,
  error: 8000
};

/**
 * Queue behind the toast stack.
 *
 * Feedback was delivered with `window.alert` in 37 places, which blocks the
 * whole page until it's dismissed, can't be styled, and reads as a browser
 * warning rather than the app confirming an action. Toasts say the same things
 * without stealing focus.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  /** Read by the toast component; a signal so the view updates without zone churn. */
  readonly notifications = signal<Notification[]>([]);

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  info(message: string): void {
    this.push('info', message);
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.notifications.update(list => list.filter(n => n.id !== id));
  }

  /** Clears everything — used on logout so one user's messages don't outlive them. */
  clear(): void {
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.notifications.set([]);
  }

  private push(kind: NotificationKind, message: string): void {
    const text = (message || '').trim();
    if (!text) {
      return;
    }

    const id = this.nextId++;
    this.notifications.update(list => [...list, { id, kind, message: text }]);
    this.timers.set(id, setTimeout(() => this.dismiss(id), DISMISS_AFTER[kind]));
  }
}
