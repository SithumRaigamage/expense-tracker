import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { SidebarService } from '../../../services/sidebar-service.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let sidebarService: SidebarService;

  beforeEach(async () => {
    // The header is standalone and declares its own imports; the spec only needs
    // to satisfy the services it injects.
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    sidebarService = TestBed.inject(SidebarService);
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('tracks the sidebar service mobile state', () => {
    expect(component.isMobileOpen).toBeFalse();

    sidebarService.toggleMobile();
    expect(component.isMobileOpen).toBeTrue();

    sidebarService.toggleMobile();
    expect(component.isMobileOpen).toBeFalse();
  });

  it('tracks the sidebar service expanded state', () => {
    expect(component.isSidebarExpanded).toBeTrue();

    sidebarService.toggleSidebar();
    expect(component.isSidebarExpanded).toBeFalse();
  });

  /*
    The "toggles the account menu" test that lived here covered
    `toggleApplicationMenu`/`isApplicationMenuOpen`, the kebab that hid the
    currency switcher and account menu behind an extra tap on mobile. Those
    controls are always visible now, so the toggle and its state are gone.
  */
});
