import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { EmergencyFundComponent } from './emergency-fund.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockChartComponent } from '../../../shared/mocks/chart.mock';

describe('EmergencyFundComponent', () => {
  let component: EmergencyFundComponent;
  let fixture: ComponentFixture<EmergencyFundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergencyFundComponent, MockChartComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmergencyFundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
