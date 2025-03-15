import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyStatComponent } from './monthly-stat.component';

describe('MonthlyStatComponent', () => {
  let component: MonthlyStatComponent;
  let fixture: ComponentFixture<MonthlyStatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyStatComponent]
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
