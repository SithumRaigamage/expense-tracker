import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageWalletsComponent } from './manage-wallets.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ManageWalletsComponent', () => {
  let component: ManageWalletsComponent;
  let fixture: ComponentFixture<ManageWalletsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageWalletsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ManageWalletsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
