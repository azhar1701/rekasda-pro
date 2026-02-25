/**
 * Goodness of Fit Test Engine
 * ============================
 * Statistical validation for frequency distribution analysis
 * 
 * @module GoodnessOfFitEngine
 * @standard SNI 2415:2016 Lampiran D
 */

import { calculateStatistics } from './frequency';

// ============================================================================
// CRITICAL VALUE TABLES
// ============================================================================

/**
 * Chi-Square Critical Values (α = 5%, df = K-3)
 * Approximation for degrees of freedom 1-20
 */
const CHI_SQUARE_CRITICAL: Record<number, number> = {
  1: 3.841, 2: 5.991, 3: 7.815, 4: 9.488, 5: 11.070,
  6: 12.592, 7: 14.067, 8: 15.507, 9: 16.919, 10: 18.307,
  11: 19.675, 12: 21.026, 13: 22.362, 14: 23.685, 15: 24.996,
  16: 26.296, 17: 27.587, 18: 28.869, 19: 30.144, 20: 31.410
};

/**
 * Kolmogorov-Smirnov Critical Values (α = 5%)
 * Δcritical = 1.36 / √n (approximation for n > 35)
 */
const KOLMOGOROV_CRITICAL: Record<number, number> = {
  10: 0.409, 15: 0.338, 20: 0.294, 25: 0.264, 30: 0.242,
  35: 0.224, 40: 0.210, 45: 0.198, 50: 0.188, 60: 0.172,
  70: 0.160, 80: 0.150, 90: 0.142, 100: 0.136
};

/**
 * Get Kolmogorov critical value with interpolation
 */
function getKolmogorovCritical(n: number): number {
  if (n >= 35) return 1.36 / Math.sqrt(n);
  
  const keys = Object.keys(KOLMOGOROV_CRITICAL).map(Number).sort((a, b) => a - b);
  const lower = keys.filter(k => k <= n).pop() || 10;
  const upper = keys.find(k => k > n) || 100;
  
  if (lower === upper) return KOLMOGOROV_CRITICAL[lower];
  
  const ratio = (n - lower) / (upper - lower);
  return KOLMOGOROV_CRITICAL[lower] + ratio * (KOLMOGOROV_CRITICAL[upper] - KOLMOGOROV_CRITICAL[lower]);
}

// ============================================================================
// DISTRIBUTION CDF FUNCTIONS
// ============================================================================

/**
 * Standard Normal CDF (Cumulative Distribution Function)
 * Using error function approximation
 */
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

/**
 * Gumbel CDF
 * F(x) = exp(-exp(-(x - μ) / σ × √6/π + 0.5772))
 */
function gumbelCDF(x: number, mean: number, stdDev: number): number {
  const alpha = Math.sqrt(6) / Math.PI / stdDev;
  const u = mean - 0.5772 / alpha;
  return Math.exp(-Math.exp(-alpha * (x - u)));
}

/**
 * Get theoretical CDF value based on distribution type
 */
function getTheoreticalCDF(x: number, distributionType: string, mean: number, stdDev: number): number {
  const z = (x - mean) / stdDev;
  
  switch (distributionType) {
    case 'normal':
      return normalCDF(z);
    case 'gumbel':
      return gumbelCDF(x, mean, stdDev);
    case 'lognormal':
      const logX = Math.log(x);
      const logMean = Math.log(mean) - 0.5 * Math.log(1 + Math.pow(stdDev / mean, 2));
      const logStd = Math.sqrt(Math.log(1 + Math.pow(stdDev / mean, 2)));
      return normalCDF((logX - logMean) / logStd);
    case 'logpearson3':
      // KNOWN LIMITATION: LP3 CDF approximated via Log-Normal (skewness Cs ignored).
      // Full LP3 CDF requires incomplete gamma function — acceptable for screening,
      // but results should be interpreted with caution. See audit report F-05.
      const logXp = Math.log(Math.max(x, 1e-10));
      const logMeanP = Math.log(Math.max(mean, 1e-10));
      const logStdP = Math.sqrt(Math.log(1 + Math.pow(stdDev / mean, 2)));
      return normalCDF((logXp - logMeanP) / logStdP);
    default:
      return normalCDF(z);
  }
}

