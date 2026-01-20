import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { MonthlyStatComponent } from './monthly-stat.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockAppChartComponent } from '../../../shared/mocks/chart.mock';

describe('MonthlyStatComponent', () => {
  let component: MonthlyStatComponent;
  let fixture: ComponentFixture<MonthlyStatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyStatComponent, MockAppChartComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonthlyStatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
