import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RadialchartComponent } from './radialchart.component';

describe('RadialchartComponent', () => {
  let component: RadialchartComponent;
  let fixture: ComponentFixture<RadialchartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RadialchartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RadialchartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
