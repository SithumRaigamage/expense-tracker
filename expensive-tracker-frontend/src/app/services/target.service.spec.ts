import { TestBed } from '@angular/core/testing';

import { TargetService } from './target.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('TargetService', () => {
  let service: TargetService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(TargetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
