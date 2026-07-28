import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EducationComponent } from './education.component';
import { ARTICLES } from '../../../shared/content/financial-education';

describe('EducationComponent', () => {
  let component: EducationComponent;
  let fixture: ComponentFixture<EducationComponent>;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [EducationComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EducationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lists every article before any filter is applied', () => {
    expect(component.filteredArticles).toHaveSize(ARTICLES.length);
  });

  it('filters by category', () => {
    component.selectedCategory = 'debt';
    component.applyFilters();

    expect(component.filteredArticles.length).toBeGreaterThan(0);
    expect(component.filteredArticles.every(article => article.category === 'debt')).toBeTrue();
  });

  it('matches the search query against titles and summaries', () => {
    component.searchQuery = 'emergency fund';
    component.applyFilters();

    expect(component.filteredArticles.length).toBeGreaterThan(0);
    expect(component.filteredArticles.length).toBeLessThan(ARTICLES.length);
  });

  it('persists bookmarks across component instances', () => {
    const article = ARTICLES[0];
    component.toggleBookmark(article, new Event('click'));

    const reloaded = TestBed.createComponent(EducationComponent).componentInstance;
    expect(reloaded.progress.isBookmarked(article.id)).toBeTrue();
  });

  it('drops a card from the bookmarked-only view when it is un-bookmarked', () => {
    const article = ARTICLES[0];
    component.toggleBookmark(article, new Event('click'));
    component.bookmarkedOnly = true;
    component.applyFilters();
    expect(component.filteredArticles).toHaveSize(1);

    component.toggleBookmark(article, new Event('click'));
    expect(component.filteredArticles).toHaveSize(0);
  });

  it('clearFilters restores the full list', () => {
    component.searchQuery = 'nothing matches this';
    component.selectedLevel = 'intermediate';
    component.applyFilters();
    expect(component.hasActiveFilters).toBeTrue();

    component.clearFilters();
    expect(component.hasActiveFilters).toBeFalse();
    expect(component.filteredArticles).toHaveSize(ARTICLES.length);
  });
});
