import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faRocket,
  faBug,
  faGaugeHigh, // Changed from faSpeedometer
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';

interface ReleaseNote {
  version: string;
  date: string;
  features: string[];
  bugfixes: string[];
  improvements: string[];
  isExpanded?: boolean;
}

@Component({
  selector: 'app-release-notes',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule,FormsModule],
  templateUrl: './release-notes.component.html'
})
export class ReleaseNotesComponent {
  searchTerm = '';
  rocketIcon = faRocket;
  bugIcon = faBug;
  speedIcon = faGaugeHigh; // Updated to use faGaugeHigh
  searchIcon = faSearch;

  releases: ReleaseNote[] = [
    {
      version: '1.0.0',
      date: '2024-04-06',
      features: [
        'Initial release with core wallet management',
        'Dashboard with expense tracking',
        'Multiple wallet support',
        'Budget planning tools'
      ],
      bugfixes: [],
      improvements: [],
      isExpanded: true
    },
    {
      version: '0.9.0-beta',
      date: '2024-03-15',
      features: [
        'Beta testing of wallet features',
        'Transaction categorization'
      ],
      bugfixes: [
        'Fixed wallet balance calculation',
        'Corrected currency display issues'
      ],
      improvements: [
        'Enhanced loading performance',
        'Optimized dashboard renders'
      ]
    }
  ];

  toggleRelease(release: ReleaseNote): void {
    release.isExpanded = !release.isExpanded;
  }

  get filteredReleases(): ReleaseNote[] {
    return this.releases.filter(release =>
      release.version.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      release.features.some(feature =>
        feature.toLowerCase().includes(this.searchTerm.toLowerCase())
      ) ||
      release.bugfixes.some(bug =>
        bug.toLowerCase().includes(this.searchTerm.toLowerCase())
      ) ||
      release.improvements.some(improvement =>
        improvement.toLowerCase().includes(this.searchTerm.toLowerCase())
      )
    );
  }
}
