import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faChartSimple } from '@fortawesome/free-solid-svg-icons';

/**
 * Placeholder shown inside a widget when it has nothing to display, so an empty
 * dashboard reads as "nothing recorded yet" instead of a blank or broken panel.
 * Project a call-to-action into it via <ng-content> when there is somewhere to send the user.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './empty-state.component.html',
})
export class EmptyStateComponent {
  @Input() icon: IconDefinition = faChartSimple;
  @Input() title = 'No data available';
  @Input() message = '';

  /** Vertical breathing room — use 'lg' to fill the space a chart would have taken. */
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get paddingClass(): string {
    switch (this.size) {
      case 'sm':
        return 'py-8';
      case 'lg':
        return 'py-20';
      default:
        return 'py-12';
    }
  }
}
