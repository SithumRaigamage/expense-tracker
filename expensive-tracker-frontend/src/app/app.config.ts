import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter, TitleStrategy, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { AppTitleStrategy } from './core/title.strategy';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideEcharts } from 'ngx-echarts';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    /*
      View transitions give every route change one cross-fade-and-rise, driven
      entirely by the `::view-transition-*` rules in styles.css. The browser
      animates a snapshot on the compositor, so it costs no JavaScript per
      navigation and degrades to an instant cut where the API is unsupported.
      The first paint is skipped — animating it only delays it.
    */
    provideRouter(routes, withViewTransitions({ skipInitialTransition: true })),
    provideHttpClient(withInterceptorsFromDi()),
    /*
      The async variant keeps Angular's animation engine out of the initial
      bundle; it is still needed because Material's dialogs depend on it. The
      app's own motion is plain CSS, so nothing else pulls this in.
    */
    provideAnimationsAsync(),
    provideEcharts(),
    {
      provide: TitleStrategy,
      useClass: AppTitleStrategy
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    /*
      Service worker, active in production builds only.

      ngsw-config.json deliberately declares NO `dataGroups`, so the worker
      caches the application shell — JS, CSS, fonts, images — and nothing else.
      Do not add an `/api/**` dataGroup:

        - These are account balances and transactions. A cached response would
          show someone a stale figure and give them no way to tell.
        - Responses are authorised by an httpOnly session cookie, but the Cache
          API is origin-scoped, not user-scoped. Caching them would leave one
          user's financial data readable by the next person to sign in on a
          shared machine.

      `navigationUrls` also excludes /api so a navigation to an API path falls
      through to the network instead of being answered with index.html.
    */
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
