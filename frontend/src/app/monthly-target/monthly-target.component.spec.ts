import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyTargetComponent } from './monthly-target.component';

describe('MonthlyTargetComponent', () => {
  let component: MonthlyTargetComponent;
  let fixture: ComponentFixture<MonthlyTargetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyTargetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonthlyTargetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
