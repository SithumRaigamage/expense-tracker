import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faStar as faStarSolid,
  faBug,
  faLightbulb,
  faGaugeHigh,
  faPaintBrush
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { FeedbackService } from '../../../services/feedback.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface FeedbackCategory {
  id: string;
  icon: IconDefinition;
  title: string;
  description: string;
}

interface SentimentOption {
  emoji: string;
  label: string;
  value: number;
}

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './feedback.component.html'
})
export class FeedbackComponent {
  private readonly fb = inject(FormBuilder);
  private readonly feedbackService = inject(FeedbackService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  feedbackForm!: FormGroup;
  rating = 0;
  starSolid = faStarSolid;
  starRegular = faStarRegular;

  categories: FeedbackCategory[] = [
    {
      id: 'feature',
      icon: faLightbulb,
      title: 'Feature Request',
      description: 'Suggest new features or improvements'
    },
    {
      id: 'bug',
      icon: faBug,
      title: 'Bug Report',
      description: 'Report issues or unexpected behavior'
    },
    {
      id: 'ui',
      icon: faPaintBrush,
      title: 'UI/UX Feedback',
      description: 'Share thoughts on design and usability'
    },
    {
      id: 'performance',
      icon: faGaugeHigh,
      title: 'Performance',
      description: 'Report slow loading or performance issues'
    }
  ];

  sentimentOptions: SentimentOption[] = [
    { emoji: '😢', label: 'Very Dissatisfied', value: 1 },
    { emoji: '🙁', label: 'Dissatisfied', value: 2 },
    { emoji: '😐', label: 'Neutral', value: 3 },
    { emoji: '🙂', label: 'Satisfied', value: 4 },
    { emoji: '😄', label: 'Very Satisfied', value: 5 }
  ];

  /** Disables the submit button while the post is in flight. */
  isSubmitting = false;

  constructor() {
    this.initForm();
  }

  private initForm(): void {
    this.feedbackForm = this.fb.group({
      category: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(20)]],
      sentiment: [null, Validators.required],
      rating: [0],
      deviceInfo: ['']
    });

    // Automatically collect device info
    this.feedbackForm.patchValue({
      deviceInfo: this.getDeviceInfo()
    });
  }

  getDeviceInfo(): string {
    return `Browser: ${navigator.userAgent}
Platform: ${navigator.platform}
Screen: ${window.screen.width}x${window.screen.height}
Window: ${window.innerWidth}x${window.innerHeight}`;
  }

  setRating(value: number): void {
    this.rating = value;
    this.feedbackForm.patchValue({ rating: value });
  }


  /**
   * Sends the feedback to the API.
   *
   * This method's body was `// Implement API call to submit feedback` followed
   * by a form reset — so every report a user wrote was discarded, and because
   * the form cleared itself afterwards it looked like it had been sent. Both
   * `FeedbackService` and `NotificationService` were already injected above;
   * only the call was missing.
   */
  submitFeedback(): void {
    if (this.feedbackForm.invalid) {
      this.feedbackForm.markAllAsTouched();
      return;
    }

    const { category, title, description, sentiment, rating, deviceInfo } = this.feedbackForm.value;
    this.isSubmitting = true;

    this.feedbackService
      .submit({ category, title, description, sentiment, rating, deviceInfo })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.notifications.success('Thanks — your feedback has been sent.');
          this.feedbackForm.reset({ rating: 0, deviceInfo: this.getDeviceInfo() });
          this.rating = 0;
        },
        error: (err: Error) => {
          this.isSubmitting = false;
          this.notifications.error(err.message);
        }
      });
  }
}
