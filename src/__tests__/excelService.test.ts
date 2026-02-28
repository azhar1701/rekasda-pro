import { describe, it, expect } from 'vitest';
import { exportToExcel, parseExcelData, exportHidrologiTemplate } from '../utils/excelService';

describe('ExcelService QA', () => {
  it('exportToExcel - basic data', async () => {
    const data = [{ Nama: 'Test', Nilai: 100 }];
    await expect(exportToExcel(data, 'test', 'Sheet1')).resolves.not.toThrow();
  });

  it('exportToExcel - empty data', async () => {
    await expect(exportToExcel([], 'empty', 'Sheet1')).resolves.not.toThrow();
  });

  it('exportHidrologiTemplate - generates template', async () => {
    await expect(exportHidrologiTemplate('Test Station')).resolves.not.toThrow();
  });

  it('parseExcelData - rejects invalid buffer', async () => {
    const buffer = new ArrayBuffer(8);
    // An empty 8-byte buffer is not a valid xlsx (zip) file
    await expect(parseExcelData(buffer, 0)).rejects.toThrow();
  });
});
