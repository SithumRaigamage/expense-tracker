import { TestBed } from '@angular/core/testing';

import { BillsService } from './bill.service';

describe('BillService', () => {
  let service: BillsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BillsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
