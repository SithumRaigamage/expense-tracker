import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faExclamationTriangle,
  faSearch,
  faBug,
  faCode
} from '@fortawesome/free-solid-svg-icons';

// Define severity levels as const to ensure type safety
const SEVERITY_LEVELS = ['low', 'medium', 'high'] as const;
type Severity = typeof SEVERITY_LEVELS[number];

// Define color mapping interface
interface SeverityColors {
  readonly low: string;
  readonly medium: string;
  readonly high: string;
}

interface TroubleshootingItem {
  category: string;
  issue: string;
  solution: string[];
  errorCode?: string;
  severity: Severity;
}

@Component({
  selector: 'app-troubleshooting',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './troubleshooting.component.html'
})
export class TroubleshootingComponent {
  searchTerm = '';
  alertIcon = faExclamationTriangle;
  searchIcon = faSearch;
  bugIcon = faBug;
  codeIcon = faCode;

  categories = [
    'Account Access',
    'Wallet Sync',
    'Transaction Issues',
    'Budget Calculations',
    'App Performance'
  ];

  issues: TroubleshootingItem[] = [
    {
      category: 'Account Access',
      issue: 'Unable to log in',
      errorCode: 'AUTH001',
      severity: 'high',
      solution: [
        'Check if your email address is correct',
        'Reset your password using the "Forgot Password" link',
        'Clear browser cache and cookies',
        'Try using a different browser'
      ]
    },
    // Add more issues
  ];

  get filteredIssues() {
    return this.issues.filter(issue =>
      issue.issue.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      issue.category.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      issue.errorCode?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getSeverityColor(severity: Severity): string {
    const colors: SeverityColors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[severity];
  }
}
