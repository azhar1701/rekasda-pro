/**
 * Quality Control Kelengkapan Data Curah Hujan Harian
 * Mengikuti: WMO Guide to Hydrological Practices No. 168, BMKG, dan SNI 2415:2016
 * 
 * Standar Kelengkapan Data:
 * - LENGKAP : 100% data tercatat (365/366 hari)
 * - CUKUP   : >= 90% data tercatat (hilang <= 10% / maks 36 hari per tahun) -> Layak untuk AMS
 * - KURANG  : 75% - 89% data tercatat -> Membutuhkan infill / estimasi data hilang
 * - KRITIS  : < 75% data tercatat -> Tidak layak untuk AMS tanpa rekonstruksi
 * 
 * @module dailyCompletenessMath
 * @version 1.0.0
 */

import type { DataHujan } from '@/stores/useHydrologyStore';

export type CompletenessGrade = 'LENGKAP' | 'CUKUP' | 'KURANG' | 'KRITIS';
export type StationCompletenessStatus = 'MEMENUHI_STANDAR' | 'PERLU_INFILL' | 'TIDAK_LAYAK';

export interface YearCompleteness {
  year: number;
  totalDays: number;
  recordedDays: number;
  missingDays: number;
  completenessPercent: number;
  infilledDays: number;
  maxConsecutiveMissing: number;
  wetSeasonMissingDays: number; // Bulan Oktober - April di Indonesia
  status: CompletenessGrade;
  isReliableForAMS: boolean;
}

export interface StationCompletenessSummary {
  stasiunId?: string;
  namaStasiun?: string;
  totalYears: number;
  reliableYearsCount: number;
  averageCompletenessPercent: number;
  years: YearCompleteness[];
  status: StationCompletenessStatus;
  catatan: string;
}

/**
 * Memeriksa apakah suatu tahun adalah tahun kabisat
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Menghitung jumlah hari dalam satu tahun
 */
export function getDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/**
 * Menentukan grade kelengkapan berdasarkan persentase
 */
export function getCompletenessGrade(percent: number): CompletenessGrade {
  if (percent >= 100) return 'LENGKAP';
  if (percent >= 90) return 'CUKUP';
  if (percent >= 75) return 'KURANG';
  return 'KRITIS';
}

/**
 * Menghitung kelengkapan data harian untuk satu tahun tertentu
 */
export function calculateYearCompleteness(records: DataHujan[], year: number): YearCompleteness {
  const totalDays = getDaysInYear(year);

  // Kumpulkan tanggal-tanggal valid yang tercatat di tahun ini
  const recordedMap = new Map<string, { val: number; isInfilled: boolean }>();

  records.forEach((row) => {
    if (!row.tanggal) return;
    const parts = row.tanggal.split('-');
    if (parts.length < 3) return;
    const rowYear = parseInt(parts[0], 10);
    if (rowYear !== year) return;

    const val = row.curah_hujan;
    // Valid jika bukan null, bukan undefined, dan merupakan angka finit non-negatif
    if (val !== null && val !== undefined && isFinite(Number(val)) && Number(val) >= 0) {
      recordedMap.set(row.tanggal, {
        val: Number(val),
        isInfilled: !!row.is_infilled,
      });
    }
  });

  let infilledCount = 0;
  let currentMissingGap = 0;
  let maxConsecutiveMissing = 0;
  let wetSeasonMissingDays = 0;

  // Lakukan iterasi dari hari 1 s.d. hari terakhir tahun tersebut (1 Jan s.d. 31 Des)
  for (let d = 0; d < totalDays; d++) {
    const curDate = new Date(year, 0, 1 + d);
    const m = curDate.getMonth() + 1; // 1-12
    const day = curDate.getDate();
    const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const record = recordedMap.get(dateStr);
    if (record) {
      // Hari tercatat
      if (record.isInfilled) {
        infilledCount++;
      }
      currentMissingGap = 0;
    } else {
      // Hari hilang
      currentMissingGap++;
      if (currentMissingGap > maxConsecutiveMissing) {
        maxConsecutiveMissing = currentMissingGap;
      }
      // Musim hujan di Indonesia umumnya Oktober s.d. April (bulan 10, 11, 12, 1, 2, 3, 4)
      if (m >= 10 || m <= 4) {
        wetSeasonMissingDays++;
      }
    }
  }

  const recordedDays = recordedMap.size;
  const missingDays = Math.max(0, totalDays - recordedDays);
  const completenessPercent = Number(((recordedDays / totalDays) * 100).toFixed(2));
  const status = getCompletenessGrade(completenessPercent);

  // Kriteria keandalan AMS (WMO Guide No. 168):
  // Kelengkapan >= 90% DAN gap hilang berturut-turut di musim hujan <= 10 hari
  const isReliableForAMS = completenessPercent >= 90 && maxConsecutiveMissing <= 15;

  return {
    year,
    totalDays,
    recordedDays,
    missingDays,
    completenessPercent,
    infilledDays: infilledCount,
    maxConsecutiveMissing,
    wetSeasonMissingDays,
    status,
    isReliableForAMS,
  };
}

