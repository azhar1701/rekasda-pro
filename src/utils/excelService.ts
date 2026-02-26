import * as XLSX from 'xlsx';

/**
 * ExcelService
 * 
 * Bertindak sebagai Security Wrapper (The Quarantine Pattern) untuk pustaka 'xlsx'.
 * Isolasi ini memudahkan penggantian pustaka di masa depan dan melakukan
 * sanitasi input untuk mencegah kerentanan keamanan seperti Prototype Pollution.
 */

/**
 * Sanitasi data sebelum diproses untuk mencegah Prototype Pollution.
 * Memutus prototype chain dari objek bawaan JavaScript.
 *
 * @param {any[]} data Array of objects to be sanitized
 * @returns {any[]} Sanitized array of objects
 */
const sanitizeData = (data: any[]): any[] => {
  if (!data || !Array.isArray(data)) return [];
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error('Gagal melakukan sanitasi data Excel:', error);
    return [];
  }
};

/**
 * Membaca array buffer dari file Excel dan mereturn data JSON
 * 
 * @param {ArrayBuffer} data Buffer dari file Excel
 * @param {number} range Baris dimulainya pembacaan header
 * @returns {T[]} Data JSON hasil parsing
 */
export const parseExcelData = <T = any>(data: ArrayBuffer, range: number = 0): T[] => {
  const workbook = XLSX.read(data);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  // Menggunakan default json untuk menghindari read langsung ke raw component
  return XLSX.utils.sheet_to_json<T>(worksheet, { range });
};

/**
 * Export data array of objects ke dalam file Excel (.xlsx)
 * 
 * @param {any[]} data Array dari data yang akan diexport
 * @param {string} filename Nama file hasil export (tanpa ekstensi .xlsx)
 * @param {string} sheetName Nama sheet di dalam file Excel (default: 'Sheet1')
 */
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1'): void => {
  if (!data || data.length === 0) {
    console.warn('Tidak ada data yang dapat diexport ke Excel.');
    return;
  }

  // Sanitasi input data (Mitigasi Prototype Pollution)
  const sanitizedData = sanitizeData(data);

  const worksheet = XLSX.utils.json_to_sheet(sanitizedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const safeFilename = filename.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() + '.xlsx';
  XLSX.writeFile(workbook, safeFilename);
};

/**
 * Export Template khusus untuk Data Curah Hujan
 */
export const exportHidrologiTemplate = (stasiunName: string): void => {
  const template = [
      { 'Tanggal': '2024-01-01', 'Curah Hujan (mm)': 0 },
      { 'Tanggal': '2024-01-02', 'Curah Hujan (mm)': 12.5 },
      { 'Tanggal': '2024-01-03', 'Curah Hujan (mm)': 0 }
  ];
  
  const ws = XLSX.utils.json_to_sheet(sanitizeData(template));
  
  XLSX.utils.sheet_add_aoa(ws, [['TEMPLATE IMPORT DATA CURAH HUJAN']], { origin: 'A1' });
  XLSX.utils.sheet_add_aoa(ws, [[`Stasiun: ${stasiunName}`]], { origin: 'A2' });
  XLSX.utils.sheet_add_aoa(ws, [['Format: Tanggal (YYYY-MM-DD), Curah Hujan (mm)']], { origin: 'A3' });
  XLSX.utils.sheet_add_aoa(ws, [['']], { origin: 'A4' });
  XLSX.utils.sheet_add_aoa(ws, [['Tanggal', 'Curah Hujan (mm)']], { origin: 'A5' });
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Curah Hujan');
  const safeFilename = `Template-${stasiunName.replace(/\s+/g, '-')}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
};