// ============================================================================
// CHI-SQUARE TEST
// ============================================================================

export interface ChiSquareResult {
  isAccepted: boolean;
  calculatedValue: number;
  criticalValue: number;
  degreesOfFreedom: number;
  details: {
    numClasses: number;
    classes: Array<{
      range: string;
      observed: number;
      expected: number;
      contribution: number;
    }>;
  };
}

/**
 * Chi-Square Goodness of Fit Test
 * 
 * Formula: X² = Σ[(Of - Ef)² / Ef]
 * 
 * @param data - Historical data array
 * @param distributionType - Distribution to test
 * @returns Chi-Square test result
 * 
 * @reference SNI 2415:2016 Lampiran D.1
 */
export function calculateChiSquareTest(data: number[], distributionType: string): ChiSquareResult {
  const n = data.length;
  const stats = calculateStatistics(data);
  
  // Determine number of classes: K = 1 + 3.322 × log(n)
  const K = Math.ceil(1 + 3.322 * Math.log10(n));
  
  // Sort data
  const sortedData = [...data].sort((a, b) => a - b);
  const min = sortedData[0];
  const max = sortedData[sortedData.length - 1];
  const classWidth = (max - min) / K;
  
  // Create classes and count observed frequencies
  const classes: Array<{ range: string; observed: number; expected: number; contribution: number }> = [];
  let chiSquare = 0;
  
  for (let i = 0; i < K; i++) {
    const lowerBound = min + i * classWidth;
    const upperBound = min + (i + 1) * classWidth;
    
    // Count observed frequency
    const observed = sortedData.filter(x => x >= lowerBound && (i === K - 1 ? x <= upperBound : x < upperBound)).length;
    
    // Calculate expected frequency using CDF
    const pLower = getTheoreticalCDF(lowerBound, distributionType, stats.mean, stats.stdDev);
    const pUpper = getTheoreticalCDF(upperBound, distributionType, stats.mean, stats.stdDev);
    const expected = n * (pUpper - pLower);
    
    // Chi-square contribution
    const contribution = expected > 0 ? Math.pow(observed - expected, 2) / expected : 0;
    chiSquare += contribution;
    
    classes.push({
      range: `${lowerBound.toFixed(1)} - ${upperBound.toFixed(1)}`,
      observed,
      expected: parseFloat(expected.toFixed(2)),
      contribution: parseFloat(contribution.toFixed(3))
    });
  }
  
  // Degrees of freedom: df = K - p - 1 (p = number of parameters estimated, typically 2)
  const df = Math.max(1, K - 3);
  const criticalValue = CHI_SQUARE_CRITICAL[df] || CHI_SQUARE_CRITICAL[20];
  
  // Validate minimum expected frequency
  const lowFreqClasses = classes.filter(c => c.expected < 5).length;
  if (lowFreqClasses > 0) {
    console.warn(`[Chi-Square] ${lowFreqClasses} kelas memiliki frekuensi harapan < 5. Hasil uji mungkin tidak reliabel.`);
  }
  
  return {
    isAccepted: chiSquare <= criticalValue,
    calculatedValue: parseFloat(chiSquare.toFixed(3)),
    criticalValue,
    degreesOfFreedom: df,
    details: {
      numClasses: K,
      classes
    }
  };
}

// ============================================================================
// SMIRNOV-KOLMOGOROV TEST
// ============================================================================

export interface KolmogorovSmirnovResult {
  isAccepted: boolean;
  deltaMax: number;
  deltaCritical: number;
  details: {
    dataPoints: Array<{
      value: number;
      empirical: number;
      theoretical: number;
      delta: number;
    }>;
  };
}

/**
 * Kolmogorov-Smirnov Goodness of Fit Test
 * 
 * Formula: Δmax = max|P(X) - P'(X)|
 * 
 * @param data - Historical data array
 * @param distributionType - Distribution to test
 * @returns Kolmogorov-Smirnov test result
 * 
 * @reference SNI 2415:2016 Lampiran D.2
 */
