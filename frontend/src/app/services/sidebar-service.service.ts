import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private isOpenSubject = new BehaviorSubject<boolean>(true);
  private isMobileOpenSubject = new BehaviorSubject<boolean>(false);

  isOpen$ = this.isOpenSubject.asObservable();
  isMobileOpen$ = this.isMobileOpenSubject.asObservable();

  get isMobileOpen(): boolean {
    return this.isMobileOpenSubject.value;
  }

  toggleSidebar() {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }

  toggleMobile() {
    this.isMobileOpenSubject.next(!this.isMobileOpenSubject.value);
  }

  getSidebarState(): boolean {
    return this.isOpenSubject.value;
  }
}
