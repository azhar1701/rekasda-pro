import { describe, it, expect } from 'vitest';
import {
  calculateMononobe,
  calculateTalbot,
  calculateSherman,
  calculateRainfallIntensity,
  calculateKirpich,
  calculateBransbyWilliams,
  calculateCaliforniaCulvert,
  calculateTimeConcentration
} from './rainfall';
import { calculateThiessenAverage } from './rainfallAnalysis';
import { infillIDW, infillMissingData } from '../utils/spatialMath';
import { StasiunHidrologi, DataHujan } from '@/stores/useHydrologyStore';

describe('Rainfall Engine (SNI 2415:2016)', () => {
  describe('Rainfall Intensity Methods', () => {
    it('should calculate Mononobe correctly', () => {
      const R24 = 100;
      const tc = 2;
      const expected = (100 / 24) * Math.pow(24 / 2, 2 / 3);
      expect(calculateMononobe(R24, tc)).toBeCloseTo(expected, 2);
    });

    it('should calculate Talbot correctly', () => {
      const R24 = 100;
      const tc = 2;
      const expected = (0.21 * 100) / (2 + 0.5);
      expect(calculateTalbot(R24, tc)).toBeCloseTo(expected, 2);
    });

    it('should calculate Sherman correctly', () => {
      const R24 = 100;
      const tc = 2;
      const expected = (1.67 * 100) / Math.pow(2 + 0.5, 0.67);
      expect(calculateSherman(R24, tc)).toBeCloseTo(expected, 2);
    });

    it('should calculate Rainfall Intensity using calculateRainfallIntensity', () => {
      const result = calculateRainfallIntensity({ R24: 100, tc: 2, method: 'mononobe' });
      expect(result.I).toBeGreaterThan(0);
      expect(result.method).toContain('Mononobe');
    });

    it('should throw error for invalid inputs in calculateRainfallIntensity', () => {
      expect(() => calculateRainfallIntensity({ R24: -10, tc: 2, method: 'mononobe' })).toThrow();
    });
  });

  describe('Time of Concentration (Tc) Methods', () => {
    it('should calculate Kirpich correctly', () => {
      const L = 2; // km
      const S = 0.01; // m/m
      const expected = 0.0195 * Math.pow(2 * 1000, 0.77) * Math.pow(0.01, -0.385);
      expect(calculateKirpich(L, S)).toBeCloseTo(expected, 2);
    });

    it('should calculate Bransby-Williams correctly', () => {
      const L = 2;
      const A = 10;
      const S = 0.01;
      const expected = (58.5 * 2) / (Math.pow(10, 0.1) * Math.pow(0.01, 0.2));
      expect(calculateBransbyWilliams(L, A, S)).toBeCloseTo(expected, 2);
    });

    it('should calculate California Culvert correctly', () => {
      const L = 2;
      const H = 20;
      const expected = Math.pow((0.87 * Math.pow(2, 3)) / 20, 0.385);
      expect(calculateCaliforniaCulvert(L, H)).toBeCloseTo(expected, 2);
    });

    it('should calculate Time Concentration using calculateTimeConcentration', () => {
      const result = calculateTimeConcentration({ L: 2, S: 0.01, method: 'kirpich' });
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('Thiessen Polygon Weighting Logic', () => {
    it('should calculate Thiessen average correctly', () => {
      const stations = [
        { stasiunId: '1', namaStasiun: 'A', luasPengaruh: 10, annualMax: [100, 110] },
        { stasiunId: '2', namaStasiun: 'B', luasPengaruh: 20, annualMax: [120, 130] },
        { stasiunId: '3', namaStasiun: 'C', luasPengaruh: 20, annualMax: [90, 95] }
      ];
      
      const result = calculateThiessenAverage(stations);
      
      expect(result.totalLuas).toBe(50);
      expect(result.bobotStasiun).toHaveLength(3);
      expect(result.bobotStasiun[0].bobot).toBe(10 / 50);
      expect(result.bobotStasiun[1].bobot).toBe(20 / 50);
      expect(result.bobotStasiun[2].bobot).toBe(20 / 50);
      
      // Year 1: (100*0.2) + (120*0.4) + (90*0.4) = 20 + 48 + 36 = 104
      // Year 2: (110*0.2) + (130*0.4) + (95*0.4) = 22 + 52 + 38 = 112
      expect(result.hujanRataRataDAS[0]).toBeCloseTo(104, 2);
      expect(result.hujanRataRataDAS[1]).toBeCloseTo(112, 2);
    });

    it('should throw error if total area is 0 or negative', () => {
      const stations = [
        { stasiunId: '1', namaStasiun: 'A', luasPengaruh: 0, annualMax: [100] }
      ];
      expect(() => calculateThiessenAverage(stations)).toThrow();
    });
  });

  describe('Missing Data Infill Logic (IDW)', () => {
    it('should calculate IDW correctly', () => {
      const targetStation = { id: '1', koordinat_x: 0, koordinat_y: 0 } as StasiunHidrologi;
      const surroundingStations = [
        { stasiun: { id: '2', koordinat_x: 3, koordinat_y: 0 } as StasiunHidrologi, value: 100 }, // dist = 3, weight = 1/9
        { stasiun: { id: '3', koordinat_x: 0, koordinat_y: 4 } as StasiunHidrologi, value: 150 }  // dist = 4, weight = 1/16
      ];
      
      const result = infillIDW(targetStation, surroundingStations, 2);
      
      const w1 = 1 / 9;
      const w2 = 1 / 16;
      const expected = (100 * w1 + 150 * w2) / (w1 + w2);
      
      expect(result).toBeCloseTo(expected, 2);
    });

    it('should return 0 if no surrounding stations', () => {
      const targetStation = { id: '1', koordinat_x: 0, koordinat_y: 0 } as StasiunHidrologi;
      expect(infillIDW(targetStation, [])).toBe(0);
    });

    it('should return exact value if distance is 0', () => {
      const targetStation = { id: '1', koordinat_x: 0, koordinat_y: 0 } as StasiunHidrologi;
      const surroundingStations = [
        { stasiun: { id: '2', koordinat_x: 0, koordinat_y: 0 } as StasiunHidrologi, value: 100 }
      ];
      expect(infillIDW(targetStation, surroundingStations)).toBe(100);
    });

    it('should infill missing data using infillMissingData with IDW', () => {
      const targetStation = { id: '1', koordinat_x: 0, koordinat_y: 0 } as StasiunHidrologi;
      const allStations = [
        targetStation,
        { id: '2', koordinat_x: 3, koordinat_y: 0 } as StasiunHidrologi,
        { id: '3', koordinat_x: 0, koordinat_y: 4 } as StasiunHidrologi
      ];
      const allData = [
        { stasiun_id: '2', tanggal: '2023-01-01', curah_hujan: 100 } as DataHujan,
        { stasiun_id: '3', tanggal: '2023-01-01', curah_hujan: 150 } as DataHujan
      ];
      
      const result = infillMissingData(targetStation, allStations, allData, '2023-01-01', 'idw');
      
      const w1 = 1 / 9;
      const w2 = 1 / 16;
      const expected = (100 * w1 + 150 * w2) / (w1 + w2);
      
      expect(result).toBeCloseTo(expected, 2);
    });
  });
  describe('Edge Cases and Branch Coverage', () => {
    it('should handle california method in calculateTimeConcentration', () => {
      const result = calculateTimeConcentration({ L: 2, S: 0.01, method: 'california' });
      expect(result).toBeGreaterThan(0);
    });

    it('should handle bransby-williams method in calculateTimeConcentration', () => {
      const result = calculateTimeConcentration({ L: 2, S: 0.01, method: 'bransby-williams' });
      expect(result).toBeGreaterThan(0);
    });
  });
});