export function calculateKolmogorovSmirnovTest(data: number[], distributionType: string): KolmogorovSmirnovResult {
  const n = data.length;
  const stats = calculateStatistics(data);
  
  // Sort data in ascending order
  const sortedData = [...data].sort((a, b) => a - b);
  
  const dataPoints: Array<{ value: number; empirical: number; theoretical: number; delta: number }> = [];
  let deltaMax = 0;
  
  for (let i = 0; i < n; i++) {
    const x = sortedData[i];
    
    // Empirical probability: P(X) = m / (n + 1) (Weibull plotting position)
    const empirical = (i + 1) / (n + 1);
    
    // Theoretical probability from distribution CDF
    const theoretical = getTheoreticalCDF(x, distributionType, stats.mean, stats.stdDev);
    
    // Absolute difference
    const delta = Math.abs(empirical - theoretical);
    deltaMax = Math.max(deltaMax, delta);
    
    dataPoints.push({
      value: parseFloat(x.toFixed(2)),
      empirical: parseFloat(empirical.toFixed(4)),
      theoretical: parseFloat(theoretical.toFixed(4)),
      delta: parseFloat(delta.toFixed(4))
    });
  }
  
  const deltaCritical = getKolmogorovCritical(n);
  
  return {
    isAccepted: deltaMax <= deltaCritical,
    deltaMax: parseFloat(deltaMax.toFixed(4)),
    deltaCritical: parseFloat(deltaCritical.toFixed(4)),
    details: {
      dataPoints
    }
  };
}

// ============================================================================
// INTEGRATION WRAPPER
// ============================================================================

export interface GoodnessOfFitResult {
  isValid: boolean;
  chiSquare: ChiSquareResult;
  kolmogorovSmirnov: KolmogorovSmirnovResult;
  warnings: string[];
  recommendation: string;
}

/**
 * Validate Distribution Fit
 * 
 * Runs both Chi-Square and Kolmogorov-Smirnov tests
 * Distribution is accepted only if BOTH tests pass
 * 
 * @param data - Historical data array
 * @param distributionType - Distribution to validate
 * @returns Complete validation result
 * 
 * @example
 * ```typescript
 * const result = validateDistributionFit(rainfallData, 'gumbel');
 * if (result.isValid) {
 *   console.log('Distribution fits the data');
 * }
 * ```
 */
export function validateDistributionFit(data: number[], distributionType: string): GoodnessOfFitResult {
  const chiSquare = calculateChiSquareTest(data, distributionType);
  const kolmogorovSmirnov = calculateKolmogorovSmirnovTest(data, distributionType);
  
  const warnings: string[] = [];
  
  if (!chiSquare.isAccepted) {
    warnings.push(`Uji Chi-Square GAGAL: X²hitung (${chiSquare.calculatedValue}) > X²kritis (${chiSquare.criticalValue})`);
  }
  
  if (!kolmogorovSmirnov.isAccepted) {
    warnings.push(`Uji Kolmogorov-Smirnov GAGAL: Δmax (${kolmogorovSmirnov.deltaMax}) > Δkritis (${kolmogorovSmirnov.deltaCritical})`);
  }
  
  const isValid = chiSquare.isAccepted && kolmogorovSmirnov.isAccepted;
  
  let recommendation = '';
  if (isValid) {
    recommendation = `Distribusi ${distributionType.toUpperCase()} DITERIMA. Kedua uji kecocokan terpenuhi (α = 5%).`;
  } else if (chiSquare.isAccepted && !kolmogorovSmirnov.isAccepted) {
    recommendation = 'Distribusi DITOLAK. Pertimbangkan menggunakan distribusi lain atau tambah data historis.';
  } else if (!chiSquare.isAccepted && kolmogorovSmirnov.isAccepted) {
    recommendation = 'Distribusi DITOLAK. Chi-Square test gagal, coba distribusi dengan parameter berbeda.';
  } else {
    recommendation = 'Distribusi DITOLAK. Kedua uji kecocokan gagal. Gunakan distribusi alternatif.';
  }
  
  return {
    isValid,
    chiSquare,
    kolmogorovSmirnov,
    warnings,
    recommendation
  };
}
