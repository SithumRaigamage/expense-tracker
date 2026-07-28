import { Component } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faStar as faStarSolid,
  faPaperclip,
  faBug,
  faLightbulb,
  faGaugeHigh,
  faPaintBrush
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';

interface FeedbackCategory {
  id: string;
  icon: any;
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
  feedbackForm!: FormGroup;
  rating = 0;
  starSolid = faStarSolid;
  starRegular = faStarRegular;
  attachmentIcon = faPaperclip;

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

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  private initForm(): void {
    this.feedbackForm = this.fb.group({
      category: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(20)]],
      sentiment: [null, Validators.required],
      rating: [0],
      deviceInfo: [''],
      attachments: [[]]
    });

    // Automatically collect device info
    this.feedbackForm.patchValue({
      deviceInfo: this.getDeviceInfo()
    });
  }

  private getDeviceInfo(): string {
    return `Browser: ${navigator.userAgent}
Platform: ${navigator.platform}
Screen: ${window.screen.width}x${window.screen.height}
Window: ${window.innerWidth}x${window.innerHeight}`;
  }

  setRating(value: number): void {
    this.rating = value;
    this.feedbackForm.patchValue({ rating: value });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const files = Array.from(input.files);
      this.feedbackForm.patchValue({
        attachments: [...(this.feedbackForm.get('attachments')?.value || []), ...files]
      });
    }
  }

  submitFeedback(): void {
    if (this.feedbackForm.valid) {
      // Implement API call to submit feedback
      this.feedbackForm.reset();
      this.rating = 0;
    }
  }
}
