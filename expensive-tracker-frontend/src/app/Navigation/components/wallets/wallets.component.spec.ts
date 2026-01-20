import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletsComponent } from './wallets.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('WalletsComponent', () => {
  let component: WalletsComponent;
  let fixture: ComponentFixture<WalletsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WalletsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(WalletsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
