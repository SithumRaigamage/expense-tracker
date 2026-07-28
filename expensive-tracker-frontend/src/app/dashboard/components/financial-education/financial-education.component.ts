import { Component } from '@angular/core';

import { EducationalContent, FinancialTerm } from '../../../core/models/Education';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-financial-education',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './financial-education.component.html',
})
export class FinancialEducationComponent {
  selectedCategory = 'all';
  searchQuery = '';

  educationalContent: EducationalContent[] = [
    {
      id: '1',
      title: 'Budgeting Basics',
      type: 'article',
      description: 'Learn the fundamentals of creating and maintaining a budget',
      thumbnail: 'assets/images/education/budgeting.jpg',
      duration: '10 min read',
      difficulty: 'beginner',
      category: 'budgeting',
      link: '/education/budgeting-basics'
    },
    {
      id: '2',
      title: 'Investment Strategies',
      type: 'video',
      description: 'Understanding different investment options',
      thumbnail: 'assets/images/education/investment.jpg',
      duration: '15 min watch',
      difficulty: 'intermediate',
      category: 'investing',
      link: '/education/investment-strategies'
    }
  ];

  glossary: FinancialTerm[] = [
    {
      term: 'Budget',
      definition: 'A financial plan for a defined period',
      category: 'basics'
    },
    {
      term: 'ROI',
      definition: 'Return on Investment',
      category: 'investing'
    }
  ];

  /**
   * Thumbnails reference assets that are not in the repo. Hide the broken image
   * so the tinted panel behind it shows through, rather than a broken-image icon.
   */
  onThumbnailError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
