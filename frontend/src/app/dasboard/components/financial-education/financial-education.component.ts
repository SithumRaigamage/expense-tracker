import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EducationalContent, FinancialTerm } from '../models/Education';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-financial-education',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './financial-education.component.html',
  styleUrls: ['./financial-education.component.css']
})
export class FinancialEducationComponent {
  selectedCategory: string = 'all';
  searchQuery: string = '';

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
}
