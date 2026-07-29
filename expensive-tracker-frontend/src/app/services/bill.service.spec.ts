import { TestBed } from '@angular/core/testing';

import { BillsService } from './bill.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('BillService', () => {
  let service: BillsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(BillsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
