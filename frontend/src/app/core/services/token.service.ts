import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  /**
   * Get the authentication token from local storage
   * @returns The token or null if not found
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Save the authentication token to local storage
   * @param token The token to save
   */
  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  /**
   * Remove the authentication token from local storage
   */
  removeToken(): void {
    localStorage.removeItem('token');
  }
}
