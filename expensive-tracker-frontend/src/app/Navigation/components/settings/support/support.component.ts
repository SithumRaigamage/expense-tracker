import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, ValidatorFn } from '@angular/forms';
import { FeedbackService } from '../../../../services/feedback.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faEnvelope,
  faPhone,
  faClock,
  faTicket,
  faComments,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface SupportHours {
  day: string;
  hours: string;
}

interface ContactOption {
  icon: IconDefinition;
  title: string;
  description: string;
}

interface FormField {
  name: string;
  label: string;
  type: string;
  options?: { value: string; label: string; }[];
  validation?: ValidatorFn[];
}

type FormGroupConfig = Record<string, [string, ValidatorFn[]]>;

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './support.component.html'
})
export class SupportComponent {
  private readonly fb = inject(FormBuilder);
  private readonly feedback = inject(FeedbackService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  /** Disables the submit button and swaps its label while the post is in flight. */
  isSubmitting = false;

  /**
   * Maps this form's categories onto the ones the feedback API accepts
   * (feature | bug | ui | performance). Without it the endpoint rejects every
   * submission with "Category must be one of: …" — which is what it did the
   * first time this form was actually allowed to post.
   */
  private static readonly API_CATEGORY: Record<string, string> = {
    general: 'ui',
    technical: 'bug',
    billing: 'ui',
    feature: 'feature'
  };

  // Icons
  emailIcon = faEnvelope;
  phoneIcon = faPhone;
  clockIcon = faClock;
  ticketIcon = faTicket;
  chatIcon = faComments;
  searchIcon = faSearch;

  /*
    "Live Chat" and "Phone Support" have been removed. Neither exists in this
    build — there is no chat channel and the number was +1 (555) 123-4567, a
    reserved fictional prefix. Listing a support line that nobody answers is
    worse than listing none, so the two real routes are what remain.

    The email address is still a placeholder; swap it for the real inbox before
    this page goes live.
  */
  contactOptions: ContactOption[] = [
    {
      icon: this.emailIcon,
      title: 'Email Support',
      description: 'support@expensetracker.com'
    },
    {
      icon: this.ticketIcon,
      title: 'Support Ticket',
      description: 'Use the form below'
    }
  ];

  supportHours: SupportHours[] = [
    { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM EST' },
    { day: 'Saturday', hours: '10:00 AM - 2:00 PM EST' },
    { day: 'Sunday', hours: 'Closed' }
  ];

  // Live Chat and Phone Support are gone from here too — they were still being
  // quoted response times after being removed from the contact list above.
  responseTimes = [
    { channel: 'Email Support', time: '24-48 hours' },
    { channel: 'Support Ticket', time: '24-72 hours' }
  ];

  formFields: FormField[] = [
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'subject', label: 'Subject', type: 'text' },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'general', label: 'General Inquiry' },
        { value: 'technical', label: 'Technical Issue' },
        { value: 'billing', label: 'Billing Question' },
        { value: 'feature', label: 'Feature Request' }
      ]
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }
      ]
    },
    {
      name: 'message',
      label: 'Message',
      type: 'textarea'
    }
  ];

  pageContent = {
    title: 'Contact Options',
    supportHoursTitle: 'Support Hours',
    responseTimesTitle: 'Response Times',
    formTitle: 'Submit Support Request',
    submitButton: 'Submit Request'
  };

  supportForm!: FormGroup;
  searchTerm = '';

  constructor() {
    this.initForm();
  }

  private initForm(): void {
    const group: FormGroupConfig = {};

    this.formFields.forEach(field => {
      const validators = field.validation || [Validators.required];
      if (field.name === 'email') {
        validators.push(Validators.email);
      }
      if (field.name === 'message') {
        validators.push(Validators.minLength(20));
      }
      group[field.name] = ['', validators];
    });

    this.supportForm = this.fb.group(group);
  }

  /**
   * Sends the request to the API.
   *
   * The body of this method was a single `// Implement API call` comment, so
   * the form validated, cleared nothing, reported nothing, and threw the user's
   * message away. It posts to the same `/feedback` endpoint the Feedback page
   * uses — a support ticket is feedback with a category — and now tells the
   * user whether it worked.
   */
  submitSupportRequest(): void {
    if (this.supportForm.invalid) {
      this.supportForm.markAllAsTouched();
      return;
    }

    const { name, email, subject, category, priority, message } = this.supportForm.value;
    this.isSubmitting = true;

    this.feedback
      .submit({
        category: SupportComponent.API_CATEGORY[category] ?? 'ui',
        title: subject,
        // Name and email ride along in the body so support can reply; the
        // endpoint stores a free-text description.
        description: [message, '', `— ${name} <${email}>`, priority ? `Priority: ${priority}` : '']
          .filter(Boolean)
          .join('\n'),
        // The API validates sentiment as 1-5; 3 is the neutral midpoint, which
        // is the honest value for a support request nobody rated.
        sentiment: 3
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.notifications.success('We have your request — support will reply by email.');
          this.supportForm.reset();
        },
        error: (err: Error) => {
          this.isSubmitting = false;
          this.notifications.error(err.message);
        }
      });
  }
}
