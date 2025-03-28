import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmergencyFundComponent } from './emergency-fund.component';

describe('EmergencyFundComponent', () => {
  let component: EmergencyFundComponent;
  let fixture: ComponentFixture<EmergencyFundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergencyFundComponent]
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
