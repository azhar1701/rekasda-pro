import { describe, it, expect } from 'vitest';
import {
  isLeapYear,
  getDaysInYear,
  getCompletenessGrade,
  calculateYearCompleteness,
  calculateStationCompleteness,
} from '../dailyCompletenessMath';
import type { DataHujan } from '@/stores/useHydrologyStore';

describe('dailyCompletenessMath - Utility & Grading', () => {
  it('harus mendeteksi tahun kabisat dengan benar', () => {
    expect(isLeapYear(2020)).toBe(true);
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2023)).toBe(false);
    expect(getDaysInYear(2024)).toBe(366);
    expect(getDaysInYear(2023)).toBe(365);
  });

  it('harus memberikan grade kelengkapan sesuai persentase', () => {
    expect(getCompletenessGrade(100)).toBe('LENGKAP');
    expect(getCompletenessGrade(95.5)).toBe('CUKUP');
    expect(getCompletenessGrade(90.0)).toBe('CUKUP');
    expect(getCompletenessGrade(89.9)).toBe('KURANG');
    expect(getCompletenessGrade(75.0)).toBe('KURANG');
    expect(getCompletenessGrade(74.9)).toBe('KRITIS');
    expect(getCompletenessGrade(50.0)).toBe('KRITIS');
  });
});

describe('dailyCompletenessMath - calculateYearCompleteness', () => {
  it('harus menghitung kelengkapan 100% jika 365 hari terisi', () => {
    const fullYearRecords: DataHujan[] = [];
    const year = 2023; // 365 days
    for (let m = 1; m <= 12; m++) {
      const daysInMonth = new Date(year, m, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        fullYearRecords.push({
          id: `hujan-${year}-${m}-${d}`,
          stasiun_id: 'stasiun-1',
          tanggal: `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
          curah_hujan: 10,
        });
      }
    }

    const summary = calculateYearCompleteness(fullYearRecords, year);
    expect(summary.totalDays).toBe(365);
    expect(summary.recordedDays).toBe(365);
    expect(summary.missingDays).toBe(0);
    expect(summary.completenessPercent).toBe(100);
    expect(summary.status).toBe('LENGKAP');
    expect(summary.isReliableForAMS).toBe(true);
    expect(summary.maxConsecutiveMissing).toBe(0);
  });

  it('harus mendeteksi hari hilang, celah hilang beruntun, dan musim hujan', () => {
    const year = 2023;
    const partialRecords: DataHujan[] = [];

    // Isi hanya bulan Mei s.d. Desember (Januari - April tidak ada data -> musim hujan hilang!)
    for (let m = 5; m <= 12; m++) {
      const daysInMonth = new Date(year, m, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        partialRecords.push({
          id: `hujan-${year}-${m}-${d}`,
          stasiun_id: 'stasiun-1',
          tanggal: `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
          curah_hujan: 5,
        });
      }
    }

    const summary = calculateYearCompleteness(partialRecords, year);
    expect(summary.recordedDays).toBe(245);
    expect(summary.missingDays).toBe(120);
    expect(summary.completenessPercent).toBeLessThan(75);
    expect(summary.status).toBe('KRITIS');
    expect(summary.isReliableForAMS).toBe(false);
    expect(summary.maxConsecutiveMissing).toBe(120);
    expect(summary.wetSeasonMissingDays).toBe(120); // Jan-Apr
  });
});

describe('dailyCompletenessMath - calculateStationCompleteness', () => {
  it('harus mengagregasi data multi-tahun stasiun dengan benar', () => {
    const multiYearRecords: DataHujan[] = [];
    const years = [2020, 2021, 2022, 2023, 2024];

    years.forEach((yr) => {
      const days = getDaysInYear(yr);
      const curDate = new Date(yr, 0, 1);
      for (let d = 0; d < days; d++) {
        const dateObj = new Date(yr, 0, 1 + d);
        const m = dateObj.getMonth() + 1;
        const day = dateObj.getDate();
        multiYearRecords.push({
          id: `hujan-${yr}-${d}`,
          stasiun_id: 'stasiun-test',
          tanggal: `${yr}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          curah_hujan: 15,
        });
      }
    });

    const stationSummary = calculateStationCompleteness(multiYearRecords, 'stasiun-test', 'Stasiun Uji');
    expect(stationSummary.totalYears).toBe(5);
    expect(stationSummary.reliableYearsCount).toBe(5);
    expect(stationSummary.averageCompletenessPercent).toBe(100);
    expect(stationSummary.status).toBe('MEMENUHI_STANDAR');
  });
});
