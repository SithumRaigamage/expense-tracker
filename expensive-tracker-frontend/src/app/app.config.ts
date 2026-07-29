import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, TitleStrategy, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { AppTitleStrategy } from './core/title.strategy';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideEcharts } from 'ngx-echarts';

import { routes } from './app.routes';

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
    }
  ]
};
