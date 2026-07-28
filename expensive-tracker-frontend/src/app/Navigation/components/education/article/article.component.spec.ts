import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { ArticleComponent } from './article.component';
import { ARTICLES } from '../../../../shared/content/financial-education';

describe('ArticleComponent', () => {
  let component: ArticleComponent;
  let fixture: ComponentFixture<ArticleComponent>;
  let paramMap: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let router: jasmine.SpyObj<Router>;

  async function createComponent(articleId: string) {
    localStorage.clear();
    paramMap = new BehaviorSubject(convertToParamMap({ articleId }));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ArticleComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: paramMap.asObservable() } },
        { provide: Router, useValue: router }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArticleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => localStorage.clear());

  it('renders the article named in the route', async () => {
    await createComponent(ARTICLES[0].id);

    expect(component.article).toBe(ARTICLES[0]);
    expect(fixture.nativeElement.textContent).toContain(ARTICLES[0].title);
  });

  it('offers the following article as the next one', async () => {
    await createComponent(ARTICLES[0].id);
    expect(component.nextArticle).toBe(ARTICLES[1]);
  });

  it('has no next article on the last one', async () => {
    await createComponent(ARTICLES[ARTICLES.length - 1].id);
    expect(component.nextArticle).toBeUndefined();
  });

  it('sends an unknown id back to the list', async () => {
    await createComponent('not-a-real-article');

    expect(component.article).toBeUndefined();
    expect(router.navigate).toHaveBeenCalledWith(['/financial-education']);
  });

  it('follows the route when the next-article link changes the id in place', async () => {
    await createComponent(ARTICLES[0].id);

    paramMap.next(convertToParamMap({ articleId: ARTICLES[1].id }));
    expect(component.article).toBe(ARTICLES[1]);
  });

  it('persists read state', async () => {
    await createComponent(ARTICLES[0].id);

    component.toggleRead();
    expect(component.isRead).toBeTrue();
    expect(localStorage.getItem('education_progress')).toContain(ARTICLES[0].id);

    component.toggleRead();
    expect(component.isRead).toBeFalse();
  });

  it('persists bookmarks', async () => {
    await createComponent(ARTICLES[0].id);

    component.toggleBookmark();
    expect(component.isBookmarked).toBeTrue();
  });
});
