import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReleaseNote {
  _id?: string;
  version: string;
  date: string;
  features: string[];
  bugfixes: string[];
  improvements: string[];
  isPublished?: boolean;
  isExpanded?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ReleaseNoteService {
  private apiUrl = `${environment.apiUrl}/release-notes`;

  constructor(private http: HttpClient) { }

  /**
   * Get all release notes
   */
  getReleaseNotes(): Observable<ReleaseNote[]> {
    return this.http.get<ReleaseNote[]>(this.apiUrl);
  }

  /**
   * Get a specific release note by version
   */
  getReleaseNoteByVersion(version: string): Observable<ReleaseNote> {
    return this.http.get<ReleaseNote>(`${this.apiUrl}/${version}`);
  }

  /**
   * Create a new release note (admin only)
   */
  createReleaseNote(releaseNote: ReleaseNote): Observable<ReleaseNote> {
    return this.http.post<ReleaseNote>(this.apiUrl, releaseNote);
  }

  /**
   * Update an existing release note (admin only)
   */
  updateReleaseNote(id: string, releaseNote: ReleaseNote): Observable<ReleaseNote> {
    return this.http.put<ReleaseNote>(`${this.apiUrl}/${id}`, releaseNote);
  }

  /**
   * Delete a release note (admin only)
   */
  deleteReleaseNote(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
