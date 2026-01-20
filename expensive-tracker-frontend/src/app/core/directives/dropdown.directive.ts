import { Directive, ElementRef, EventEmitter, HostListener, Output, Input, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appDropdown]',
  standalone: true
})
export class DropdownDirective implements OnDestroy {
  @Input() appDropdown: boolean = false;
  @Output() closeDropdown = new EventEmitter<void>();
  private isDestroyed = false;

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:mousedown', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (this.isDestroyed) return;
    const target = event.target as HTMLElement;
    if (
      !this.elementRef.nativeElement.contains(target) &&
      !target.closest('.dropdown-toggle')
    ) {
      this.closeDropdown.emit();
    }
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
  }
}
