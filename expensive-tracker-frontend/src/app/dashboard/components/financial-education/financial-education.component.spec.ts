import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FinancialEducationComponent } from './financial-education.component';
import { ARTICLES } from '../../../shared/content/financial-education';

describe('FinancialEducationComponent', () => {
  let component: FinancialEducationComponent;
  let fixture: ComponentFixture<FinancialEducationComponent>;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [FinancialEducationComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialEducationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('previews a handful of articles rather than all of them', () => {
    expect(component.previewArticles.length).toBeGreaterThan(0);
    expect(component.previewArticles.length).toBeLessThan(ARTICLES.length);
  });

  it('shows only the selected topic', () => {
    component.selectedCategory = 'saving';

    expect(component.previewArticles.length).toBeGreaterThan(0);
    expect(component.previewArticles.every(article => article.category === 'saving')).toBeTrue();
  });

  it('previews articles that exist in the shared content set', () => {
    const ids = ARTICLES.map(article => article.id);
    expect(component.previewArticles.every(article => ids.includes(article.id))).toBeTrue();
  });
});
