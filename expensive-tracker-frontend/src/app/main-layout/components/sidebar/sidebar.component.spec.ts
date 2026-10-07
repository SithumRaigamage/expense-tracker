import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarComponent } from './sidebar.component';
import { Router, provideRouter } from '@angular/router';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('closes other submenus when opening a submenu', () => {
    const parentItems = component.othersItems.filter(item => item.subItems);
    const first = parentItems[0];
    const second = parentItems[1];
    first.isOpen = true;

    component.toggleSubNav(second, new MouseEvent('click'));

    expect(first.isOpen).toBeFalse();
    expect(second.isOpen).toBeTrue();
  });

  it('marks only the current route hierarchy as active', () => {
    const router = TestBed.inject(Router);
    spyOnProperty(router, 'url', 'get').and.returnValue('/settings/profile');

    const settings = component.othersItems.find(item => item.path === '/settings');
    const dashboard = component.navItems.find(item => item.path === '/dashboard');

    expect(settings).toBeDefined();
    expect(dashboard).toBeDefined();
    expect(component.isItemActive(settings!)).toBeTrue();
    expect(component.isItemActive(dashboard!)).toBeFalse();
  });
});
