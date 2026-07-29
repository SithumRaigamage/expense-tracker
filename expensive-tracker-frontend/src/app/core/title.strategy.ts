import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const APP_NAME = 'Expensify';

/**
 * Angular's default strategy replaces the whole document title with the route's
 * own, so the product name showed up on the very first paint and never again —
 * every tab afterwards read a bare "Dashboard" or "Wallets". Append it instead,
 * and fall back to it for routes that declare no title of their own.
 */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);


  override updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);
    this.title.setTitle(routeTitle ? `${routeTitle} · ${APP_NAME}` : APP_NAME);
  }
}
