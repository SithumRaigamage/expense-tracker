/**
 * The API is same-origin in every environment: in production it is served from
 * the same host, and in development `ng serve` proxies /api to the backend (see
 * proxy.conf.json). That is what lets the session cookie be SameSite=Strict —
 * a cross-origin API would force SameSite=None and need CSRF tokens instead.
 */
export const environment = {
  production: false,
  apiUrl: '/api/v1'
};
