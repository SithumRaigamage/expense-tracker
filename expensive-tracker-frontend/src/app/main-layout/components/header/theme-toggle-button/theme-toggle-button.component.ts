import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ThemeService } from '../../../../core/services/theme.service';

/**
 * Light/dark switch for the header.
 *
 * The previous version of this component was React JSX in a `.html` file —
 * `onClick={toggleTheme}`, `fillRule`, and a `toggleTheme` that existed nowhere.
 * Angular renders that as inert markup, so the button did nothing at all.
 *
 * Both icons stay in the DOM and cross-fade with a counter-rotation, which reads
 * as one shape turning over rather than two icons swapping places. Under reduced
 * motion the global override in styles.css collapses this to a plain cut.
 */
@Component({
  selector: 'app-theme-toggle-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="theme.toggle()"
      [attr.aria-label]="isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
      [attr.aria-pressed]="isDark()"
      class="group relative grid h-11 w-11 place-items-center overflow-hidden rounded-full
             border border-gray-200 bg-white/80 text-gray-500 backdrop-blur-sm
             transition-[background-color,border-color,color,transform] duration-300
             hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 active:scale-95
             dark:border-white/10 dark:bg-white/5 dark:text-gray-400
             dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-gray-100">
      <!-- Hover wash, drawn behind the glyph so it tints the surface, not the icon. -->
      <span aria-hidden="true"
        class="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500/0 to-violet-500/0
               opacity-0 transition-opacity duration-300
               group-hover:from-brand-500/10 group-hover:to-violet-500/10 group-hover:opacity-100"></span>

      <!-- Sun -->
      <svg aria-hidden="true" viewBox="0 0 20 20" width="19" height="19" fill="currentColor"
        class="absolute transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        [class.opacity-0]="isDark()"
        [class.rotate-90]="isDark()"
        [class.scale-50]="isDark()">
        <path fill-rule="evenodd" clip-rule="evenodd"
          d="M10 1.54a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V2.29a.75.75 0 0 1 .75-.75Zm0 5.25a3.21 3.21 0 1 0 0 6.42 3.21 3.21 0 0 0 0-6.42ZM5.29 10a4.71 4.71 0 1 1 9.42 0 4.71 4.71 0 0 1-9.42 0Zm10.69-4.92a.75.75 0 1 0-1.06-1.06l-.884.884a.75.75 0 1 0 1.06 1.06l.884-.884ZM18.46 10a.75.75 0 0 1-.75.75h-1.25a.75.75 0 0 1 0-1.5h1.25a.75.75 0 0 1 .75.75Zm-3.54 5.98a.75.75 0 0 0 1.06-1.06l-.884-.884a.75.75 0 1 0-1.06 1.06l.884.884ZM10 15.71a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0v-1.25a.75.75 0 0 1 .75-.75Zm-4.036-.614a.75.75 0 0 0-1.06-1.06l-.884.884a.75.75 0 1 0 1.06 1.06l.884-.884ZM4.29 10a.75.75 0 0 1-.75.75H2.29a.75.75 0 0 1 0-1.5h1.25a.75.75 0 0 1 .75.75Zm.613-4.036a.75.75 0 0 0 1.06-1.06l-.884-.884a.75.75 0 0 0-1.06 1.06l.884.884Z" />
      </svg>

      <!-- Moon -->
      <svg aria-hidden="true" viewBox="0 0 20 20" width="19" height="19" fill="currentColor"
        class="absolute transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        [class.opacity-0]="!isDark()"
        [class.-rotate-90]="!isDark()"
        [class.scale-50]="!isDark()">
        <path
          d="M17.455 11.97a.75.75 0 0 0-1.026-.919 5.918 5.918 0 0 1-3.514 1.152 5.918 5.918 0 0 1-5.918-5.918c0-1.34.446-2.575 1.198-3.567a.75.75 0 0 0-.844-1.17A8.46 8.46 0 0 0 1.542 10a8.458 8.458 0 0 0 8.458 8.458 8.46 8.46 0 0 0 8.18-6.297l-.725-.19Z" />
      </svg>
    </button>
  `
})
export class ThemeToggleButtonComponent {
  readonly theme = inject(ThemeService);
  readonly isDark = computed(() => this.theme.resolved() === 'dark');
}
