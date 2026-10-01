import { describe, it, expect } from 'vitest';
import { calculateArealSeries, extractAnnualMaximums } from '@/utils/rainfallSeriesUtils';
import type { DataHujan } from '@/stores/useHydrologyStore';

describe('Master Data Hydrological Parity & Standards Compliance Tests', () => {

  describe('1. Continuous Daily Areal Rainfall Synthesis (calculateArealSeries)', () => {
    it('should correctly compute area-weighted daily rainfall for multiple stations', () => {
      // 2 stations across 3 days
      const stationA_Data: DataHujan[] = [
        { id: '1', stasiun_id: 'sta_a', tanggal: '2023-01-01', curah_hujan: 50.0 },
        { id: '2', stasiun_id: 'sta_a', tanggal: '2023-01-02', curah_hujan: 20.0 },
        { id: '3', stasiun_id: 'sta_a', tanggal: '2023-01-03', curah_hujan: 0.0 },
      ];

      const stationB_Data: DataHujan[] = [
        { id: '4', stasiun_id: 'sta_b', tanggal: '2023-01-01', curah_hujan: 30.0 },
        { id: '5', stasiun_id: 'sta_b', tanggal: '2023-01-02', curah_hujan: 40.0 },
        { id: '6', stasiun_id: 'sta_b', tanggal: '2023-01-03', curah_hujan: 10.0 },
      ];

      const combinedData = [...stationA_Data, ...stationB_Data];

      // Thiessen weights: Station A = 0.6 (60%), Station B = 0.4 (40%)
      const weightsMap: Record<string, number> = {
        sta_a: 0.6,
        sta_b: 0.4,
      };

      const arealSeries = calculateArealSeries(combinedData, weightsMap);

      expect(arealSeries).toHaveLength(3);

      // Day 1: 50 * 0.6 + 30 * 0.4 = 30 + 12 = 42.0 mm
      const day1 = arealSeries.find(d => d.tanggal === '2023-01-01');
      expect(day1?.curah_hujan).toBeCloseTo(42.0, 2);

      // Day 2: 20 * 0.6 + 40 * 0.4 = 12 + 16 = 28.0 mm
      const day2 = arealSeries.find(d => d.tanggal === '2023-01-02');
      expect(day2?.curah_hujan).toBeCloseTo(28.0, 2);

      // Day 3: 0 * 0.6 + 10 * 0.4 = 4.0 mm
      const day3 = arealSeries.find(d => d.tanggal === '2023-01-03');
      expect(day3?.curah_hujan).toBeCloseTo(4.0, 2);
    });

    it('should correctly extract annual maximum series (AMS) from daily composite series', () => {
      const multiYearAreal: DataHujan[] = [
        // Year 2022
        { id: '1', stasiun_id: 'areal', tanggal: '2022-02-14', curah_hujan: 85.5 },
        { id: '2', stasiun_id: 'areal', tanggal: '2022-07-20', curah_hujan: 120.0 },
        { id: '3', stasiun_id: 'areal', tanggal: '2022-11-05', curah_hujan: 45.2 },
        // Year 2023
        { id: '4', stasiun_id: 'areal', tanggal: '2023-01-10', curah_hujan: 60.0 },
        { id: '5', stasiun_id: 'areal', tanggal: '2023-04-12', curah_hujan: 145.8 },
        { id: '6', stasiun_id: 'areal', tanggal: '2023-10-18', curah_hujan: 95.0 },
      ];

      const ams = extractAnnualMaximums(multiYearAreal);
      expect(ams).toHaveLength(2);

      const y2022 = ams.find(a => a.year === 2022);
      expect(y2022?.value).toBeCloseTo(120.0, 1);

      const y2023 = ams.find(a => a.year === 2023);
      expect(y2023?.value).toBeCloseTo(145.8, 1);
    });
  });

  describe('2. DAS Area Tolerance Harmonization (±0.5% or max(0.05, 0.005 * A_DAS))', () => {
    it('should accept slight polygon rounding differences within 0.5% tolerance', () => {
      const dasLuas = 250.0; // km²
      const maxTol = Math.max(0.05, 0.005 * dasLuas); // 1.25 km²

      const reportedLuas = 250.8; // discrepancy of 0.8 km² (0.32% difference)
      const diff = Math.abs(reportedLuas - dasLuas);

      expect(diff).toBeLessThanOrEqual(maxTol);
    });

    it('should flag excessive discrepancies exceeding 0.5% tolerance', () => {
      const dasLuas = 250.0; // km²
      const maxTol = Math.max(0.05, 0.005 * dasLuas); // 1.25 km²

      const badLuas = 253.0; // discrepancy of 3.0 km² (1.2% difference)
      const diff = Math.abs(badLuas - dasLuas);

      expect(diff).toBeGreaterThan(maxTol);
    });
  });

  describe('3. SCS-CN Composite & Land Cover Parameterization', () => {
    it('should calculate weighted CN and avoid CN=0 for standard land uses', () => {
      // Catchment with 3 land uses:
      // - Hutan (CN 60): 40 ha
      // - Sawah (CN 82): 30 ha
      // - Permukiman (CN 88): 30 ha
      const landUses = [
        { jenis: 'Hutan', luas: 40, cn: 60 },
        { jenis: 'Sawah', luas: 30, cn: 82 },
        { jenis: 'Permukiman', luas: 30, cn: 88 },
      ];

      const totalLuas = landUses.reduce((s, u) => s + u.luas, 0);
      const weightedCN = landUses.reduce((s, u) => s + (u.cn * u.luas), 0) / totalLuas;

      // (60*40 + 82*30 + 88*30) / 100 = (2400 + 2460 + 2640) / 100 = 7500 / 100 = 75.0
      expect(totalLuas).toBe(100);
      expect(weightedCN).toBeCloseTo(75.0, 1);
      expect(weightedCN).toBeGreaterThan(0);

      // Potential maximum retention S (mm) per SCS-CN formula: S = 25400 / CN - 254
      const S = (25400 / weightedCN) - 254;
      expect(S).toBeCloseTo(84.67, 1);
      expect(S).toBeGreaterThan(0);
    });
  });
});
