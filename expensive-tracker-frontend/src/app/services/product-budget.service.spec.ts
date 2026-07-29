import { TestBed } from '@angular/core/testing';

import { ProductBudgetService } from './product-budget.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ProductBudgetService', () => {
  let service: ProductBudgetService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ProductBudgetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
