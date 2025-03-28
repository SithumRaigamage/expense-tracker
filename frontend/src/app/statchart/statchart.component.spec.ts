import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatchartComponent } from './statchart.component';

describe('StatchartComponent', () => {
  let component: StatchartComponent;
  let fixture: ComponentFixture<StatchartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatchartComponent]
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
