import { ElementRef, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DropdownDirective } from '../../../../core/directives/dropdown.directive';

describe('DropdownDirective', () => {
  let directive: DropdownDirective;
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement('div');

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ElementRef,
          useValue: new ElementRef(host)
        }
      ]
    });

    // The directive takes its ElementRef through inject(), so it has to be
    // constructed inside an injection context rather than handed one.
    directive = runInInjectionContext(
      TestBed.inject(EnvironmentInjector),
      () => new DropdownDirective()
    );
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });

  it('emits when a mousedown lands outside the host', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    const emitted = spyOn(directive.closeDropdown, 'emit');

    directive.onClickOutside({ target: outside } as unknown as MouseEvent);

    expect(emitted).toHaveBeenCalled();
    outside.remove();
  });

  it('stays quiet once destroyed', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    const emitted = spyOn(directive.closeDropdown, 'emit');

    directive.ngOnDestroy();
    directive.onClickOutside({ target: outside } as unknown as MouseEvent);

    expect(emitted).not.toHaveBeenCalled();
    outside.remove();
  });
});
