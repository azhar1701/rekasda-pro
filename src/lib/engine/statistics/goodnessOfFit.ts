/**
 * Goodness of Fit Testing Engine
 * ===============================
 * 
 * Statistical tests to validate if a chosen distribution fits the observed data.
 * Implements Chi-Square and Smirnov-Kolmogorov tests per SNI 2415:2016.
 * 
 * @module GoodnessOfFitEngine
 * @standard SNI 2415:2016 Lampiran D
 * @author RekaSDA Engineering Team
 */

import { calculateStatistics, type DistributionMethod } from './frequency';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ChiSquareResult {
  isAccepted: boolean;
  calculatedValue: number;
  criticalValue: number;
  degreesOfFreedom: number;
  alpha: number;
  details: {
    numClasses: number;
    observedFrequencies: number[];
    expectedFrequencies: number[];
  };
}

export interface SmirnovKolmogorovResult {
  isAccepted: boolean;
  deltaMax: number;
  deltaCritical: number;
  alpha: number;
  details: {
    empiricalProb: number[];
    theoreticalProb: number[];
    differences: number[];
  };
}

export interface GoodnessOfFitResult {
  isAccepted: boolean;
  chiSquare: ChiSquareResult;
  smirnovKolmogorov: SmirnovKolmogorovResult;
  warnings: string[];
}

// ============================================================================
// CRITICAL VALUE TABLES
// ============================================================================

/**
 * Chi-Square Critical Values (α = 0.05)
 * Key: Degrees of Freedom
 */
const CHI_SQUARE_CRITICAL: Record<number, number> = {
  1: 3.841, 2: 5.991, 3: 7.815, 4: 9.488, 5: 11.070,
  6: 12.592, 7: 14.067, 8: 15.507, 9: 16.919, 10: 18.307,
  11: 19.675, 12: 21.026, 13: 22.362, 14: 23.685, 15: 24.996,
  16: 26.296, 17: 27.587, 18: 28.869, 19: 30.144, 20: 31.410,
};

/**
 * Smirnov-Kolmogorov Critical Values (α = 0.05)
 * Key: Sample size n
 */
const SMIRNOV_KOLMOGOROV_CRITICAL: Record<number, number> = {
  10: 0.409, 15: 0.338, 20: 0.294, 25: 0.264, 30: 0.242,
  35: 0.224, 40: 0.210, 45: 0.198, 50: 0.188, 60: 0.172,
  70: 0.160, 80: 0.150, 90: 0.141, 100: 0.134,
};

/**
 * Get Chi-Square critical value with interpolation
 */
function getChiSquareCritical(df: number): number {
  if (CHI_SQUARE_CRITICAL[df]) return CHI_SQUARE_CRITICAL[df];
  if (df > 20) return 31.410 + (df - 20) * 1.3; // Linear approximation
  return 3.841;
}

/**
 * Get Smirnov-Kolmogorov critical value with interpolation
 */
function getSmirnovKolmogorovCritical(n: number): number {
  if (SMIRNOV_KOLMOGOROV_CRITICAL[n]) return SMIRNOV_KOLMOGOROV_CRITICAL[n];
  
  // Find nearest values for interpolation
  const keys = Object.keys(SMIRNOV_KOLMOGOROV_CRITICAL).map(Number).sort((a, b) => a - b);
  const lower = keys.filter(k => k < n).pop() || 10;
  const upper = keys.filter(k => k > n).shift() || 100;
  
  if (lower === upper) return SMIRNOV_KOLMOGOROV_CRITICAL[lower];
  
  // Linear interpolation
  const ratio = (n - lower) / (upper - lower);
  return SMIRNOV_KOLMOGOROV_CRITICAL[lower] + 
         ratio * (SMIRNOV_KOLMOGOROV_CRITICAL[upper] - SMIRNOV_KOLMOGOROV_CRITICAL[lower]);
}

// ============================================================================
// DISTRIBUTION CDF FUNCTIONS
// ============================================================================

/**
 * Standard Normal CDF (Cumulative Distribution Function)
 */
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - prob : prob;
}

/**
 * Gumbel CDF
 */
function gumbelCDF(x: number, mean: number, stdDev: number): number {
  const yn = 0.5772;
  const sn = 1.2825;
  const y = yn + sn * (x - mean) / stdDev;
  return Math.exp(-Math.exp(-y));
}

/**
 * Calculate theoretical probability for a value based on distribution
 */
