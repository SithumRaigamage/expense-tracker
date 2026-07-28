import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  ARTICLES,
  GLOSSARY,
  Article,
  ArticleCategory,
  GlossaryTerm
} from '../../../shared/content/financial-education';
import { EducationProgressService } from '../../../shared/services/education-progress.service';

/**
 * Dashboard teaser for the education section. It shows a few articles from the
 * same source the full page reads, so the two can never drift apart — this
 * widget previously carried its own copy of two placeholder items pointing at
 * thumbnails and routes that did not exist.
 */
@Component({
  selector: 'app-financial-education',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './financial-education.component.html',
})
export class FinancialEducationComponent {
  readonly progress = inject(EducationProgressService);

  /** How many cards fit the widget's three-column grid without it becoming a page of its own. */
  private static readonly PREVIEW_COUNT = 3;

  selectedCategory: ArticleCategory | 'all' = 'all';

  readonly categories: ArticleCategory[] = ['budgeting', 'saving', 'debt', 'investing'];
  readonly glossary: GlossaryTerm[] = GLOSSARY.slice(0, 4);

  get previewArticles(): Article[] {
    const matching =
      this.selectedCategory === 'all'
        ? ARTICLES
        : ARTICLES.filter(article => article.category === this.selectedCategory);

    return matching.slice(0, FinancialEducationComponent.PREVIEW_COUNT);
  }

  categoryClass(category: ArticleCategory): string {
    const classes: Record<ArticleCategory, string> = {
      budgeting: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
      saving: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
      debt: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
      investing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200'
    };
    return classes[category];
  }
}
