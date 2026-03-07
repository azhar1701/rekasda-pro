import { describe, it, expect } from 'vitest';
import {
  analyzeNormal,
  analyzeLogNormal,
  analyzeGumbel,
  analyzeLogPearson3,
  performFrequencyAnalysis,
  recommendDistribution,
  validateFrequencyInput
} from './frequency';

describe('Frequency Analysis Engine', () => {
  // Known dataset for testing (e.g., annual maximum rainfall in mm)
  const testData = [
    95, 105, 115, 120, 125, 130, 135, 140, 145, 150, 
    155, 160, 165, 170, 175, 180, 185, 190, 200, 210
  ];
  const returnPeriods = [2, 5, 10, 25, 50, 100];

  const input = {
    data: testData,
    returnPeriods
  };

  describe('analyzeNormal', () => {
    it('should calculate normal distribution correctly', () => {
      const result = analyzeNormal(input);
      expect(result.method).toBe('normal');
      expect(result.parameters.n).toBe(20);
      expect(result.parameters.mean).toBeGreaterThan(0);
      expect(result.designValues.length).toBe(6);
      expect(result.designValues[0].returnPeriod).toBe(2);
      expect(result.designValues[0].designValue).toBeGreaterThan(0);
    });
  });

  describe('analyzeLogNormal', () => {
    it('should calculate log-normal distribution correctly', () => {
      const result = analyzeLogNormal(input);
      expect(result.method).toBe('lognormal');
      expect(result.parameters.n).toBe(20);
      expect(result.designValues.length).toBe(6);
      expect(result.designValues[0].designValue).toBeGreaterThan(0);
    });
  });

  describe('analyzeGumbel', () => {
    it('should calculate Gumbel distribution correctly', () => {
      const result = analyzeGumbel(input);
      expect(result.method).toBe('gumbel');
      expect(result.parameters.n).toBe(20);
      expect(result.designValues.length).toBe(6);
      expect(result.designValues[0].designValue).toBeGreaterThan(0);
      
      // Gumbel specific checks
      const tr100 = result.designValues.find(d => d.returnPeriod === 100);
      expect(tr100).toBeDefined();
      expect(tr100!.designValue).toBeGreaterThan(result.parameters.mean);
    });
  });

  describe('analyzeLogPearson3', () => {
    it('should calculate Log-Pearson Type III distribution correctly', () => {
      const result = analyzeLogPearson3(input);
      expect(result.method).toBe('logpearson3');
      expect(result.parameters.n).toBe(20);
      expect(result.designValues.length).toBe(6);
      expect(result.designValues[0].designValue).toBeGreaterThan(0);
    });
  });

  describe('performFrequencyAnalysis', () => {
    it('should route to correct method', () => {
      const resultGumbel = performFrequencyAnalysis(input, 'gumbel');
      expect(resultGumbel.method).toBe('gumbel');

      const resultLP3 = performFrequencyAnalysis(input, 'logpearson3');
      expect(resultLP3.method).toBe('logpearson3');
    });

    it('should throw on unknown method', () => {
      expect(() => performFrequencyAnalysis(input, 'unknown' as any)).toThrow();
    });
  });

  describe('recommendDistribution', () => {
    it('should recommend a distribution based on data', () => {
      const recommendation = recommendDistribution(testData);
      expect(['normal', 'lognormal', 'gumbel', 'logpearson3']).toContain(recommendation);
    });
  });

  describe('validateFrequencyInput', () => {
    it('should validate correct input', () => {
      const validation = validateFrequencyInput(input);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should return errors for invalid input', () => {
      const invalidInput = {
        data: [1, 2], // Too few data points
        returnPeriods: [0] // Invalid return period
      };
      const validation = validateFrequencyInput(invalidInput);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });
});
