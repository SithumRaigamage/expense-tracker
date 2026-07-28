import { Component } from '@angular/core';

import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDownload, faBook, faVideo } from '@fortawesome/free-solid-svg-icons';

interface DocSection {
  title: string;
  content: string;
  videoUrl?: string;
  screenshots?: string[];
}

@Component({
  selector: 'app-documentation',
  standalone: true,
  imports: [RouterModule, FontAwesomeModule],
  templateUrl: './documentation.component.html'
})
export class DocumentationComponent {
  downloadIcon = faDownload;
  bookIcon = faBook;
  videoIcon = faVideo;

  sections: DocSection[] = [
    {
      title: 'Getting Started with ExpenseTracker',
      content: 'Learn the basics of setting up your wallets and tracking expenses...',
      videoUrl: 'assets/videos/getting-started.mp4',
      screenshots: ['assets/images/docs/setup1.png', 'assets/images/docs/setup2.png']
    },
    {
      title: 'Managing Multiple Wallets',
      content: 'Discover how to effectively manage multiple wallets and track balances...',
      screenshots: ['assets/images/docs/wallets1.png']
    },
    // Add more sections
  ];

  downloadPdf() {
    // Implementation for PDF download
  }
}
