import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {

  constructor() { }

  /**
   * Export a single data array to an Excel file with one sheet
   */
  exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1'): void {
    if (!data || data.length === 0) return;
    
    const formattedData = this.prepareDataForExport(data);
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
    
    // Auto-size columns
    const colWidths = this.calculateColumnWidths(formattedData);
    worksheet['!cols'] = colWidths;

    const workbook: XLSX.WorkBook = { 
      Sheets: { [sheetName]: worksheet }, 
      SheetNames: [sheetName] 
    };
    
    XLSX.writeFile(workbook, `${fileName}_${this.getTimestamp()}.xlsx`);
  }

  /**
   * Export multiple data arrays to an Excel file with multiple sheets
   */
  exportAllToExcel(sheetsData: { [key: string]: any[] }, fileName: string): void {
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();

    Object.keys(sheetsData).forEach(sheetName => {
      const data = sheetsData[sheetName];
      if (data && data.length > 0) {
        const formattedData = this.prepareDataForExport(data);
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
        
        // Auto-size columns
        worksheet['!cols'] = this.calculateColumnWidths(formattedData);
        
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    });

    if (workbook.SheetNames.length > 0) {
      XLSX.writeFile(workbook, `${fileName}_${this.getTimestamp()}.xlsx`);
    }
  }

  formatDataForExport(data: any[]): any[] {
    return data; // Keeping it for compatibility with previous calls, logic moved to prepareDataForExport
  }

  private prepareDataForExport(data: any[]): any[] {
    return data.map(item => {
      const formatted: any = {};
      for (const key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key) && !key.startsWith('_') && key !== 'id') {
          let value = item[key];
          
          // Format based on type
          if (value instanceof Date) {
            value = value.toISOString().split('T')[0];
          } else if (value !== null && typeof value === 'object') {
            value = JSON.stringify(value);
          }
          
          const prettyHeader = this.formatHeader(key);
          formatted[prettyHeader] = value;
        }
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

  private calculateColumnWidths(data: any[]): XLSX.ColInfo[] {
    if (!data || data.length === 0) return [];
    
    const headers = Object.keys(data[0]);
    return headers.map(header => {
      let maxLen = header.length;
      data.forEach(row => {
        const val = row[header];
        if (val !== null && val !== undefined) {
          maxLen = Math.max(maxLen, val.toString().length);
        }
      });
      return { wch: Math.min(maxLen + 2, 50) }; // Max 50 chars
    });
  }

  private getTimestamp(): string {
    return new Date().toISOString().split('T')[0];
  }
}
