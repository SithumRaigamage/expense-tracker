import { ElementRef } from '@angular/core';
import { DropdownDirective } from '../../directives/dropdown.directive';

describe('DropdownDirective', () => {
  it('should create an instance', () => {
    const elementRef = new ElementRef(document.createElement('div'));
    const directive = new DropdownDirective(elementRef);
    expect(directive).toBeTruthy();
  });
});
