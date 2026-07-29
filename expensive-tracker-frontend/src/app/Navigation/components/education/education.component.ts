import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons';

import {
  ARTICLES,
  GLOSSARY,
  Article,
  ArticleCategory,
  ArticleLevel,
  GlossaryTerm
} from '../../../shared/content/financial-education';
import { EducationProgressService } from '../../../shared/services/education-progress.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-education',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule, EmptyStateComponent],
  templateUrl: './education.component.html',
})
export class EducationComponent implements OnInit {
  readonly progress = inject(EducationProgressService);

  readonly faBookOpen = faBookOpen;

  /**
   * The article set is a compiled-in constant, not a fetch. Filtering happens
   * over the whole list in memory, which is the right shape for six articles —
   * there is no pagination here because there is never a second page.
   */
  readonly articles = ARTICLES;
  readonly glossary: GlossaryTerm[] = GLOSSARY;

  filteredArticles: Article[] = [];

  searchQuery = '';
  selectedCategory: ArticleCategory | 'all' = 'all';
  selectedLevel: ArticleLevel | 'all' = 'all';
  bookmarkedOnly = false;

  readonly categories: ArticleCategory[] = ['budgeting', 'saving', 'debt', 'investing'];
  readonly levels: ArticleLevel[] = ['beginner', 'intermediate'];

  ngOnInit(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const query = this.searchQuery.trim().toLowerCase();

    this.filteredArticles = this.articles.filter(article => {
      const matchesSearch =
        !query ||
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query);

      const matchesCategory =
        this.selectedCategory === 'all' || article.category === this.selectedCategory;

      const matchesLevel = this.selectedLevel === 'all' || article.level === this.selectedLevel;

      const matchesBookmark = !this.bookmarkedOnly || this.progress.isBookmarked(article.id);

      return matchesSearch && matchesCategory && matchesLevel && matchesBookmark;
    });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.selectedLevel = 'all';
    this.bookmarkedOnly = false;
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return (
      !!this.searchQuery.trim() ||
      this.selectedCategory !== 'all' ||
      this.selectedLevel !== 'all' ||
      this.bookmarkedOnly
    );
  }

  /** Tailwind classes for a category pill. Kept out of the template so the markup stays readable. */
  categoryClass(category: ArticleCategory): string {
    const classes: Record<ArticleCategory, string> = {
      budgeting: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
      saving: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
      debt: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
      investing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200'
    };
    return classes[category];
  }

  toggleBookmark(article: Article, event: Event): void {
    // The whole card is a link to the article; the star sits inside it.
    event.preventDefault();
    event.stopPropagation();

    this.progress.toggleBookmark(article.id);

    // Un-bookmarking while filtered to bookmarks should remove the card.
    if (this.bookmarkedOnly) {
      this.applyFilters();
    }
  }
}
