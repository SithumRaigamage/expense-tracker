import { HttpErrorResponse } from '@angular/common/http';

/**
 * Turns an HTTP failure into something worth showing a user.
 *
 * Each service used to hand-roll this, which drifted: several mapped duplicate
 * names to 400 while the API answers 409, so a "name already exists" conflict
 * surfaced as "please try again" — advice that could never work. 401 was mapped
 * too, but the interceptor now ends the session and redirects, so that branch
 * only ever flashed a message on a page the user was already leaving.
 *
 * @param error    the failure from an HttpClient stream
 * @param fallback what to say when the server gave no usable reason
 */
export function toUserMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const httpError = error as HttpErrorResponse;

  if (!httpError || typeof httpError.status !== 'number') {
    return fallback;
  }

  // The API's own message is the most specific thing available, and the backend
  // now names the failing field rather than saying "Validation failed".
  const apiMessage = httpError.error?.error ?? httpError.error?.message;

  switch (httpError.status) {
    case 0:
      return 'Cannot reach the server. Check your connection and try again.';
    case 400:
      return apiMessage || 'Some of the details are invalid. Please check and try again.';
    case 401:
      // The interceptor is already redirecting to login.
      return apiMessage || 'Your session has expired. Please sign in again.';
    case 403:
      return apiMessage || 'You do not have permission to do that.';
    case 404:
      return apiMessage || 'We could not find what you were looking for.';
    case 409:
      return apiMessage || 'That conflicts with something that already exists.';
    case 413:
      return 'That file is too large. Please choose a smaller one.';
    case 415:
      return 'That file type is not supported.';
    case 429:
      return apiMessage || 'Too many attempts. Please wait a moment and try again.';
    default:
      // Never surface a raw 500 body — it can carry stack traces in development.
      return httpError.status >= 500
        ? 'The server had a problem completing that. Please try again shortly.'
        : apiMessage || fallback;
  }
}
