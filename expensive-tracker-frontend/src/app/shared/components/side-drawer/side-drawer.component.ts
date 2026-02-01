import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-side-drawer',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <!-- Backdrop -->
    <div *ngIf="isOpen"
         class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60000] transition-opacity duration-300"
         (click)="onClose()">
    </div>

    <!-- Drawer Panel -->
    <div class="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-500 ease-in-out z-[60001] border-l border-gray-200 dark:border-gray-800"
         [class.translate-x-full]="!isOpen"
         [class.translate-x-0]="isOpen">
      <div class="h-full flex flex-col">
        <!-- Header -->
        <div class="px-8 py-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div class="flex items-center gap-4">
            <div *ngIf="icon" class="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm border border-primary-200/50 dark:border-primary-800/30">
              <fa-icon [icon]="icon" class="text-xl"></fa-icon>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {{title}}
              </h2>
            </div>
          </div>
          <button (click)="onClose()" 
                  class="p-2.5 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
          <ng-content></ng-content>
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
  @Input() icon: any;
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}
