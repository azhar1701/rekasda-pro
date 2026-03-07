import { describe, it, expect } from 'vitest';
import {
  calculateChiSquareTest,
  calculateKolmogorovSmirnovTest,
  validateDistributionFit
} from './goodnessOfFit';

describe('Goodness of Fit Tests', () => {
  // Sample data for testing
  const sampleData = [
    10.5, 12.1, 11.8, 13.2, 14.5, 
    15.1, 16.2, 17.5, 18.1, 19.5,
    20.1, 21.5, 22.8, 23.1, 24.5,
    25.1, 26.2, 27.5, 28.1, 29.5
  ];

  describe('calculateChiSquareTest', () => {
    it('should calculate Chi-Square for normal distribution', () => {
      const result = calculateChiSquareTest(sampleData, 'normal');
      
      expect(result).toBeDefined();
      expect(result.calculatedValue).toBeGreaterThanOrEqual(0);
      expect(result.criticalValue).toBeGreaterThan(0);
      expect(result.degreesOfFreedom).toBeGreaterThan(0);
      expect(result.details.numClasses).toBeGreaterThan(0);
      expect(result.details.classes.length).toBe(result.details.numClasses);
      expect(typeof result.isAccepted).toBe('boolean');
    });

    it('should calculate Chi-Square for gumbel distribution', () => {
      const result = calculateChiSquareTest(sampleData, 'gumbel');
      expect(result).toBeDefined();
      expect(typeof result.isAccepted).toBe('boolean');
    });

    it('should calculate Chi-Square for lognormal distribution', () => {
      const result = calculateChiSquareTest(sampleData, 'lognormal');
      expect(result).toBeDefined();
      expect(typeof result.isAccepted).toBe('boolean');
    });

    it('should calculate Chi-Square for logpearson3 distribution', () => {
      const result = calculateChiSquareTest(sampleData, 'logpearson3');
      expect(result).toBeDefined();
      expect(typeof result.isAccepted).toBe('boolean');
    });
  });

  describe('calculateKolmogorovSmirnovTest', () => {
    it('should calculate Kolmogorov-Smirnov for normal distribution', () => {
      const result = calculateKolmogorovSmirnovTest(sampleData, 'normal');
      
      expect(result).toBeDefined();
      expect(result.deltaMax).toBeGreaterThanOrEqual(0);
      expect(result.deltaCritical).toBeGreaterThan(0);
      expect(result.details.dataPoints.length).toBe(sampleData.length);
      expect(typeof result.isAccepted).toBe('boolean');
    });

    it('should calculate Kolmogorov-Smirnov for gumbel distribution', () => {
      const result = calculateKolmogorovSmirnovTest(sampleData, 'gumbel');
      expect(result).toBeDefined();
      expect(typeof result.isAccepted).toBe('boolean');
    });

    it('should calculate Kolmogorov-Smirnov for lognormal distribution', () => {
      const result = calculateKolmogorovSmirnovTest(sampleData, 'lognormal');
      expect(result).toBeDefined();
      expect(typeof result.isAccepted).toBe('boolean');
    });

    it('should calculate Kolmogorov-Smirnov for logpearson3 distribution', () => {
      const result = calculateKolmogorovSmirnovTest(sampleData, 'logpearson3');
      expect(result).toBeDefined();
      expect(typeof result.isAccepted).toBe('boolean');
    });
  });

  describe('validateDistributionFit', () => {
    it('should validate distribution fit and return combined results', () => {
      const result = validateDistributionFit(sampleData, 'normal');
      
      expect(result).toBeDefined();
      expect(result.chiSquare).toBeDefined();
      expect(result.kolmogorovSmirnov).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(typeof result.recommendation).toBe('string');
      
      // isValid should be true only if both tests are accepted
      expect(result.isValid).toBe(result.chiSquare.isAccepted && result.kolmogorovSmirnov.isAccepted);
    });
  });
});
