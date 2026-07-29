import { Injectable } from '@angular/core';

interface StoredProgress {
  bookmarked: string[];
  read: string[];
}

/**
 * Which articles the reader has bookmarked or finished.
 *
 * This lives in localStorage rather than the database on purpose: it is a
 * per-device reading convenience, not user data the app owes anyone. Nothing
 * here is worth a table, a migration and a round trip — and losing it costs the
 * reader a star they can click again.
 */
@Injectable({
  providedIn: 'root'
})
export class EducationProgressService {
  private static readonly STORAGE_KEY = 'education_progress';

  private bookmarked = new Set<string>();
  private read = new Set<string>();

  constructor() {
    this.load();
  }

  isBookmarked(articleId: string): boolean {
    return this.bookmarked.has(articleId);
  }

  isRead(articleId: string): boolean {
    return this.read.has(articleId);
  }

  get bookmarkCount(): number {
    return this.bookmarked.size;
  }

  get readCount(): number {
    return this.read.size;
  }

  toggleBookmark(articleId: string): void {
    if (!this.bookmarked.delete(articleId)) {
      this.bookmarked.add(articleId);
    }
    this.save();
  }

  setRead(articleId: string, isRead: boolean): void {
    if (isRead) {
      this.read.add(articleId);
    } else {
      this.read.delete(articleId);
    }
    this.save();
  }

  private load(): void {
    const raw = localStorage.getItem(EducationProgressService.STORAGE_KEY);
    if (!raw) return;

    // Anything can end up under a localStorage key — a half-written value, or
    // an older shape of this one. Bad data should cost the reader their
    // bookmarks, not break the page.
    try {
      const parsed = JSON.parse(raw) as Partial<StoredProgress>;
      this.bookmarked = new Set(Array.isArray(parsed.bookmarked) ? parsed.bookmarked : []);
      this.read = new Set(Array.isArray(parsed.read) ? parsed.read : []);
    } catch {
      localStorage.removeItem(EducationProgressService.STORAGE_KEY);
    }
  }

  private save(): void {
    const payload: StoredProgress = {
      bookmarked: [...this.bookmarked],
      read: [...this.read]
    };
    localStorage.setItem(EducationProgressService.STORAGE_KEY, JSON.stringify(payload));
  }
}
