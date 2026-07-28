import { TestBed } from '@angular/core/testing';

import { EducationProgressService } from './education-progress.service';

const STORAGE_KEY = 'education_progress';

describe('EducationProgressService', () => {
  function create(): EducationProgressService {
    TestBed.configureTestingModule({});
    return TestBed.inject(EducationProgressService);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('starts empty', () => {
    const service = create();

    expect(service.bookmarkCount).toBe(0);
    expect(service.readCount).toBe(0);
    expect(service.isBookmarked('anything')).toBeFalse();
  });

  it('toggles a bookmark on and back off', () => {
    const service = create();

    service.toggleBookmark('a');
    expect(service.isBookmarked('a')).toBeTrue();
    expect(service.bookmarkCount).toBe(1);

    service.toggleBookmark('a');
    expect(service.isBookmarked('a')).toBeFalse();
    expect(service.bookmarkCount).toBe(0);
  });

  it('restores state written by a previous session', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bookmarked: ['a'], read: ['b', 'c'] }));

    const service = create();
    expect(service.isBookmarked('a')).toBeTrue();
    expect(service.isRead('b')).toBeTrue();
    expect(service.readCount).toBe(2);
  });

  it('discards corrupt storage instead of throwing', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');

    const service = create();
    expect(service.bookmarkCount).toBe(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('ignores a stored value of the wrong shape', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bookmarked: 'a', read: null }));

    const service = create();
    expect(service.bookmarkCount).toBe(0);
    expect(service.readCount).toBe(0);
  });

  it('setRead is idempotent in both directions', () => {
    const service = create();

    service.setRead('a', true);
    service.setRead('a', true);
    expect(service.readCount).toBe(1);

    service.setRead('a', false);
    service.setRead('a', false);
    expect(service.readCount).toBe(0);
  });
});
