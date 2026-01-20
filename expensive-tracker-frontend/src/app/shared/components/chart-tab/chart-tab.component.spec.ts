import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ChartTabComponent } from './chart-tab.component';

describe('ChartTabComponent', () => {
  let component: ChartTabComponent;
  let fixture: ComponentFixture<ChartTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartTabComponent],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ChartTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