function getTheoreticalProbability(
  value: number,
  mean: number,
  stdDev: number,
  method: DistributionMethod
): number {
  const z = (value - mean) / stdDev;
  
  switch (method) {
    case 'normal':
      return normalCDF(z);
    case 'gumbel':
      return gumbelCDF(value, mean, stdDev);
    case 'lognormal':
      const logValue = Math.log(value);
      const logMean = Math.log(mean);
      const logStd = Math.sqrt(Math.log(1 + (stdDev / mean) ** 2));
      const zLog = (logValue - logMean) / logStd;
      return normalCDF(zLog);
    case 'logpearson3':
      // Simplified approximation using normal CDF
      return normalCDF(z);
    default:
      return normalCDF(z);
  }
}

// ============================================================================
// CHI-SQUARE TEST
// ============================================================================

/**
 * Chi-Square Goodness of Fit Test (Uji Chi-Kuadrat)
 * 
 * Tests if observed frequencies match expected frequencies from theoretical distribution.
 * 
 * Formula: X² = Σ[(Of - Ef)² / Ef]
 * 
 * Where:
 * - Of = Observed frequency
 * - Ef = Expected frequency
 * - K = Number of classes = 1 + 3.322 log(n)
 * - df = K - p - 1 (p = number of parameters)
 * 
 * @param data - Historical data array
 * @param method - Distribution method
 * @returns Chi-Square test result
 * 
 * @reference SNI 2415:2016 Lampiran D.1
 */
export function calculateChiSquareTest(
  data: number[],
  method: DistributionMethod
): ChiSquareResult {
  const n = data.length;
  const stats = calculateStatistics(data);
  
  // Determine number of classes: K = 1 + 3.322 log(n)
  const K = Math.ceil(1 + 3.322 * Math.log10(n));
  const numClasses = Math.max(5, Math.min(K, 10)); // Between 5 and 10 classes
  
  // Sort data
  const sortedData = [...data].sort((a, b) => a - b);
  const min = sortedData[0];
  const max = sortedData[sortedData.length - 1];
  const classWidth = (max - min) / numClasses;
  
  // Calculate observed frequencies
  const observedFreq: number[] = new Array(numClasses).fill(0);
  const expectedFreq: number[] = new Array(numClasses).fill(0);
  
  for (let i = 0; i < numClasses; i++) {
    const lowerBound = min + i * classWidth;
    const upperBound = min + (i + 1) * classWidth;
    
    // Count observed frequency
    observedFreq[i] = sortedData.filter(x => x >= lowerBound && x < upperBound).length;
    if (i === numClasses - 1) {
      observedFreq[i] = sortedData.filter(x => x >= lowerBound && x <= upperBound).length;
    }
    
    // Calculate expected frequency
    const pLower = getTheoreticalProbability(lowerBound, stats.mean, stats.stdDev, method);
    const pUpper = getTheoreticalProbability(upperBound, stats.mean, stats.stdDev, method);
    expectedFreq[i] = n * Math.abs(pUpper - pLower);
  }
  
  // Merge classes with expected frequency < 5
  const mergedObserved: number[] = [];
  const mergedExpected: number[] = [];
  let tempObs = 0;
  let tempExp = 0;
  
  for (let i = 0; i < numClasses; i++) {
    tempObs += observedFreq[i];
    tempExp += expectedFreq[i];
    
    if (tempExp >= 5 || i === numClasses - 1) {
      mergedObserved.push(tempObs);
      mergedExpected.push(tempExp);
      tempObs = 0;
      tempExp = 0;
    }
  }
  
  // Calculate Chi-Square statistic
  let chiSquare = 0;
  for (let i = 0; i < mergedObserved.length; i++) {
    const diff = mergedObserved[i] - mergedExpected[i];
    chiSquare += (diff * diff) / mergedExpected[i];
  }
  
  // Degrees of freedom: K - p - 1 (p = 2 for mean and std dev)
  const df = Math.max(1, mergedObserved.length - 2 - 1);
  const criticalValue = getChiSquareCritical(df);
  
  return {
    isAccepted: chiSquare <= criticalValue,
    calculatedValue: parseFloat(chiSquare.toFixed(3)),
    criticalValue: parseFloat(criticalValue.toFixed(3)),
    degreesOfFreedom: df,
    alpha: 0.05,
    details: {
      numClasses: mergedObserved.length,
      observedFrequencies: mergedObserved,
      expectedFrequencies: mergedExpected.map(f => parseFloat(f.toFixed(2))),
    },
  };
}

