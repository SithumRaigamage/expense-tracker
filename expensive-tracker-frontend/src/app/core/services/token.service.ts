import { Injectable } from '@angular/core';

const SESSION_FLAG = 'has_session';

/**
 * Tracks *whether* a session exists, not what it contains.
 *
 * The JWT used to live in localStorage, which meant any injected script could
 * read it and replay it anywhere. It travels as an httpOnly cookie now — the
 * browser attaches it automatically and JavaScript cannot see it — so there is
 * nothing left here to store.
 *
 * What the app still needs is a synchronous hint for the route guard, so it can
 * decide whether to render or bounce to /login without waiting on a round trip.
 * This flag is exactly that hint and nothing more: forging it grants no access,
 * because every request is still authorised by the cookie on the server.
 */
@Injectable({
  providedIn: 'root'
})
export class TokenService {
  /** True when this browser has signed in and not signed out again. */
  hasSession(): boolean {
    return localStorage.getItem(SESSION_FLAG) === 'true';
  }

  markSignedIn(): void {
    localStorage.setItem(SESSION_FLAG, 'true');
  }

  markSignedOut(): void {
    localStorage.removeItem(SESSION_FLAG);
    // Clear the pre-cookie token if this browser still has one lying around.
    localStorage.removeItem('token');
  }
}
