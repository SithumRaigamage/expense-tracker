import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ThemeToggleButtonComponent } from './theme-toggle-button/theme-toggle-button.component';
import { NotificationDropdownComponent } from './notification-dropdown/notification-dropdown.component';
import { UserDropdownComponent } from './user-dropdown/user-dropdown.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterModule,
        ThemeToggleButtonComponent,
        NotificationDropdownComponent,
        UserDropdownComponent
      ],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