// ============================================================================
// SMIRNOV-KOLMOGOROV TEST
// ============================================================================

/**
 * Smirnov-Kolmogorov Goodness of Fit Test
 * 
 * Tests maximum difference between empirical and theoretical CDFs.
 * 
 * Formula: Δmax = max|P(X) - P'(X)|
 * 
 * Where:
 * - P(X) = Empirical probability = m/(n+1) (Weibull plotting position)
 * - P'(X) = Theoretical probability from distribution CDF
 * - m = Rank (1 for largest value)
 * 
 * @param data - Historical data array
 * @param method - Distribution method
 * @returns Smirnov-Kolmogorov test result
 * 
 * @reference SNI 2415:2016 Lampiran D.2
 */
export function calculateSmirnovKolmogorovTest(
  data: number[],
  method: DistributionMethod
): SmirnovKolmogorovResult {
  const n = data.length;
  const stats = calculateStatistics(data);
  
  // Sort data in descending order
  const sortedData = [...data].sort((a, b) => b - a);
  
  const empiricalProb: number[] = [];
  const theoreticalProb: number[] = [];
  const differences: number[] = [];
  
  for (let m = 1; m <= n; m++) {
    const value = sortedData[m - 1];
    
    // Empirical probability (Weibull plotting position)
    const pEmpirical = m / (n + 1);
    empiricalProb.push(pEmpirical);
    
    // Theoretical probability
    const pTheoretical = 1 - getTheoreticalProbability(value, stats.mean, stats.stdDev, method);
    theoreticalProb.push(pTheoretical);
    
    // Absolute difference
    const diff = Math.abs(pEmpirical - pTheoretical);
    differences.push(diff);
  }
  
  // Find maximum difference
  const deltaMax = Math.max(...differences);
  const deltaCritical = getSmirnovKolmogorovCritical(n);
  
  return {
    isAccepted: deltaMax <= deltaCritical,
    deltaMax: parseFloat(deltaMax.toFixed(4)),
    deltaCritical: parseFloat(deltaCritical.toFixed(4)),
    alpha: 0.05,
    details: {
      empiricalProb: empiricalProb.map(p => parseFloat(p.toFixed(4))),
      theoreticalProb: theoreticalProb.map(p => parseFloat(p.toFixed(4))),
      differences: differences.map(d => parseFloat(d.toFixed(4))),
    },
  };
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate Distribution Fit
 * 
 * Runs both Chi-Square and Smirnov-Kolmogorov tests.
 * Distribution is accepted only if BOTH tests pass.
 * 
 * @param data - Historical data array
 * @param method - Distribution method to test
 * @returns Complete goodness of fit result
 * 
 * @example
 * ```typescript
 * const result = validateDistributionFit(
 *   [80, 95, 110, 125, 140, 155, 170, 185, 200, 215],
 *   'gumbel'
 * );
 * if (result.isAccepted) {
 *   console.log('Distribution fits the data');
 * }
 * ```
 */
export function validateDistributionFit(
  data: number[],
  method: DistributionMethod
): GoodnessOfFitResult {
  const warnings: string[] = [];
  
  // Validate minimum data requirement
  if (data.length < 10) {
    warnings.push('Data kurang dari 10 tahun. Uji kecocokan tidak reliable.');
  }
  
  // Run both tests
  const chiSquare = calculateChiSquareTest(data, method);
  const smirnovKolmogorov = calculateSmirnovKolmogorovTest(data, method);
  
  // Both tests must pass
  const isAccepted = chiSquare.isAccepted && smirnovKolmogorov.isAccepted;
  
  // Generate warnings
  if (!chiSquare.isAccepted) {
    warnings.push(
      `Uji Chi-Square GAGAL: X²hitung (${chiSquare.calculatedValue}) > X²kritis (${chiSquare.criticalValue})`
    );
  }
  
  if (!smirnovKolmogorov.isAccepted) {
    warnings.push(
      `Uji Smirnov-Kolmogorov GAGAL: Δmax (${smirnovKolmogorov.deltaMax}) > Δkritis (${smirnovKolmogorov.deltaCritical})`
    );
  }
  
  if (!isAccepted) {
    warnings.push(
      `Distribusi ${method.toUpperCase()} tidak cocok dengan data. Pertimbangkan distribusi lain.`
    );
  }
  
  return {
    isAccepted,
    chiSquare,
    smirnovKolmogorov,
    warnings,
  };
}
