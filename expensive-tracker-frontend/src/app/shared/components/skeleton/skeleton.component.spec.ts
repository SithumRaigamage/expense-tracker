import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  let fixture: ComponentFixture<SkeletonComponent>;
  let component: SkeletonComponent;
  let block: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    block = fixture.nativeElement.querySelector('.skeleton');
  });

  it('fills its container by default, so it holds the space the content will need', () => {
    expect(block.style.width).toBe('100%');
  });

  it('takes explicit dimensions', () => {
    component.width = '12rem';
    component.height = '340px';
    fixture.detectChanges();

    expect(block.style.width).toBe('12rem');
    expect(block.style.height).toBe('340px');
  });

  it('applies the requested corner radius', () => {
    component.rounded = 'full';
    fixture.detectChanges();
    expect(block.classList).toContain('rounded-full');

    component.rounded = 'xl';
    fixture.detectChanges();
    expect(block.classList).toContain('rounded-xl');
    expect(block.classList).not.toContain('rounded-full');
  });

  // It conveys nothing a screen reader should announce; the surrounding widget
  // is responsible for describing what is loading.
  it('is hidden from assistive technology', () => {
    expect(block.getAttribute('aria-hidden')).toBe('true');
  });
});
