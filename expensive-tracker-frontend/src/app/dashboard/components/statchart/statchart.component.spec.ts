import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatchartComponent } from './statchart.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockChartComponent } from '../../../shared/mocks/chart.mock';

describe('StatchartComponent', () => {
  let component: StatchartComponent;
  let fixture: ComponentFixture<StatchartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatchartComponent, MockChartComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatchartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
