import { Injectable, effect, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'expensify.theme';

/**
 * Owns the light/dark theme.
 *
 * Every `dark:` variant in the templates compiles to `:is(.dark *)`, so all ~900
 * of them were inert: nothing ever put the `dark` class on the document. The
 * only control was a "theme toggle" component whose template was React JSX
 * (`onClick={toggleTheme}`) pasted into an Angular file, which Angular renders
 * as literal text and never binds. This service is the missing half.
 *
 * Three preference states, not two. 'system' is the default and keeps following
 * the OS after the fact — a user who switches their laptop to dark at sunset
 * expects the app to follow, which a plain boolean can't express once it has
 * been persisted.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly media = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

  /** What the user asked for. */
  readonly preference = signal<ThemePreference>(this.readStoredPreference());

  /** What the OS currently reports; tracked so 'system' stays live. */
  private readonly systemPrefersDark = signal(this.media?.matches ?? false);

  /** What is actually on screen, after resolving 'system'. */
  readonly resolved = signal<ResolvedTheme>('light');

  constructor() {
    this.media?.addEventListener('change', event => {
      this.systemPrefersDark.set(event.matches);
    });

    effect(() => {
      const preference = this.preference();
      const theme: ResolvedTheme = preference === 'system'
        ? (this.systemPrefersDark() ? 'dark' : 'light')
        : preference;

      this.resolved.set(theme);
      this.apply(theme);
    });
  }

  set(preference: ThemePreference): void {
    this.preference.set(preference);
    try {
      if (preference === 'system') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, preference);
      }
    } catch {
      // Safari in private mode throws on write. The theme still applies for
      // this session; only persistence is lost, which is not worth surfacing.
    }
  }

  /**
   * Flips to the opposite of what is *currently rendered*, so the first click
   * from 'system' does the visible thing rather than appearing to do nothing.
   */
  toggle(): void {
    this.set(this.resolved() === 'dark' ? 'light' : 'dark');
  }

  private apply(theme: ResolvedTheme): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');

    // Keeps form controls, scrollbars and the mobile browser chrome in step
    // with the app; without it a dark page keeps a white scrollbar gutter.
    root.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#070b16' : '#ffffff');
  }

  private readStoredPreference(): ThemePreference {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // Storage unavailable — fall through to following the OS.
    }
    return 'system';
  }
}
