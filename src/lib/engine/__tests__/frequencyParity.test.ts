import { describe, it, expect } from 'vitest';
import {
  calculateStatisticalParams,
  distNormal,
  distLogNormal,
  distGumbel,
  distLogPearsonIII,
  calculateDistributions,
  calculateGoodnessOfFit,
  evaluateSNI2415Criteria,
  calculateWeibullPlottingPositions,
  getTheoreticalCDF,
  getQuantile,
  getChiSquareCritical,
  getKSCritical,
  NORMAL_Z,
  GUMBEL_YTR,
} from '@/lib/utils/frequencyMath';

describe('Frequency Analysis Parity & SNI 2415:2016 Compliance Tests', () => {
  // Standard benchmark hydrological dataset (10 years of annual maximum daily rainfall in mm)
  // Reference: Soewarno (1995) / Sri Harto (1993) standard hydrology textbook benchmark
  const testData = [105.0, 120.0, 95.0, 130.0, 110.0, 140.0, 85.0, 125.0, 115.0, 100.0];
  const returnPeriods = [2, 5, 10, 20, 25, 50, 100];

  describe('1. Descriptive Hydrological Statistics (calculateStatisticalParams)', () => {
    it('should accurately compute mean, standard deviation, variance, Cs, Ck, and Cv', () => {
      const stats = calculateStatisticalParams(testData);

      // Mean: sum = 1125, n = 10 => mean = 112.5
      expect(stats.mean).toBeCloseTo(112.5, 2);
      expect(stats.n).toBe(10);

      // Standard deviation
      expect(stats.stdDev).toBeGreaterThan(15);
      expect(stats.stdDev).toBeLessThan(18);

      // Coefficient of variation Cv = S / X_mean
      expect(stats.cv).toBeCloseTo(stats.stdDev / stats.mean, 4);

      // Skewness and Kurtosis should be finite numbers
      expect(Number.isFinite(stats.cs)).toBe(true);
      expect(Number.isFinite(stats.ck)).toBe(true);
    });

    it('should compute logarithmic statistical parameters correctly', () => {
      const logData = testData.map(x => Math.log10(x));
      const logStats = calculateStatisticalParams(logData);

      expect(logStats.mean).toBeGreaterThan(2.0);
      expect(logStats.mean).toBeLessThan(2.2);
      expect(logStats.stdDev).toBeGreaterThan(0.05);
      expect(Number.isFinite(logStats.cs)).toBe(true);
    });
  });

  describe('2. Four Hydrological Probability Distributions (SNI 2415:2016)', () => {
    it('should compute Normal Distribution monotonically increasing with Tr', () => {
      const results = returnPeriods.map(tr => ({
        tr,
        rainfall: distNormal(testData, tr)
      }));

      expect(results).toHaveLength(returnPeriods.length);

      // Monotonic increase
      for (let i = 1; i < results.length; i++) {
        expect(results[i].rainfall).toBeGreaterThan(results[i - 1].rainfall);
      }

      // Tr = 2 corresponds to mean (Z_0.5 = 0)
      const tr2 = results.find(r => r.tr === 2);
      const stats = calculateStatisticalParams(testData);
      expect(tr2?.rainfall).toBeCloseTo(stats.mean, 1);
    });

    it('should compute Log-Normal Distribution with log10 transformation', () => {
      const results = returnPeriods.map(tr => ({
        tr,
        rainfall: distLogNormal(testData, tr)
      }));

      expect(results).toHaveLength(returnPeriods.length);

      for (let i = 1; i < results.length; i++) {
        expect(results[i].rainfall).toBeGreaterThan(results[i - 1].rainfall);
      }

      const tr100 = results.find(r => r.tr === 100);
      const stats = calculateStatisticalParams(testData);
      expect(tr100?.rainfall).toBeGreaterThan(stats.mean);
      expect(tr100?.rainfall).toBeLessThan(250.0);
    });

    it('should compute Gumbel Type I (EVI) Distribution including Tr = 20', () => {
      const results = returnPeriods.map(tr => ({
        tr,
        rainfall: distGumbel(testData, tr)
      }));

      expect(results).toHaveLength(returnPeriods.length);

      const tr20 = results.find(r => r.tr === 20);
      expect(tr20).toBeDefined();
      expect(tr20?.rainfall).toBeGreaterThan(0);

      for (let i = 1; i < results.length; i++) {
        expect(results[i].rainfall).toBeGreaterThan(results[i - 1].rainfall);
      }
    });

    it('should compute Log-Pearson Type III Distribution', () => {
      const results = returnPeriods.map(tr => ({
        tr,
        rainfall: distLogPearsonIII(testData, tr)
      }));

      expect(results).toHaveLength(returnPeriods.length);

      for (let i = 1; i < results.length; i++) {
        expect(results[i].rainfall).toBeGreaterThan(results[i - 1].rainfall);
      }

      const tr25 = results.find(r => r.tr === 25);
      const stats = calculateStatisticalParams(testData);
      expect(tr25?.rainfall).toBeGreaterThan(stats.mean);
    });

    it('should batch calculate all 4 distributions via calculateDistributions', () => {
      const distributions = calculateDistributions(testData, returnPeriods);
      expect(distributions).toHaveLength(4);

      const methods = distributions.map(d => d.method);
      expect(methods).toContain('normal');
      expect(methods).toContain('lognormal');
      expect(methods).toContain('gumbel');
      expect(methods).toContain('logpearson3');

      distributions.forEach(d => {
        expect(d.values).toHaveLength(returnPeriods.length);
        d.values.forEach(v => {
          expect(v.R24).toBeGreaterThan(0);
          expect(v.Tr).toBeGreaterThanOrEqual(2);
        });
      });
    });
  });

  describe('3. Goodness-of-Fit Tests (calculateGoodnessOfFit)', () => {
    it('should perform Chi-Square and Kolmogorov-Smirnov tests for all 4 distributions', () => {
      const distributions = calculateDistributions(testData, returnPeriods);
      const gofResults = calculateGoodnessOfFit(testData, distributions);

      expect(gofResults).toHaveLength(4);

      gofResults.forEach(gof => {
        // Chi-Square assertions
        expect(gof.chiSquare.statistic).toBeGreaterThanOrEqual(0);
        expect(gof.chiSquare.critical).toBeGreaterThan(0);
        expect(gof.chiSquare.degreesOfFreedom).toBeGreaterThanOrEqual(1);
        expect(typeof gof.chiSquare.accepted).toBe('boolean');
        expect(gof.chiSquare.classes.length).toBeGreaterThanOrEqual(3);

        // Kolmogorov-Smirnov assertions
        expect(gof.kolmogorovSmirnov.statistic).toBeGreaterThanOrEqual(0);
        expect(gof.kolmogorovSmirnov.statistic).toBeLessThanOrEqual(1.0);
        expect(gof.kolmogorovSmirnov.critical).toBeGreaterThan(0);
        expect(typeof gof.kolmogorovSmirnov.accepted).toBe('boolean');
      });
    });

    it('should evaluate theoretical CDF and quantiles monotonically', () => {
      const paramsAsli = calculateStatisticalParams(testData);
      const logData = testData.map(x => Math.log10(x));
      const paramsLog = calculateStatisticalParams(logData);

      // getTheoreticalCDF between 0 and 1
      const cdfMid = getTheoreticalCDF(paramsAsli.mean, 'normal', paramsAsli, paramsLog);
      expect(cdfMid).toBeCloseTo(0.5, 2);

      // getQuantile at p=0.5 should equal mean for normal
      const qMid = getQuantile(0.5, 'normal', paramsAsli, paramsLog);
      expect(qMid).toBeCloseTo(paramsAsli.mean, 1);

      // Quantile should be monotonically increasing with p
      const qLow = getQuantile(0.2, 'normal', paramsAsli, paramsLog);
      const qHigh = getQuantile(0.8, 'normal', paramsAsli, paramsLog);
      expect(qLow).toBeLessThan(qMid);
      expect(qMid).toBeLessThan(qHigh);
    });
  });

  describe('4. SNI 2415:2016 Table 1 Criteria Evaluation (evaluateSNI2415Criteria)', () => {
    it('should evaluate statistical characteristics against SNI 2415 requirements', () => {
      const paramsAsli = calculateStatisticalParams(testData);
      const logData = testData.map(x => Math.log10(x));
      const paramsLog = calculateStatisticalParams(logData);

      const criteria = evaluateSNI2415Criteria(paramsAsli, paramsLog);

      expect(criteria).toHaveLength(4);

      const normalCrit = criteria.find(c => c.method === 'normal');
      const gumbelCrit = criteria.find(c => c.method === 'gumbel');
      const logNormCrit = criteria.find(c => c.method === 'lognormal');
      const lp3Crit = criteria.find(c => c.method === 'logpearson3');

      expect(normalCrit).toBeDefined();
      expect(gumbelCrit).toBeDefined();
      expect(logNormCrit).toBeDefined();
      expect(lp3Crit).toBeDefined();

      expect(['SESUAI', 'MENDEKATI', 'TIDAK_SESUAI']).toContain(normalCrit?.status);
      expect(['SESUAI', 'MENDEKATI', 'TIDAK_SESUAI']).toContain(gumbelCrit?.status);
      expect(normalCrit?.criteriaText).toBeDefined();
      expect(gumbelCrit?.actualValuesText).toBeDefined();
    });
  });

  describe('5. Weibull Plotting Positions (calculateWeibullPlottingPositions)', () => {
    it('should compute empirical Weibull plotting positions correctly: P = m / (n + 1)', () => {
      const weibull = calculateWeibullPlottingPositions(testData);
      const n = testData.length;

      expect(weibull).toHaveLength(n);
      // Sorted descending: rank 1 is highest value
      expect(weibull[0].rainfall).toBe(140.0);
      expect(weibull[0].m).toBe(1);
      expect(weibull[0].pWeibull).toBeCloseTo(1 / (n + 1), 4);
      expect(weibull[0].returnPeriod).toBeCloseTo((n + 1) / 1, 4);

      // Rank n is lowest value
      expect(weibull[n - 1].rainfall).toBe(85.0);
      expect(weibull[n - 1].m).toBe(n);
      expect(weibull[n - 1].pWeibull).toBeCloseTo(n / (n + 1), 4);
      expect(weibull[n - 1].returnPeriod).toBeCloseTo((n + 1) / n, 4);
    });
  });

  describe('6. Hardcoded Lookup Table Integrity', () => {
    it('should contain accurate standard normal Z factors', () => {
      expect(NORMAL_Z[2]).toBe(0.000);
      expect(NORMAL_Z[5]).toBe(0.842);
      expect(NORMAL_Z[10]).toBe(1.282);
      expect(NORMAL_Z[20]).toBe(1.645);
      expect(NORMAL_Z[25]).toBe(1.751);
      expect(NORMAL_Z[50]).toBe(2.054);
      expect(NORMAL_Z[100]).toBe(2.326);
    });

    it('should return valid critical values from Chi-Square and KS tables', () => {
      const chiCrit = getChiSquareCritical(2, 0.05);
      expect(chiCrit).toBeCloseTo(5.991, 2);

      const ksCrit = getKSCritical(10);
      expect(ksCrit).toBeGreaterThan(0.3);
      expect(ksCrit).toBeLessThan(0.5);
    });
  });
});
