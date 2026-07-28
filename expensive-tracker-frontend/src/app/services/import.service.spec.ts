import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ImportService, ImportSummary, ReceiptScanResult } from './import.service';
import { environment } from '../../environments/environment';

describe('ImportService', () => {
  let service: ImportService;
  let httpMock: HttpTestingController;
  const api = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ImportService]
    });
    service = TestBed.inject(ImportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  it('scanReceipt posts multipart form data and unwraps data', () => {
    const mock: ReceiptScanResult = {
      receipt: 'http://x/uploads/r.jpg',
      ocrConfigured: true,
      suggestion: { title: 'KEELLS', amount: 1200, date: '2026-01-12T00:00:00.000Z', merchant: 'KEELLS', category: 'c1', categoryName: 'Food' },
      rawText: 'KEELLS\nTOTAL 1200'
    };

    let result: ReceiptScanResult | undefined;
    service.scanReceipt(new File(['x'], 'r.jpg')).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`${api}/expenses/receipt/scan`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    req.flush({ success: true, data: mock });

    expect(result).toEqual(mock);
  });

  it('importBankText posts JSON with csv + options', () => {
    const summary: ImportSummary = { total: 1, created: 1, duplicates: 0, unmatched: 0, dryRun: false, results: [] };
    service.importBankText('Date,Description,Amount', { walletId: 'w1', dryRun: false }).subscribe();

    const req = httpMock.expectOne(`${api}/imports/bank`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ csv: 'Date,Description,Amount', walletId: 'w1', dryRun: false });
    req.flush({ success: true, data: summary });
  });

  it('importBankFile posts multipart with the file and options', () => {
    service.importBankFile(new File(['a,b'], 's.csv'), { walletId: 'w1', dryRun: true }).subscribe();

    const req = httpMock.expectOne(`${api}/imports/bank`);
    const body = req.request.body as FormData;
    expect(body instanceof FormData).toBeTrue();
    expect(body.get('walletId')).toBe('w1');
    expect(body.get('dryRun')).toBe('true');
    expect(body.get('file')).toBeTruthy();
    req.flush({ success: true, data: { total: 0, created: 0, duplicates: 0, unmatched: 0, dryRun: true, results: [] } });
  });

  it('importSms posts the messages array', () => {
    service.importSms(['msg one', 'msg two'], { walletId: 'w1' }).subscribe();

    const req = httpMock.expectOne(`${api}/imports/sms`);
    expect(req.request.body).toEqual({ messages: ['msg one', 'msg two'], walletId: 'w1' });
    req.flush({ success: true, data: { total: 2, created: 2, duplicates: 0, unmatched: 0, dryRun: false, results: [] } });
  });

  it('maps backend errors to a readable message', () => {
    let error: Error | undefined;
    service.importSms(['x']).subscribe({ error: (e) => (error = e) });

    const req = httpMock.expectOne(`${api}/imports/sms`);
    req.flush({ success: false, error: 'No recognizable transaction alerts found' }, { status: 400, statusText: 'Bad Request' });

    expect(error?.message).toBe('No recognizable transaction alerts found');
  });
});
