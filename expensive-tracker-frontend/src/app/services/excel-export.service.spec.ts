import { TestBed } from '@angular/core/testing';
import { Workbook } from 'exceljs';
import { ExcelExportService } from './excel-export.service';

/**
 * Verifies the workbook the service produces, not just that it ran: the export
 * moved from `xlsx` to `exceljs` (the npm build of SheetJS is abandoned and
 * carries unfixable advisories), and a silently malformed file would be easy to
 * miss.
 */
describe('ExcelExportService', () => {
  let service: ExcelExportService;
  let downloaded: Blob | null;

  const rows = [
    { id: 'abc123', _internal: 'hidden', description: 'Coffee', amountSpent: 4.5, createdAt: new Date('2026-01-15T10:00:00Z') },
    { id: 'def456', _internal: 'hidden', description: 'A very long description that should be clamped for readability', amountSpent: 120, createdAt: new Date('2026-02-01T10:00:00Z') }
  ];

  /** Capture the blob the service hands to the browser instead of downloading it. */
  const captureDownload = () => {
    downloaded = null;
    spyOn(URL, 'createObjectURL').and.callFake((blob: Blob | MediaSource) => {
      downloaded = blob as Blob;
      return 'blob:mock';
    });
    spyOn(URL, 'revokeObjectURL').and.stub();
    spyOn(HTMLAnchorElement.prototype, 'click').and.stub();
  };

  const readBack = async (): Promise<Workbook> => {
    const workbook = new Workbook();
    await workbook.xlsx.load(await downloaded!.arrayBuffer());
    return workbook;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExcelExportService);
    captureDownload();
  });

  it('writes a readable workbook with the requested sheet', async () => {
    await service.exportToExcel(rows, 'transactions', 'Transactions');

    expect(downloaded).toBeTruthy();
    const workbook = await readBack();
    expect(workbook.worksheets.length).toBe(1);
    expect(workbook.getWorksheet('Transactions')).toBeTruthy();
  });

  it('turns camelCase keys into readable headers', async () => {
    await service.exportToExcel(rows, 'transactions');
    const sheet = (await readBack()).worksheets[0];

    const headers = sheet.getRow(1).values as string[];
    expect(headers).toContain('Amount Spent');
    expect(headers).toContain('Created At');
  });

  it('omits internal fields from the export', async () => {
    await service.exportToExcel(rows, 'transactions');
    const sheet = (await readBack()).worksheets[0];

    const headers = (sheet.getRow(1).values as string[]).join(' ');
    expect(headers).not.toContain('Internal');
    expect(headers).not.toContain('Id');
  });

  it('writes one row per record with the values intact', async () => {
    await service.exportToExcel(rows, 'transactions');
    const sheet = (await readBack()).worksheets[0];

    expect(sheet.rowCount).toBe(rows.length + 1); // + header
    const firstRow = sheet.getRow(2).values as any[];
    expect(firstRow).toContain('Coffee');
    expect(firstRow).toContain(4.5);
  });

  it('formats dates as plain calendar days', async () => {
    await service.exportToExcel(rows, 'transactions');
    const sheet = (await readBack()).worksheets[0];

    expect((sheet.getRow(2).values as any[]).join(' ')).toContain('2026-01-15');
  });

  it('clamps very wide columns', async () => {
    await service.exportToExcel(rows, 'transactions');
    const sheet = (await readBack()).worksheets[0];

    sheet.columns.forEach(column => expect(column.width!).toBeLessThanOrEqual(50));
  });

  it('writes one sheet per data set when exporting several', async () => {
    await service.exportAllToExcel({ Transactions: rows, Wallets: rows }, 'everything');

    const workbook = await readBack();
    expect(workbook.worksheets.map(w => w.name).sort()).toEqual(['Transactions', 'Wallets']);
  });

  it('skips empty data sets rather than writing blank sheets', async () => {
    await service.exportAllToExcel({ Transactions: rows, Empty: [] }, 'everything');

    const workbook = await readBack();
    expect(workbook.worksheets.map(w => w.name)).toEqual(['Transactions']);
  });

  it('does nothing when there is no data at all', async () => {
    await service.exportToExcel([], 'nothing');
    expect(downloaded).toBeNull();
  });

  it('sanitises sheet names Excel would reject', async () => {
    await service.exportAllToExcel({ 'Bills/Payments: 2026': rows }, 'bills');

    const workbook = await readBack();
    const name = workbook.worksheets[0].name;
    expect(name).not.toMatch(/[:\\/?*[\]]/);
    expect(name.length).toBeLessThanOrEqual(31);
  });
});
