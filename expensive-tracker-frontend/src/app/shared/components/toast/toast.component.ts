import { Component, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import { NotificationService, NotificationKind } from '../../services/notification.service';

/**
 * Renders the toast stack. Mounted once at the app root.
 *
 * Screen readers need the container to exist before anything is put in it, so
 * the wrapper is always in the DOM and only its children come and go. Errors go
 * in an assertive region — a failed save shouldn't wait for the user to pause.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [FontAwesomeModule],
  template: `
    <div class="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end"
      role="region" aria-label="Notifications">
      @for (toast of notifications(); track toast.id) {
        <output
          class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ring-1 ring-black/5 motion-safe:animate-[toast-in_180ms_ease-out] dark:ring-white/10"
          [class]="shell(toast.kind)"
          [attr.aria-live]="toast.kind === 'error' ? 'assertive' : 'polite'">
          <fa-icon [icon]="icon(toast.kind)" [class]="accent(toast.kind)" class="mt-0.5 shrink-0"></fa-icon>
          <p class="flex-1 text-sm font-medium leading-snug">{{ toast.message }}</p>
          <button type="button"
            class="-m-1 shrink-0 rounded p-1 opacity-60 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            [attr.aria-label]="'Dismiss notification: ' + toast.message"
            (click)="dismiss(toast.id)">
            <fa-icon [icon]="faXmark"></fa-icon>
          </button>
        </output>
      }
    </div>
  `,
  styles: [`
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(-0.5rem); }
      to   { opacity: 1; transform: none; }
    }
  `]
})
export class ToastComponent {
  private readonly service = inject(NotificationService);

  readonly notifications = this.service.notifications;
  readonly faXmark = faXmark;

  private readonly icons = {
    success: faCircleCheck,
    error: faCircleExclamation,
    info: faCircleInfo
  };

  private readonly shells: Record<NotificationKind, string> = {
    success: 'bg-white text-gray-900 border-green-200 dark:bg-gray-800 dark:text-gray-100 dark:border-green-900/50',
    error: 'bg-white text-gray-900 border-red-200 dark:bg-gray-800 dark:text-gray-100 dark:border-red-900/50',
    info: 'bg-white text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
  };

  private readonly accents: Record<NotificationKind, string> = {
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-brand-500 dark:text-brand-400'
  };

  icon(kind: NotificationKind) {
    return this.icons[kind];
  }

  shell(kind: NotificationKind): string {
    return this.shells[kind];
  }

  accent(kind: NotificationKind): string {
    return this.accents[kind];
  }

  dismiss(id: number): void {
    this.service.dismiss(id);
  }
}
