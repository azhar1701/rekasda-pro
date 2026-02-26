import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * ExcelService - Secure Excel Export Service
 * 
 * Menggunakan exceljs (modern, aman, tanpa kerentanan Prototype Pollution)
 * sebagai pengganti xlsx (SheetJS) yang memiliki kerentanan High.
 */

/**
 * Membaca array buffer dari file Excel dan mereturn data JSON
 */
export const parseExcelData = async <T = any>(data: ArrayBuffer, range: number = 0): Promise<T[]> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);
  const worksheet = workbook.worksheets[0];
  const result: T[] = [];
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > range) {
      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        rowData[`col${colNumber}`] = cell.value;
      });
      result.push(rowData);
    }
  });
  
  return result;
};

/**
 * Export data array of objects ke dalam file Excel (.xlsx)
 */
export const exportToExcel = async (data: any[], filename: string, sheetName: string = 'Sheet1'): Promise<void> => {
  if (!data || data.length === 0) {
    console.warn('Tidak ada data yang dapat diexport ke Excel.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  
  // Extract headers
  const headers = Object.keys(data[0]);
  worksheet.columns = headers.map(h => ({ header: h, key: h, width: 15 }));
  
  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E9F7' }
  };
  
  // Add data
  data.forEach(row => worksheet.addRow(row));
  
  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const safeFilename = filename.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() + '.xlsx';
  saveAs(new Blob([buffer]), safeFilename);
};

/**
 * Export Template khusus untuk Data Curah Hujan
 */
export const exportHidrologiTemplate = async (stasiunName: string): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data Curah Hujan');
  
  // Header info
  worksheet.mergeCells('A1:B1');
  worksheet.getCell('A1').value = 'TEMPLATE IMPORT DATA CURAH HUJAN';
  worksheet.getCell('A1').font = { bold: true, size: 14 };
  
  worksheet.mergeCells('A2:B2');
  worksheet.getCell('A2').value = `Stasiun: ${stasiunName}`;
  
  worksheet.mergeCells('A3:B3');
  worksheet.getCell('A3').value = 'Format: Tanggal (YYYY-MM-DD), Curah Hujan (mm)';
  worksheet.getCell('A3').font = { italic: true };
  
  // Data columns
  worksheet.getCell('A5').value = 'Tanggal';
  worksheet.getCell('B5').value = 'Curah Hujan (mm)';
  worksheet.getRow(5).font = { bold: true };
  worksheet.getRow(5).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E9F7' }
  };
  
  // Sample data
  worksheet.addRow(['2024-01-01', 0]);
  worksheet.addRow(['2024-01-02', 12.5]);
  worksheet.addRow(['2024-01-03', 0]);
  
  worksheet.getColumn(1).width = 15;
  worksheet.getColumn(2).width = 20;
  
  const buffer = await workbook.xlsx.writeBuffer();
  const safeFilename = `Template-${stasiunName.replace(/\s+/g, '-')}.xlsx`;
  saveAs(new Blob([buffer]), safeFilename);
};
