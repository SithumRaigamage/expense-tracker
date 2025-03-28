import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type BadgeVariant = 'light' | 'solid';
type BadgeSize = 'sm' | 'md';
type BadgeColor = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'light' | 'dark';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.css']
})
export class BadgeComponent {

  @Input() color: BadgeColor = 'primary';
  @Input() variant: BadgeVariant = 'light';
  @Input() size: BadgeSize = 'md';
  @Input() startIcon?: string;
  @Input() endIcon?: string;

  private readonly baseStyles = 'inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium';

  private readonly sizeStyles = {
    sm: 'text-theme-xs',
    md: 'text-sm'
  };

  private readonly variants = {
    light: {
      primary: 'bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400',
      success: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
      error: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
      warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400',
      info: 'bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500',
      light: 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80',
      dark: 'bg-gray-500 text-white dark:bg-white/5 dark:text-white'
    },
    solid: {
      primary: 'bg-brand-500 text-white dark:text-white',
      success: 'bg-success-500 text-white dark:text-white',
      error: 'bg-error-500 text-white dark:text-white',
      warning: 'bg-warning-500 text-white dark:text-white',
      info: 'bg-blue-light-500 text-white dark:text-white',
      light: 'bg-gray-400 dark:bg-white/5 text-white dark:text-white/80',
      dark: 'bg-gray-700 text-white dark:text-white'
    }
  };

  get computedClasses(): string {
    const sizeClass = this.sizeStyles[this.size];
    const colorStyles = this.variants[this.variant][this.color];
    return `${this.baseStyles} ${sizeClass} ${colorStyles}`;
  }

  getIconPath(): string {
    if (!this.startIcon) return '';
    return this.startIcon === 'arrow_upward'
      ? 'assets/icons/arrow_upward.png'
      : 'assets/icons/arrow_downward.png';
  }

  getIconClasses(): string {
    if (!this.startIcon) return '';
    return this.startIcon === 'arrow_upward'
      ? 'fa-solid fa-chevron-up'
      : 'fa-solid fa-chevron-down';
  }
}
