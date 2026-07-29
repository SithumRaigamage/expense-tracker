import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
}

/**
 * The app's segmented control — one visual language for every "pick one of a
 * few" switch (chart period, transaction type, and so on).
 *
 * Replaces two near-identical components that each rebuilt the same pill markup
 * and the same active/inactive class helper, and drifted apart in padding and
 * text size.
 *
 * Deliberately NOT `role="tab"`: these switches re-render a chart in place
 * rather than swapping between labelled tabpanels, and `tab` without a matching
 * `tabpanel` misleads screen readers about what arrow keys will do. A labelled
 * group of pressed-state buttons describes what this actually is.
 */
@Component({
  selector: 'app-segmented-control',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  /*
    An Angular component host is `display: inline` by default, which gives the
    `max-w-full` below nothing definite to resolve against — the control sized
    to its content and pushed the dashboard 11px past a 320px viewport.
  */
  host: { class: 'block max-w-full min-w-0' },
  template: `
    <!--
      Scrolls rather than overflowing. The four-option period switch is wider
      than a 320px viewport, and as a plain inline-flex it pushed the whole
      dashboard sideways; overflow-x-auto keeps the spill inside this box.
    -->
    <div role="group" [attr.aria-label]="ariaLabel"
      class="no-scrollbar inline-flex max-w-full items-center gap-0.5 overflow-x-auto
             rounded-xl border border-subtle p-1 surface-2">
      @for (option of options; track option.value) {
        <button
          type="button"
          (click)="select(option.value)"
          [attr.aria-pressed]="selected === option.value"
          class="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold
                 transition-all duration-200 ease-[var(--ease-out-quint)] active:scale-95"
          [class]="selected === option.value
            ? 'surface-1 text-primary shadow-theme-xs'
            : 'text-secondary hover:text-primary'">
          {{ option.label }}
        </button>
      }
    </div>
  `
})
export class SegmentedControlComponent<T extends string = string> {
  @Input({ required: true }) options: SegmentOption<T>[] = [];
  @Input({ required: true }) selected!: T;
  /** Names the group for screen readers, e.g. "Chart period". */
  @Input() ariaLabel = '';

  @Output() selectedChange = new EventEmitter<T>();

  select(value: T): void {
    if (value === this.selected) return;
    this.selected = value;
    this.selectedChange.emit(value);
  }
}
