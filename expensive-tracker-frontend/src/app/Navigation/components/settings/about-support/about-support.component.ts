import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TeamMember {
  name: string;
  role: string;
  avatar: string;
}

interface LegalLink {
  title: string;
  url: string;
}

interface Developer {
  name: string;
  role: string;
  avatar: string;
}

@Component({
  selector: 'app-about-support',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-support.component.html',
  styleUrl: './about-support.component.css'
})
export class AboutSupportComponent {
  appName = 'ExpenseTracker';
  appVersion = '1.0.0';
  releaseNotes = [
    'Enhanced dashboard visualization',
    'New wallet management features',
    'Improved budget planning tools',
    'Bug fixes and performance improvements'
  ];

  legalLinks: LegalLink[] = [
    { title: 'Terms of Service', url: '/terms' },
    { title: 'Privacy Policy', url: '/privacy' },
    { title: 'License Information', url: '/license' }
  ];

  developer: Developer = {
    name: 'Sithum Raigamage',
    role: 'Developer & Creator',
    avatar: 'assets/images/user/owner.png'
  };

  accessibilityStatement = 'ExpenseTracker aims to simplify wallet management for everyone. We understand managing multiple wallets can be challenging, so we\'ve designed our interface with clear visuals, intuitive navigation, and helpful tooltips to make tracking your expenses as straightforward as possible.';
}
