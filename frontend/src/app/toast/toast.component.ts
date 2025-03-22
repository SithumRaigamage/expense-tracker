import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheckCircle,
  faExclamationCircle,
  faInfoCircle,
  faExclamationTriangle,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { ToastMsg } from '../models/ToastMsg';
import { ToastmsgService } from '../services/toastmsg.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './toast.component.html'
})
export class ToastComponent implements OnInit {
  faCheckCircle = faCheckCircle;
  faExclamationCircle = faExclamationCircle;
  faInfoCircle = faInfoCircle;
  faExclamationTriangle = faExclamationTriangle;
  faTimes = faTimes;

  toasts: ToastMsg[] = [];

  constructor(public toastService: ToastmsgService) {}

  ngOnInit() {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  getIcon(type: ToastMsg['type']) {
    switch (type) {
      case 'success': return this.faCheckCircle;
      case 'error': return this.faExclamationCircle;
      case 'warning': return this.faExclamationTriangle;
      default: return this.faInfoCircle;
    }
  }

  getToastClass(type: ToastMsg['type']) {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400';
    }
  }
}
