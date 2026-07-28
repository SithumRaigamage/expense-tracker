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

  it('toggles the account menu', () => {
    expect(component.isApplicationMenuOpen).toBeFalse();

    component.toggleApplicationMenu();
    expect(component.isApplicationMenuOpen).toBeTrue();
  });
});
