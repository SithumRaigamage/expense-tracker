import { SafeHtmlPipe } from './safehtml.pipe';
import { DomSanitizer } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';

describe('SafehtmlPipe', () => {
  it('create an instance', () => {
    TestBed.configureTestingModule({
      providers: [DomSanitizer]
    });
    const sanitizer = TestBed.inject(DomSanitizer);
    const pipe = new SafeHtmlPipe(sanitizer);
    expect(pipe).toBeTruthy();
  });
});
