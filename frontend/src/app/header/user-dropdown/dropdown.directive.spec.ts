import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DropdownDirective } from '../../directives/dropdown.directive';

describe('DropdownDirective', () => {
  let directive: DropdownDirective;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ElementRef,
          useValue: { nativeElement: document.createElement('div') }
        }
      ]
    });

    const elementRef = TestBed.inject(ElementRef);
    directive = new DropdownDirective(elementRef);
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });
});