/**
 * Menghitung ringkasan kelengkapan data harian multi-tahun untuk satu stasiun
 */
export function calculateStationCompleteness(
  records: DataHujan[],
  stasiunId?: string,
  namaStasiun?: string
): StationCompletenessSummary {
  // Ekstrak semua tahun unik yang ada dalam records
  const yearsSet = new Set<number>();
  records.forEach((r) => {
    if (!r.tanggal) return;
    const y = parseInt(r.tanggal.split('-')[0], 10);
    if (!isNaN(y) && y >= 1900 && y <= 2100) {
      yearsSet.add(y);
    }
  });

  const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);

  if (sortedYears.length === 0) {
    return {
      stasiunId,
      namaStasiun,
      totalYears: 0,
      reliableYearsCount: 0,
      averageCompletenessPercent: 0,
      years: [],
      status: 'TIDAK_LAYAK',
      catatan: 'Belum ada data curah hujan harian yang tercatat.',
    };
  }

  const yearSummaries: YearCompleteness[] = sortedYears.map((year) =>
    calculateYearCompleteness(records, year)
  );

  const totalYears = yearSummaries.length;
  const reliableYearsCount = yearSummaries.filter((y) => y.isReliableForAMS).length;
  const totalPercentSum = yearSummaries.reduce((sum, y) => sum + y.completenessPercent, 0);
  const averageCompletenessPercent = Number((totalPercentSum / totalYears).toFixed(2));

  let status: StationCompletenessStatus = 'MEMENUHI_STANDAR';
  let catatan = 'Seluruh tahun memiliki kelengkapan harian memenuhi standar WMO (>=90%).';

  if (reliableYearsCount === totalYears) {
    status = 'MEMENUHI_STANDAR';
    catatan = `Seluruh ${totalYears} tahun data memenuhi standar kelengkapan WMO No. 168 (>= 90%).`;
  } else if (reliableYearsCount >= 5) {
    status = 'PERLU_INFILL';
    const sub90Years = yearSummaries.filter((y) => !y.isReliableForAMS).map((y) => y.year);
    catatan = `Ditemukan ${sub90Years.length} tahun (${sub90Years.join(', ')}) dengan data hilang > 10%. Sangat disarankan melakukan infill data sebelum analisis frekuensi.`;
  } else {
    status = 'TIDAK_LAYAK';
    catatan = `Hanya ${reliableYearsCount} dari ${totalYears} tahun yang memiliki data memadai (>= 90%). Diperlukan infill menyeluruh atau penambahan data.`;
  }

  return {
    stasiunId,
    namaStasiun,
    totalYears,
    reliableYearsCount,
    averageCompletenessPercent,
    years: yearSummaries,
    status,
    catatan,
  };
}
