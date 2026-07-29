import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyTransactionTabComponent } from './monthly-transaction-tab.component';

describe('MonthlyTransactionTabComponent', () => {
  let component: MonthlyTransactionTabComponent;
  let fixture: ComponentFixture<MonthlyTransactionTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyTransactionTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonthlyTransactionTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
