import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faEnvelope,
  faPhone,
  faClock,
  faTicket,
  faComments,
  faSearch
} from '@fortawesome/free-solid-svg-icons';

interface SupportHours {
  day: string;
  hours: string;
}

interface ContactOption {
  icon: any;
  title: string;
  description: string;
}

interface FormField {
  name: string;
  label: string;
  type: string;
  options?: { value: string; label: string; }[];
  validation?: any[];
}

interface FormGroupConfig {
  [key: string]: [string, import('@angular/forms').ValidatorFn[]];
}

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './support.component.html'
})
export class SupportComponent {
  // Icons
  emailIcon = faEnvelope;
  phoneIcon = faPhone;
  clockIcon = faClock;
  ticketIcon = faTicket;
  chatIcon = faComments;
  searchIcon = faSearch;

  contactOptions: ContactOption[] = [
    {
      icon: this.emailIcon,
      title: 'Email Support',
      description: 'support@expensetracker.com'
    },
    {
      icon: this.chatIcon,
      title: 'Live Chat',
      description: 'Available during business hours'
    },
    {
      icon: this.phoneIcon,
      title: 'Phone Support',
      description: '+1 (555) 123-4567'
    },
    {
      icon: this.ticketIcon,
      title: 'Support Ticket',
      description: 'Create a ticket below'
    }
  ];

  supportHours: SupportHours[] = [
    { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM EST' },
    { day: 'Saturday', hours: '10:00 AM - 2:00 PM EST' },
    { day: 'Sunday', hours: 'Closed' }
  ];

  responseTimes = [
    { channel: 'Email Support', time: '24-48 hours' },
    { channel: 'Live Chat', time: 'Real-time during business hours' },
    { channel: 'Support Ticket', time: '24-72 hours' },
    { channel: 'Phone Support', time: 'Available during business hours' }
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

  constructor(private fb: FormBuilder) {
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

  submitSupportRequest() {
    if (this.supportForm.valid) {
      console.log('Support request submitted:', this.supportForm.value);
      // Implement API call to submit support request
    }
  }
}
