import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ImportScanComponent } from './import-scan.component';
import { ImportService } from '../../../services/import.service';
import { TransactionService } from '../../../services/transaction.service';
import { WalletService } from '../../../services/wallet.service';

describe('ImportScanComponent', () => {
  let component: ImportScanComponent;
  let fixture: ComponentFixture<ImportScanComponent>;
  let importService: jasmine.SpyObj<ImportService>;
  let transactionService: jasmine.SpyObj<TransactionService>;

  const wallets = [{ id: 'w1', name: 'Bank', type: 'bank', isActive: true }];
  const categories = [{ _id: 'c1', name: 'Food', type: 'expense' }];

  beforeEach(async () => {
    importService = jasmine.createSpyObj('ImportService', ['scanReceipt', 'importBankText', 'importBankFile', 'importSms']);
    transactionService = jasmine.createSpyObj('TransactionService', ['getCategories', 'addTransaction', 'refreshTransactions']);
    const walletService = { wallets$: of(wallets) };

    transactionService.getCategories.and.returnValue(of(categories) as any);

    await TestBed.configureTestingModule({
      imports: [ImportScanComponent],
      providers: [
        { provide: ImportService, useValue: importService },
        { provide: TransactionService, useValue: transactionService },
        { provide: WalletService, useValue: walletService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ImportScanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit
  });

  it('creates and loads wallets + categories, defaulting the wallet', () => {
    expect(component).toBeTruthy();
    expect(component.wallets.length).toBe(1);
    expect(component.categories.length).toBe(1);
    expect(component.selectedWalletId).toBe('w1');
  });

  it('switches main tabs', () => {
    expect(component.activeTab).toBe('receipt');
    component.setTab('import');
    expect(component.activeTab).toBe('import');
  });

  describe('receipt scan', () => {
    const scanResult = {
      receipt: 'http://x/uploads/r.jpg',
      ocrConfigured: true,
      suggestion: { title: 'KEELLS', amount: 1200, date: '2026-01-12T00:00:00.000Z', merchant: 'KEELLS', category: 'c1', categoryName: 'Food' },
      rawText: 'KEELLS'
    };

    it('stores the scan result on success', () => {
      importService.scanReceipt.and.returnValue(of(scanResult));
      component.receiptFile = new File(['x'], 'r.jpg');

      component.scanReceipt();

      expect(component.scanResult).toEqual(scanResult);
      expect(component.scanning).toBeFalse();
    });

    it('surfaces an error message on failure', () => {
      importService.scanReceipt.and.returnValue(throwError(() => new Error('scan failed')));
      component.receiptFile = new File(['x'], 'r.jpg');

      component.scanReceipt();

      expect(component.receiptError).toBe('scan failed');
      expect(component.scanResult).toBeNull();
    });

    it('validates before creating an expense', () => {
      component.scanResult = { ...scanResult, suggestion: { ...scanResult.suggestion, amount: null } };
      component.createFromReceipt();
      expect(component.receiptError).toContain('amount');
      expect(transactionService.addTransaction).not.toHaveBeenCalled();
    });

    it('creates an expense from a valid suggestion', () => {
      transactionService.addTransaction.and.returnValue(of({}) as any);
      component.scanResult = scanResult as any;
      component.selectedWalletId = 'w1';

      component.createFromReceipt();

      expect(transactionService.addTransaction).toHaveBeenCalled();
      expect(component.expenseCreated).toBeTrue();
    });
  });

  describe('import', () => {
    const summary = { total: 2, created: 0, duplicates: 0, unmatched: 0, dryRun: true, results: [] };

    it('requires a wallet before running', () => {
      component.selectedWalletId = '';
      component.runImport(true);
      expect(component.importError).toContain('wallet');
    });

    it('runs a CSV-text preview and stores the summary', () => {
      importService.importBankText.and.returnValue(of(summary));
      component.setImportMode('text');
      component.csvText = 'Date,Description,Amount\n12/01/2026,UBER,-100';
      component.selectedWalletId = 'w1';

      component.runImport(true);

      expect(importService.importBankText).toHaveBeenCalled();
      expect(component.summary).toEqual(summary);
      expect(component.lastRunWasPreview).toBeTrue();
    });

    it('refreshes transactions after a committing import that created rows', () => {
      importService.importSms.and.returnValue(of({ ...summary, dryRun: false, created: 1 }));
      component.setImportMode('sms');
      component.smsText = 'debited LKR 100 at CAFE';
      component.selectedWalletId = 'w1';

      component.runImport(false);

      expect(transactionService.refreshTransactions).toHaveBeenCalled();
    });
  });

  it('maps statuses to colour classes', () => {
    expect(component.statusClass('created')).toContain('green');
    expect(component.statusClass('duplicate')).toContain('amber');
    expect(component.statusClass('unmatched')).toContain('gray');
    expect(component.statusClass('error')).toContain('red');
  });
});
