import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ARTICLES, Article, ArticleCategory } from '../../../../shared/content/financial-education';
import { EducationProgressService } from '../../../../shared/services/education-progress.service';

/**
 * The reading view for a single article. The list at /financial-education used
 * to be cards with nowhere to click through to; this is where they land.
 *
 * Articles are compiled-in content keyed by id, so the lookup is synchronous and
 * an unknown id is a bad URL rather than a failed request — send those back to
 * the list instead of showing an error the reader can do nothing about.
 */
@Component({
  selector: 'app-education-article',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './article.component.html',
})
export class ArticleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly progress = inject(EducationProgressService);

  article?: Article;
  nextArticle?: Article;

  ngOnInit(): void {
    // paramMap rather than a snapshot: the "next article" link routes to this
    // same component, which Angular reuses instead of recreating.
    this.route.paramMap.subscribe(params => {
      const id = params.get('articleId');
      const article = ARTICLES.find(candidate => candidate.id === id);

      if (!article) {
        this.router.navigate(['/financial-education']);
        return;
      }

      this.article = article;

      const index = ARTICLES.indexOf(article);
      this.nextArticle = ARTICLES[index + 1];

      window.scrollTo({ top: 0 });
    });
  }

  get isBookmarked(): boolean {
    return !!this.article && this.progress.isBookmarked(this.article.id);
  }

  get isRead(): boolean {
    return !!this.article && this.progress.isRead(this.article.id);
  }

  toggleBookmark(): void {
    if (this.article) {
      this.progress.toggleBookmark(this.article.id);
    }
  }

  toggleRead(): void {
    if (this.article) {
      this.progress.setRead(this.article.id, !this.isRead);
    }
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
