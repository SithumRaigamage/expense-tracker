import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, interval } from 'rxjs';

/** How often to ask the server whether a newer build has shipped. */
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

/**
 * Prompts the user when a newer build is available.
 *
 * A service worker serves the version it cached, so without this an installed
 * app can sit on an old build indefinitely — the user has no browser refresh
 * button to reach for once it is running in a standalone window.
 *
 * Deliberately a prompt rather than an automatic reload: this app is full of
 * forms, and swapping the page out from under someone mid-entry would lose
 * whatever they had typed.
 */
@Component({
  selector: 'app-update-prompt',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (updateReady()) {
      <div
        role="status"
        class="glass fixed bottom-6 left-1/2 z-[99999] flex -translate-x-1/2 items-center gap-3
               rounded-2xl px-4 py-3 shadow-theme-xl animate-rise">
        <span class="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
          </svg>
        </span>
        <p class="text-sm font-medium text-primary">A new version is available.</p>
        <button type="button" (click)="reload()"
          class="shrink-0 rounded-xl gradient-brand px-3 py-1.5 text-xs font-semibold text-white
                 transition-transform duration-200 hover:scale-[1.03] active:scale-95">
          Reload
        </button>
        <button type="button" (click)="dismiss()" aria-label="Dismiss update notice"
          class="shrink-0 rounded-lg px-2 py-1 text-tertiary transition-colors hover:text-primary">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    }
  `
})
export class AppUpdateComponent {
  private readonly updates = inject(SwUpdate);
  private readonly destroyRef = inject(DestroyRef);

  readonly updateReady = signal(false);

  constructor() {
    // False in development and wherever the browser has no service worker, in
    // which case none of the below is wired up at all.
    if (!this.updates.isEnabled) return;

    this.updates.versionUpdates
      .pipe(
        filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.updateReady.set(true));

    // A long-lived standalone window may never be reloaded, so poll rather than
    // relying on the check that happens at registration.
    interval(UPDATE_CHECK_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.updates.checkForUpdate());
  }

  reload(): void {
    // Swap in the new worker first, so the reload lands on the new build rather
    // than serving the old cache once more and prompting again.
    void this.updates.activateUpdate().then(() => document.location.reload());
  }

  dismiss(): void {
    this.updateReady.set(false);
  }
}
