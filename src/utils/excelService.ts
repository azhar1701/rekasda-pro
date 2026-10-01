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

/**
 * Export Laporan Eksekutif Lengkap ke dalam Multi-Sheet Excel (.xlsx)
 * Standar format pelaporan teknis Rekayasa Sumber Daya Air (SNI)
 */
export const exportExecutiveSummaryToExcel = async (report: any): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RekaSDA Pro - Platform Rekayasa Sumber Daya Air SNI';
  workbook.lastModifiedBy = 'Tim Tenaga Ahli Hidrologi';
  workbook.created = new Date();
  workbook.modified = new Date();

  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0C3A66' } // Professional Navy Blue
  };
  const headerFont: Partial<ExcelJS.Font> = {
    bold: true,
    color: { argb: 'FFFFFFFF' },
    size: 11
  };

  // Helper untuk formatting header row
  const styleHeaderRow = (row: ExcelJS.Row) => {
    row.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    row.height = 24;
  };

  // 1. SHEET 1: RINGKASAN EKSEKUTIF & IDENTITAS
  const wsSummary = workbook.addWorksheet('Ringkasan Eksekutif');
  wsSummary.columns = [
    { header: 'Parameter', key: 'param', width: 30 },
    { header: 'Keterangan / Nilai', key: 'value', width: 45 },
    { header: 'Satuan / Standar', key: 'unit', width: 25 }
  ];
  styleHeaderRow(wsSummary.getRow(1));

  wsSummary.addRow({ param: 'Instansi / Pemrakarsa', value: report.kop?.instansi || 'Konsultan / Pengelola SDA', unit: '-' });
  wsSummary.addRow({ param: 'Divisi / Satker', value: report.kop?.balai || 'Divisi Perencanaan Teknis SDA', unit: '-' });
  wsSummary.addRow({ param: 'Nomor Dokumen', value: report.kop?.nomorDokumen || '-', unit: '-' });
  wsSummary.addRow({ param: 'Tanggal Terbit', value: report.kop?.tanggalDokumen || '-', unit: '-' });
  wsSummary.addRow({ param: 'Status Dokumen', value: report.kop?.statusDokumen || 'FINAL', unit: '-' });
  wsSummary.addRow({ param: 'Nama Pekerjaan', value: report.identitas?.namaPekerjaan || '-', unit: '-' });
  wsSummary.addRow({ param: 'Nama DAS / Wilayah Sungai', value: report.identitas?.namaDAS || '-', unit: '-' });
  wsSummary.addRow({ param: 'Provinsi / Kabupaten', value: `${report.identitas?.provinsi || '-'} / ${report.identitas?.kabupaten || '-'}`, unit: '-' });
  wsSummary.addRow({ param: 'Luas DAS Terukur', value: report.identitas?.luasDas || '-', unit: 'km²' });
  wsSummary.addRow({ param: 'Panjang Sungai Utama', value: report.identitas?.panjangSungai || '-', unit: 'km' });
  wsSummary.addRow({ param: 'Waktu Konsentrasi (tc)', value: report.identitas?.waktuKonsentrasi ? Number(report.identitas.waktuKonsentrasi).toFixed(2) : '-', unit: 'jam' });
  wsSummary.addRow({ param: 'Koefisien Limpasan Rerata', value: report.identitas?.koefisienLimpasan || '-', unit: 'C / CN' });
  wsSummary.addRow({ param: 'Koordinat Geografis', value: report.identitas?.latitude && report.identitas?.longitude ? `${report.identitas.latitude}, ${report.identitas.longitude}` : '-', unit: 'Lat, Long' });
  wsSummary.addRow({ param: 'Sintesis Rekomendasi AI', value: report.aiSummary || '-', unit: 'SNI Compliance' });

  // 2. SHEET 2: ANALISIS FREKUENSI
  if (report.frekuensi && report.frekuensi.curahHujanRencana?.length > 0) {
    const wsFreq = workbook.addWorksheet('Analisis Frekuensi');
    wsFreq.columns = [
      { header: 'Kala Ulang (Tahun)', key: 'tr', width: 22 },
      { header: 'Curah Hujan Rancangan R24 (mm)', key: 'r24', width: 35 },
      { header: 'Metode Distribusi', key: 'method', width: 25 },
      { header: 'Uji Statistik', key: 'test', width: 25 }
    ];
    styleHeaderRow(wsFreq.getRow(1));

    report.frekuensi.curahHujanRencana.forEach((item: any) => {
      wsFreq.addRow({
        tr: `Tr ${item.Tr} Tahun`,
        r24: Number(item.R24).toFixed(2),
        method: report.frekuensi.metodeTerpilih || 'Gumbel',
        test: report.frekuensi.lulusUji ? 'Lulus / Memenuhi' : 'Perlu Koreksi'
      });
    });
  }

  // 3. SHEET 3: DEBIT BANJIR RANCANGAN
  if (report.banjir) {
    const wsFlood = workbook.addWorksheet('Debit Banjir');
    wsFlood.columns = [
      { header: 'Parameter Banjir', key: 'param', width: 28 },
      { header: 'Nilai', key: 'val', width: 20 },
      { header: 'Satuan', key: 'unit', width: 15 },
      { header: 'Metode / Acuan', key: 'ref', width: 30 }
    ];
    styleHeaderRow(wsFlood.getRow(1));

    wsFlood.addRow({ param: 'Metode Analisis Banjir', val: report.banjir.metode || 'Rasional / HSS', unit: '-', ref: 'SNI 2415:2016' });
    wsFlood.addRow({ param: 'Debit Puncak (Qpeak)', val: Number(report.banjir.debitPuncak || 0).toFixed(2), unit: 'm³/s', ref: 'Puncak Limpasan' });
    wsFlood.addRow({ param: 'Waktu Puncak (tp)', val: Number(report.banjir.waktuPuncak || 0).toFixed(2), unit: 'jam', ref: 'Time to Peak' });
    wsFlood.addRow({ param: 'Volume Total Banjir', val: Number(report.banjir.volumeTotal || 0).toFixed(0), unit: 'm³', ref: 'Total Runoff Volume' });

    if (report.banjir.returnPeriods && report.banjir.returnPeriods.length > 0) {
      wsFlood.addRow({});
      const subHeader = wsFlood.addRow({ param: 'Kala Ulang', val: 'Debit Puncak (m³/s)', unit: 'Status', ref: 'Standar SNI' });
      subHeader.font = { bold: true };
      report.banjir.returnPeriods.forEach((rp: any) => {
        wsFlood.addRow({
          param: `Kala Ulang ${rp.period} Th`,
          val: Number(rp.qPeak || 0).toFixed(2),
          unit: 'm³/s',
          ref: 'SNI 2415:2016'
        });
      });
    }
  }

  // 4. SHEET 4: NERACA AIR BULANAN
  if (report.neraca && report.neraca.monthlyRows?.length > 0) {
    const wsWB = workbook.addWorksheet('Neraca Air Bulanan');
    wsWB.columns = [
      { header: 'Bulan', key: 'bulan', width: 15 },
      { header: 'Debit Andalan Q80 (m³/s)', key: 'sup', width: 26 },
      { header: 'Kebutuhan Total (m³/s)', key: 'dem', width: 26 },
      { header: 'Neraca Air (m³/s)', key: 'bal', width: 22 },
      { header: 'Status', key: 'status', width: 18 }
    ];
    styleHeaderRow(wsWB.getRow(1));

    report.neraca.monthlyRows.forEach((r: any) => {
      wsWB.addRow({
        bulan: r.bulan,
        sup: Number(r.ketersediaan || 0).toFixed(2),
        dem: Number(r.kebutuhan || 0).toFixed(2),
        bal: Number(r.neraca || 0).toFixed(2),
        status: r.status
      });
    });

    wsWB.addRow({});
    wsWB.addRow({
      bulan: 'TOTAL KELAYAKAN',
      sup: Number(report.neraca.totalKetersediaan || 0).toFixed(2),
      dem: Number(report.neraca.totalKebutuhan || 0).toFixed(2),
      bal: Number(report.neraca.netBalance || 0).toFixed(2),
      status: report.neraca.netBalance >= 0 ? 'SURPLUS' : 'DEFISIT'
    });
    wsWB.addRow({
      bulan: 'Bulan Kritis',
      sup: report.neraca.bulanKritis || '-',
      dem: 'Indeks Kerapuhan Air (IKA)',
      bal: report.neraca.ikaPercent ? `${report.neraca.ikaPercent.toFixed(1)}%` : '-',
      status: report.neraca.ikaStatus || 'SNI 19-6728.1-2002'
    });
  }

  // 5. SHEET 5: SITU & EMBUNG
  if (report.embung) {
    const wsEmbung = workbook.addWorksheet('Situ dan Embung');
    wsEmbung.columns = [
      { header: 'Parameter Embung', key: 'param', width: 32 },
      { header: 'Nilai Desain', key: 'val', width: 22 },
      { header: 'Satuan', key: 'unit', width: 15 },
      { header: 'Kriteria Pedoman', key: 'ref', width: 28 }
    ];
    styleHeaderRow(wsEmbung.getRow(1));

    wsEmbung.addRow({ param: 'Reduksi Puncak Banjir', val: `${Number(report.embung.reduksiPuncak || 0).toFixed(1)}%`, unit: '%', ref: 'Efektivitas Meredam Banjir' });
    wsEmbung.addRow({ param: 'Taksiran Umur Sedimen', val: report.embung.umurSedimen || 25, unit: 'Tahun', ref: 'Pd T-03-2005-A' });
    wsEmbung.addRow({ param: 'Tampungan Efektif', val: Number(report.embung.effectiveStorage || 0).toLocaleString('id-ID'), unit: 'm³', ref: 'Volume Aktif Operasi' });
    wsEmbung.addRow({ param: 'Tampungan Mati (Dead Storage)', val: Number(report.embung.deadStorage || 0).toLocaleString('id-ID'), unit: 'm³', ref: 'Ruang Sedimen Mati' });
    wsEmbung.addRow({ param: 'Total Kapasitas Desain', val: Number(report.embung.totalCapacity || 0).toLocaleString('id-ID'), unit: 'm³', ref: 'Gross Storage' });
    wsEmbung.addRow({ param: 'Status Keamanan Embung', val: report.embung.isAman ? 'Aman' : 'Perlu Evaluasi', unit: '-', ref: 'Stabilitas & Tinggi Jagaan' });
  }

  // 6. SHEET 6: SALURAN TERBUKA (MANNING)
  if (report.saluran) {
    const wsSal = workbook.addWorksheet('Saluran Manning');
    wsSal.columns = [
      { header: 'Parameter Saluran', key: 'param', width: 32 },
      { header: 'Nilai Perhitungan', key: 'val', width: 22 },
      { header: 'Satuan', key: 'unit', width: 15 },
      { header: 'Kriteria SNI', key: 'ref', width: 28 }
    ];
    styleHeaderRow(wsSal.getRow(1));

    wsSal.addRow({ param: 'Bentuk Penampang', val: report.saluran.shape, unit: '-', ref: 'SNI 03-2401-1991' });
    wsSal.addRow({ param: 'Debit Kapasitas (Qkap)', val: Number(report.saluran.dischargeCapacity || 0).toFixed(2), unit: 'm³/s', ref: 'Rumus Manning' });
    wsSal.addRow({ param: 'Kecepatan Aliran (V)', val: Number(report.saluran.velocity || 0).toFixed(2), unit: 'm/s', ref: report.saluran.velocityStatus || 'Normal' });
    wsSal.addRow({ param: 'Angka Froude (Fr)', val: Number(report.saluran.froudeNumber || 0).toFixed(2), unit: '-', ref: report.saluran.flowRegime || 'Subkritis' });
    wsSal.addRow({ param: 'Tinggi Jagaan Aktual', val: Number(report.saluran.freeboardActual || 0).toFixed(2), unit: 'm', ref: 'Freeboard Aktual' });
    wsSal.addRow({ param: 'Tinggi Jagaan Disyaratkan', val: Number(report.saluran.freeboardRecommended || 0).toFixed(2), unit: 'm', ref: 'Minimum SNI' });
    wsSal.addRow({ param: 'Status Keseluruhan Saluran', val: report.saluran.isSafe ? 'Aman (Memenuhi SNI)' : 'Bahaya Limpasan', unit: '-', ref: 'Verifikasi Desain' });
  }

  const projName = report.identitas?.namaPekerjaan?.replace(/[^a-zA-Z0-9]/g, '_') || 'Proyek_SDA';
  const fileName = `Laporan_Eksekutif_SDA_${projName}`;
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${fileName}.xlsx`);
};

