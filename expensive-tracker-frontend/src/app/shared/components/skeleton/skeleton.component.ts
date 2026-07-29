import { Component, Input } from '@angular/core';


/**
 * Placeholder shown while a widget's data is in flight.
 *
 * Widgets previously either rendered nothing (a blank panel that looks broken
 * or empty) or a bare spinner that says nothing about what is coming. A shape
 * that matches the eventual content keeps the layout from jumping when data
 * lands, and reads as "loading" without a caption.
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [],
  template: `
    <div
      class="skeleton bg-gray-200 dark:bg-gray-700"
      [class.rounded-full]="rounded === 'full'"
      [class.rounded-xl]="rounded === 'xl'"
      [class.rounded-md]="rounded === 'md'"
      [style.width]="width"
      [style.height]="height"
      aria-hidden="true"
    ></div>
  `,
  styles: [`
    .skeleton {
      position: relative;
      overflow: hidden;
    }

    .skeleton::after {
      content: '';
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.45),
        transparent
      );
      animation: skeleton-sweep 1.6s infinite;
    }

    :host-context(.dark) .skeleton::after {
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.08),
        transparent
      );
    }

    @keyframes skeleton-sweep {
      100% { transform: translateX(100%); }
    }

    /* A sweeping gradient is exactly the kind of motion that triggers vestibular
       discomfort; fall back to a static block. */
    @media (prefers-reduced-motion: reduce) {
      .skeleton::after { animation: none; }
    }
  `]
})
export class SkeletonComponent {
  @Input() width = '100%';
  @Input() height = '1rem';
  @Input() rounded: 'md' | 'xl' | 'full' = 'md';
}
