import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: '[appDropdown]',
  standalone: true
})
export class DropdownDirective {
  @Input() appDropdown = false;
  @Output() closeDropdown = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:mousedown', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (
      !this.elementRef.nativeElement.contains(target) &&
      !target.closest('.dropdown-toggle')
    ) {
      this.closeDropdown.emit();
    }
  }
}
