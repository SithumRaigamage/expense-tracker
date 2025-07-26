import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialEducationComponent } from './financial-education.component';

describe('FinancialEducationComponent', () => {
  let component: FinancialEducationComponent;
  let fixture: ComponentFixture<FinancialEducationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialEducationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialEducationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
