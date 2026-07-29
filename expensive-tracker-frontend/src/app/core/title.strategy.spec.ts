import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot } from '@angular/router';
import { AppTitleStrategy } from './title.strategy';

describe('AppTitleStrategy', () => {
  let strategy: AppTitleStrategy;
  let title: Title;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AppTitleStrategy, Title] });
    strategy = TestBed.inject(AppTitleStrategy);
    title = TestBed.inject(Title);
  });

  it('appends the app name to a route title', () => {
    spyOn(strategy, 'buildTitle').and.returnValue('Dashboard');

    strategy.updateTitle({} as RouterStateSnapshot);

    expect(title.getTitle()).toBe('Dashboard · Expensify');
  });

  it('falls back to the app name when the route declares no title', () => {
    spyOn(strategy, 'buildTitle').and.returnValue(undefined);

    strategy.updateTitle({} as RouterStateSnapshot);

    expect(title.getTitle()).toBe('Expensify');
  });
});
