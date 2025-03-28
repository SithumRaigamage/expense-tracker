import { TestBed } from '@angular/core/testing';

import { ProductbudgetService } from './productbudget.service';

describe('ProductbudgetService', () => {
  let service: ProductbudgetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductbudgetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
