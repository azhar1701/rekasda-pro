import { describe, it, expect } from 'vitest';
import { calculateDistance, infillIDW, infillNormalRatio } from './spatialMath';
import { StasiunHidrologi } from '@/stores/useHydrologyStore';

describe('spatialMath', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      expect(calculateDistance(0, 0, 3, 4)).toBe(5);
      expect(calculateDistance(1, 1, 4, 5)).toBe(5);
    });
  });

  describe('infillIDW', () => {
    const target: StasiunHidrologi = {
      id: 'target',
      nama_stasiun: 'Target',
      koordinat_x: 0,
      koordinat_y: 0,
      elevasi: 0,
      keterangan: ''
    };

    it('should calculate IDW correctly', () => {
      const surrounding = [
        {
          stasiun: { id: 's1', koordinat_x: 1, koordinat_y: 0 } as StasiunHidrologi,
          value: 10
        },
        {
          stasiun: { id: 's2', koordinat_x: 0, koordinat_y: 1 } as StasiunHidrologi,
          value: 20
        }
      ];
      // Weights are 1/1^2 = 1 for both
      // (10*1 + 20*1) / (1 + 1) = 15
      expect(infillIDW(target, surrounding)).toBe(15);
    });
  });

  describe('infillNormalRatio', () => {
    it('should calculate Normal Ratio correctly', () => {
      const targetAvg = 100;
      const surrounding = [
        { avg: 110, value: 110 }, // (100/110) * 110 = 100
        { avg: 90, value: 90 }    // (100/90) * 90 = 100
      ];
      // (100 + 100) / 2 = 100
      expect(infillNormalRatio(targetAvg, surrounding)).toBe(100);
    });
  });
});
