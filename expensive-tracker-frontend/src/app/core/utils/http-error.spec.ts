import { HttpErrorResponse } from '@angular/common/http';
import { toUserMessage } from './http-error';

const httpError = (status: number, body?: unknown) =>
  new HttpErrorResponse({ status, error: body });

describe('toUserMessage', () => {
  it('prefers the API message when there is one', () => {
    const message = toUserMessage(httpError(400, { error: 'Wallet name is required' }));
    expect(message).toBe('Wallet name is required');
  });

  // Regression: services checked 400 for duplicates while the API answers 409,
  // so a name conflict surfaced as "please try again" — advice that can't work.
  it('surfaces a 409 conflict message', () => {
    const message = toUserMessage(httpError(409, { error: 'A wallet with this name already exists' }));
    expect(message).toBe('A wallet with this name already exists');
  });

  it('explains an unreachable server', () => {
    expect(toUserMessage(httpError(0))).toContain('Cannot reach the server');
  });

  it('never leaks a server error body', () => {
    const message = toUserMessage(httpError(500, { error: 'ReferenceError: x is not defined', stack: 'at Object...' }));
    expect(message).not.toContain('ReferenceError');
    expect(message).not.toContain('stack');
  });

  it('reports rate limiting in the user\'s terms', () => {
    expect(toUserMessage(httpError(429))).toContain('Too many attempts');
  });

  it('falls back when the failure is not an HTTP response', () => {
    expect(toUserMessage(new Error('boom'), 'Could not save')).toBe('Could not save');
  });

  it('falls back when the body carries no message', () => {
    expect(toUserMessage(httpError(418), 'Could not save')).toBe('Could not save');
  });
});
