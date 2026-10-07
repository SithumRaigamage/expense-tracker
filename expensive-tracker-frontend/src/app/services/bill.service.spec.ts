import { TestBed } from '@angular/core/testing';

import { BillsService } from './bill.service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

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

  // Audit M7: the server accepts one payment per due date, so the request must
  // carry the exact due date the bill came with.
  it('sends the due date being paid along with the wallet', () => {
    const http = TestBed.inject(HttpTestingController);
    const dueDate = new Date('2027-01-31T00:00:00.000Z');

    service.payBill('b1', 'w1', dueDate).subscribe();

    const req = http.expectOne(r => r.method === 'POST' && r.url.endsWith('/bills/b1/pay'));
    expect(req.request.body).toEqual({ walletId: 'w1', dueDate: '2027-01-31T00:00:00.000Z' });
    req.flush({ success: true, data: { bill: { _id: 'b1', dueDate: '2027-02-28T00:00:00.000Z' } } });
  });
});
