import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RadialChartComponent } from './radialchart.component'; // Fixed casing

describe('RadialChartComponent', () => {
  let component: RadialChartComponent;
  let fixture: ComponentFixture<RadialChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RadialChartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RadialChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
