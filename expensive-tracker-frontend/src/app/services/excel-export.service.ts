import { Injectable } from '@angular/core';
import type { Workbook, Worksheet } from 'exceljs';

/**
 * Excel export.
 *
 * Built on exceljs rather than `xlsx`: the npm build of SheetJS is abandoned and
 * carries unpatched prototype-pollution and ReDoS advisories with no fix
 * available on the registry. The public API here is unchanged, so callers did
 * not need to move.
 *
 * exceljs writes asynchronously, so the export methods return a promise. The
 * existing callers ignore the return value, which stays valid — awaiting it just
 * lets a caller know when the download has been handed to the browser.
 *
 * The library is ~900 kB, so it is imported dynamically: pages that merely offer
 * an export button no longer pay for it, only the click does.
 */
/**
 * A prepared row, keyed by the pretty column header. Callers pass their own
 * domain objects (Wallet, Transaction, …); prepareDataForExport turns each one
 * into this shape.
 */
export type ExportRow = Record<string, unknown>;

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {

  /** Cap column width so one long note cannot produce an unreadable sheet. */
  private static readonly MAX_COLUMN_CHARS = 50;

  /**
   * Export a single data array to an Excel file with one sheet
   */
  async exportToExcel(data: object[], fileName: string, sheetName = 'Sheet1'): Promise<void> {
    if (!data || data.length === 0) return;

    const workbook = await this.newWorkbook();
    this.addSheet(workbook, sheetName, data);

    await this.download(workbook, fileName);
  }

  /**
   * Export multiple data arrays to an Excel file with multiple sheets
   */
  async exportAllToExcel(sheetsData: Record<string, object[]>, fileName: string): Promise<void> {
    const workbook = await this.newWorkbook();

    Object.keys(sheetsData).forEach(sheetName => {
      const data = sheetsData[sheetName];
      if (data && data.length > 0) {
        this.addSheet(workbook, sheetName, data);
      }
    });

    if (workbook.worksheets.length === 0) return;

    await this.download(workbook, fileName);
  }

  formatDataForExport(data: object[]): object[] {
    return data; // Keeping it for compatibility with previous calls, logic moved to prepareDataForExport
  }

  /** Pulls exceljs in on demand so it never lands in a page's bundle. */
  private async newWorkbook(): Promise<Workbook> {
    const ExcelJS = await import('exceljs');
    return new ExcelJS.Workbook();
  }

  private addSheet(workbook: Workbook, sheetName: string, data: object[]): void {
    const rows = this.prepareDataForExport(data);
    const headers = Object.keys(rows[0] ?? {});
    if (headers.length === 0) return;

    // Excel rejects sheet names over 31 chars or containing : \ / ? * [ ]
    const worksheet = workbook.addWorksheet(sheetName.replace(/[:\\/?*[\]]/g, '').slice(0, 31) || 'Sheet1');

    worksheet.columns = headers.map(header => ({
      header,
      key: header,
      width: this.columnWidth(header, rows)
    }));

    worksheet.addRows(rows);
    this.styleHeader(worksheet);
  }

  private styleHeader(worksheet: Worksheet): void {
    const header = worksheet.getRow(1);
    header.font = { bold: true };
    header.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    });
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  private async download(workbook: Workbook, fileName: string): Promise<void> {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}_${this.getTimestamp()}.xlsx`;
    link.click();

    // Without this the blob is retained for the lifetime of the document.
    URL.revokeObjectURL(url);
  }

  private prepareDataForExport(data: object[]): ExportRow[] {
    // Object.entries rather than for-in: it reads own enumerable keys off any
    // object, so callers can pass plain interfaces with no index signature.
    return data.map(item => {
      const formatted: ExportRow = {};
      for (const [key, raw] of Object.entries(item)) {
        if (key.startsWith('_') || key === 'id') continue;

        let value: unknown = raw;
        if (value instanceof Date) {
          value = value.toISOString().split('T')[0];
        } else if (value !== null && typeof value === 'object') {
          value = JSON.stringify(value);
        }

        formatted[this.formatHeader(key)] = value;
      }
      return formatted;
    });
  }

  private formatHeader(key: string): string {
    return key
      .split(/(?=[A-Z])|_/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private columnWidth(header: string, rows: ExportRow[]): number {
    let widest = header.length;

    rows.forEach(row => {
      const value = row[header];
      if (value !== null && value !== undefined) {
        widest = Math.max(widest, value.toString().length);
      }
    });

    return Math.min(widest + 2, ExcelExportService.MAX_COLUMN_CHARS);
  }

  private getTimestamp(): string {
    return new Date().toISOString().split('T')[0];
  }
}
