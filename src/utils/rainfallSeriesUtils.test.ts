import { describe, it, expect } from 'vitest';
import { calculateArealSeries, extractAnnualMaximums } from './rainfallSeriesUtils';
import { DataHujan } from '@/stores/useHydrologyStore';

describe('Rainfall Series Utils', () => {
  describe('calculateArealSeries', () => {
    it('should calculate weighted average correctly', () => {
      const allData: DataHujan[] = [
        { id: '1', stasiun_id: 'S1', tanggal: '2024-01-01', curah_hujan: 10 },
        { id: '2', stasiun_id: 'S2', tanggal: '2024-01-01', curah_hujan: 20 },
        { id: '3', stasiun_id: 'S1', tanggal: '2024-01-02', curah_hujan: 0 },
        { id: '4', stasiun_id: 'S2', tanggal: '2024-01-02', curah_hujan: 30 },
      ];
      const weights = { 'S1': 0.4, 'S2': 0.6 };

      const result = calculateArealSeries(allData, weights);
      
      expect(result).toHaveLength(2);
      // Date 1: 0.4*10 + 0.6*20 = 4 + 12 = 16
      expect(result[0].curah_hujan).toBe(16);
      expect(result[0].tanggal).toBe('2024-01-01');
      // Date 2: 0.4*0 + 0.6*30 = 18
      expect(result[1].curah_hujan).toBe(18);
    });

    it('should handle missing data by normalizing weights', () => {
      const allData: DataHujan[] = [
        { id: '1', stasiun_id: 'S1', tanggal: '2024-01-01', curah_hujan: 10 },
        // S2 missing on 2024-01-01
      ];
      const weights = { 'S1': 0.4, 'S2': 0.6 };

      const result = calculateArealSeries(allData, weights);
      
      expect(result).toHaveLength(1);
      // S1 is the only one present. Its weight is 0.4. Total present weight is 0.4.
      // Value = (10 * 0.4) / 0.4 = 10
      expect(result[0].curah_hujan).toBe(10);
    });
  });

  describe('extractAnnualMaximums', () => {
    it('should extract peaks per year', () => {
      const data: DataHujan[] = [
        { id: '1', stasiun_id: 'A', tanggal: '2023-01-01', curah_hujan: 50 },
        { id: '2', stasiun_id: 'A', tanggal: '2023-06-15', curah_hujan: 120 },
        { id: '3', stasiun_id: 'A', tanggal: '2023-12-31', curah_hujan: 80 },
        { id: '4', stasiun_id: 'A', tanggal: '2024-02-10', curah_hujan: 150 },
        { id: '5', stasiun_id: 'A', tanggal: '2024-11-05', curah_hujan: 90 },
      ];

      const result = extractAnnualMaximums(data);
      
      expect(result).toHaveLength(2);
      expect(result.find(r => r.year === 2023)?.value).toBe(120);
      expect(result.find(r => r.year === 2024)?.value).toBe(150);
    });
  });
});
