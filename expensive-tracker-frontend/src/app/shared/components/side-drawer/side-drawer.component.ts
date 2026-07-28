import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'app-side-drawer',
  standalone: true,
  imports: [FontAwesomeModule],
  template: `
    <!-- Backdrop -->
    @if (isOpen) {
      <div
        aria-hidden="true"
        class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60000] transition-opacity duration-300"
        (click)="onClose()">
      </div>
    }
    
    <!--
    Clipping viewport for the panel. When closed, the panel is parked a full
    width to the right of the screen; without this wrapper it counted as page
    content and every screen using a drawer could be scrolled sideways into
    empty space. pointer-events-none so the wrapper never swallows clicks.
    -->
    <!--
    inert while closed: the panel is only parked off-screen, so without it every
    field and button inside a shut drawer stays in the tab order and is read out
    by screen readers as part of the page.
    -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none z-[60001]"
      [attr.inert]="isOpen ? null : ''">
      <!-- Drawer Panel -->
      <div role="dialog"
        aria-modal="true"
        [attr.aria-label]="title"
        class="absolute inset-y-0 right-0 w-full md:w-[450px] pointer-events-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-500 ease-in-out border-l border-gray-200 dark:border-gray-800"
        [class.translate-x-full]="!isOpen"
        [class.translate-x-0]="isOpen">
        <div class="h-full flex flex-col">
          <!-- Header -->
          <div class="px-5 py-6 sm:px-8 sm:py-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center gap-3">
            <div class="flex items-center gap-3 sm:gap-4 min-w-0">
              @if (icon) {
                <div class="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-sm border border-brand-200/50 dark:border-brand-800/30">
                  <fa-icon [icon]="icon" class="text-xl"></fa-icon>
                </div>
              }
              <div class="min-w-0">
                <h2 class="truncate text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {{title}}
                </h2>
              </div>
            </div>
            <button (click)="onClose()"
              [attr.aria-label]="'Close ' + (title || 'panel')"
              class="shrink-0 p-2.5 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 active:scale-95">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8 custom-scrollbar">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    </div>
    `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #e5e7eb;
      border-radius: 10px;
    }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #374151;
    }
  `]
})
export class SideDrawerComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() icon?: IconDefinition;
  @Output() closed = new EventEmitter<void>();

  onClose() {
    this.closed.emit();
  }

  // The backdrop closes the drawer on click; Escape is its keyboard equivalent.
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen) {
      this.onClose();
    }
  }
}
