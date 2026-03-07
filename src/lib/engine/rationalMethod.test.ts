import { describe, it, expect } from 'vitest';
import {
  calculateTc,
  calculateRationalDischarge,
  validateRationalInput,
  convertKm2ToHa,
  convertHaToKm2,
} from './rationalMethod';

describe('Rational Method Engine', () => {
  describe('calculateTc (Time of Concentration)', () => {
    it('should calculate Tc correctly for standard inputs', () => {
      const tc = calculateTc({ L: 2.5, K: 1.2 });
      expect(tc).toBeCloseTo(0.0347, 4);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => calculateTc({ L: -1, K: 1.2 })).toThrow();
      expect(() => calculateTc({ L: 2.5, K: 0 })).toThrow();
      expect(() => calculateTc({ L: 150, K: 1.2 })).toThrow(/maksimal 100 km/);
    });
  });

  describe('calculateRationalDischarge (Standard Rational Method)', () => {
    it('should calculate peak discharge correctly', () => {
      const result = calculateRationalDischarge({
        C: 0.75,
        I: 100,
        A: 250,
      });
      expect(result.Q).toBeCloseTo(52.125, 3);
      expect(result.qSpecific).toBeCloseTo(0.2085, 4);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle composite runoff coefficient (C) logic', () => {
      // Simulate composite C calculation: (C1*A1 + C2*A2) / (A1+A2)
      const area1 = 100; // Ha
      const c1 = 0.8; // High density residential
      const area2 = 150; // Ha
      const c2 = 0.4; // Parks/Green area
      
      const totalArea = area1 + area2;
      const compositeC = (c1 * area1 + c2 * area2) / totalArea;
      
      expect(compositeC).toBeCloseTo(0.56, 2);

      const result = calculateRationalDischarge({
        C: compositeC,
        I: 100,
        A: totalArea,
      });
      
      // Q = 0.00278 * 0.56 * 100 * 250 = 38.92
      expect(result.Q).toBeCloseTo(38.92, 2);
    });

    it('should integrate with IDF (Intensity Duration Frequency) logic', () => {
      // Simulate IDF integration where I is calculated based on Tc
      // e.g., I = a / (Tc + b)^c (Mononobe or similar)
      const tcHours = calculateTc({ L: 2.5, K: 1.2 }); // ~0.0347 hours
      const tcMinutes = tcHours * 60; // ~2.08 minutes
      
      // Mock Mononobe calculation: I = (R24/24) * (24/tcHours)^(2/3)
      const R24 = 120; // mm
      const I = (R24 / 24) * Math.pow(24 / tcHours, 2 / 3);
      
      const result = calculateRationalDischarge({
        C: 0.7,
        I: I,
        A: 50,
      });
      
      expect(result.Q).toBeGreaterThan(0);
      expect(result.warnings).toContain('Intensitas hujan sangat tinggi (>200 mm/jam). Verifikasi data hujan rencana.');
    });

    it('should generate warnings for large DAS areas (>300 Ha)', () => {
      const result = calculateRationalDischarge({
        C: 0.5,
        I: 50,
        A: 400,
      });
      expect(result.warnings).toContain(
        'Peringatan: Metode Rasional kurang akurat untuk DAS > 300 Ha. Pertimbangkan menggunakan metode HSS untuk hasil lebih akurat.'
      );
    });

    it('should generate warnings for very large DAS areas (>5000 Ha)', () => {
      const result = calculateRationalDischarge({
        C: 0.5,
        I: 50,
        A: 6000,
      });
      expect(result.warnings).toContain(
        'Peringatan: Metode Rasional kurang akurat untuk DAS > 5000 Ha. Disarankan menggunakan metode HSS (Hidrograf Satuan Sintetik).'
      );
    });

    it('should generate warnings for extreme C values', () => {
      const lowC = calculateRationalDischarge({ C: 0.05, I: 50, A: 100 });
      expect(lowC.warnings).toContain('Koefisien C sangat rendah. Pastikan tata guna lahan sudah sesuai.');

      const highC = calculateRationalDischarge({ C: 0.95, I: 50, A: 100 });
      expect(highC.warnings).toContain('Koefisien C sangat tinggi. Pastikan area sebagian besar kedap air.');
    });

    it('should throw error for invalid inputs', () => {
      expect(() => calculateRationalDischarge({ C: 1.5, I: 100, A: 250 })).toThrow();
      expect(() => calculateRationalDischarge({ C: 0.5, I: -10, A: 250 })).toThrow();
      expect(() => calculateRationalDischarge({ C: 0.5, I: 100, A: 60000 })).toThrow(/maksimal 50,000 Ha/);
    });
  });

  describe('validateRationalInput', () => {
    it('should return success for valid inputs', () => {
      const result = validateRationalInput({ C: 0.75, I: 100, A: 250 });
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid inputs', () => {
      const result = validateRationalInput({ C: 1.5, I: -10, A: 0 });
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('C:'))).toBe(true);
      expect(result.errors.some(e => e.includes('I:'))).toBe(true);
      expect(result.errors.some(e => e.includes('A:'))).toBe(true);
    });
  });

  describe('Unit Conversions', () => {
    it('should convert km2 to Ha correctly', () => {
      expect(convertKm2ToHa(2.5)).toBe(250);
      expect(convertKm2ToHa(0)).toBe(0);
    });

    it('should convert Ha to km2 correctly', () => {
      expect(convertHaToKm2(250)).toBe(2.5);
      expect(convertHaToKm2(0)).toBe(0);
    });
  });
});
