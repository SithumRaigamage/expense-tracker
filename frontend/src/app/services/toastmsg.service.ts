import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ToastMsg } from '../models/ToastMsg';

@Injectable({
  providedIn: 'root'
})
export class ToastmsgService {

  private toasts = new BehaviorSubject<ToastMsg[]>([]);
  toasts$ = this.toasts.asObservable();

  show(message: string, type: ToastMsg['type'] = 'info', duration: number = 3000) {
    const id = Date.now().toString();
    const toast: ToastMsg = { id, message, type, duration };

    this.toasts.next([...this.toasts.value, toast]);

    // Auto remove toast after duration
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  remove(id: string) {
    this.toasts.next(this.toasts.value.filter(t => t.id !== id));
  }
}
