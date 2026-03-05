/**
 * Frequency Analysis Math - Production Grade
 * Anti-Hallucination: Hardcoded Statistical Tables
 * @standard SNI 2415:2016
 */

export interface StatisticalParams {
  mean: number;
  stdDev: number;
  cv: number;
  cs: number;
  ck: number;
}

export interface DesignRainfallValue {
  Tr: number;
  R24: number;
  kalaUlang: number;
  curahHujan: number;
}

export interface DistributionResult {
  method: 'normal' | 'lognormal' | 'gumbel' | 'logpearson3';
  values: DesignRainfallValue[];
}

export interface GoodnessOfFitResult {
  method: string;
  chiSquare: { statistic: number; critical: number; accepted: boolean };
  kolmogorovSmirnov: { statistic: number; critical: number; accepted: boolean };
}

// HARDCODED: Gumbel Yn and Sn (n = 10-100)
const GUMBEL_YN: Record<number, number> = {
  10: 0.4952, 15: 0.5128, 20: 0.5236, 25: 0.5309, 30: 0.5362,
  35: 0.5403, 40: 0.5436, 45: 0.5463, 50: 0.5485, 55: 0.5504,
  60: 0.5521, 65: 0.5535, 70: 0.5548, 75: 0.5559, 80: 0.5569,
  85: 0.5578, 90: 0.5586, 95: 0.5593, 100: 0.5600
};

const GUMBEL_SN: Record<number, number> = {
  10: 0.9496, 15: 1.0206, 20: 1.0628, 25: 1.0914, 30: 1.1124,
  35: 1.1285, 40: 1.1413, 45: 1.1519, 50: 1.1607, 55: 1.1681,
  60: 1.1747, 65: 1.1803, 70: 1.1854, 75: 1.1898, 80: 1.1938,
  85: 1.1973, 90: 1.2007, 95: 1.2037, 100: 1.2065
};

// HARDCODED: Gumbel YTr for return periods
const GUMBEL_YTR: Record<number, number> = {
  2: 0.3665, 5: 1.4999, 10: 2.2504, 25: 3.1985,
  50: 3.9019, 100: 4.6001, 200: 5.2958
};

// HARDCODED: Log Pearson III K values (Cs vs Tr)
const LOG_PEARSON_K: Record<string, Record<number, number>> = {
  '0.0': { 2: 0.000, 5: 0.842, 10: 1.282, 25: 1.751, 50: 2.054, 100: 2.326 },
  '0.5': { 2: -0.164, 5: 0.518, 10: 0.994, 25: 1.555, 50: 1.926, 100: 2.278 },
  '1.0': { 2: -0.307, 5: 0.231, 10: 0.758, 25: 1.366, 50: 1.777, 100: 2.178 },
  '1.5': { 2: -0.436, 5: -0.015, 10: 0.557, 25: 1.200, 50: 1.643, 100: 2.088 },
  '2.0': { 2: -0.555, 5: -0.226, 10: 0.390, 25: 1.055, 50: 1.524, 100: 2.000 },
  '2.5': { 2: -0.667, 5: -0.407, 10: 0.247, 25: 0.927, 50: 1.418, 100: 1.916 },
  '3.0': { 2: -0.775, 5: -0.565, 10: 0.124, 25: 0.815, 50: 1.323, 100: 1.837 },
  '-0.5': { 2: 0.164, 5: 1.128, 10: 1.528, 25: 1.939, 50: 2.178, 100: 2.400 },
  '-1.0': { 2: 0.307, 5: 1.372, 10: 1.745, 25: 2.114, 50: 2.290, 100: 2.453 },
};

// HARDCODED: Kolmogorov-Smirnov critical values (α = 5%)
const KS_CRITICAL: Record<number, number> = {
  10: 0.409, 15: 0.338, 20: 0.294, 25: 0.264, 30: 0.242,
  35: 0.224, 40: 0.210, 45: 0.198, 50: 0.188, 60: 0.172,
  70: 0.160, 80: 0.150, 90: 0.141, 100: 0.134
};

// HARDCODED: Chi-Square critical values (α = 5%, df = k-3)
const CHI_SQUARE_CRITICAL: Record<number, number> = {
  1: 3.841, 2: 5.991, 3: 7.815, 4: 9.488, 5: 11.070,
  6: 12.592, 7: 14.067, 8: 15.507, 9: 16.919, 10: 18.307
};

// HARDCODED: Normal distribution Z values
const NORMAL_Z: Record<number, number> = {
  2: 0.000, 5: 0.842, 10: 1.282, 25: 1.751, 50: 2.054, 100: 2.326
};

function interpolate(table: Record<number, number>, n: number): number {
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (n <= keys[0]) return table[keys[0]];
  if (n >= keys[keys.length - 1]) return table[keys[keys.length - 1]];
  for (let i = 0; i < keys.length - 1; i++) {
    if (n >= keys[i] && n <= keys[i + 1]) {
      const x1 = keys[i], x2 = keys[i + 1];
      const y1 = table[x1], y2 = table[x2];
      return y1 + ((y2 - y1) / (x2 - x1)) * (n - x1);
    }
  }
  return table[keys[keys.length - 1]];
}

function interpolateLogPearsonK(cs: number, tr: number): number {
  const csKeys = Object.keys(LOG_PEARSON_K).map(Number).sort((a, b) => a - b);
  let cs1 = csKeys[0], cs2 = csKeys[0];
  for (let i = 0; i < csKeys.length - 1; i++) {
    if (cs >= csKeys[i] && cs <= csKeys[i + 1]) {
      cs1 = csKeys[i]; cs2 = csKeys[i + 1];
      break;
    }
  }
  const k1 = LOG_PEARSON_K[cs1.toFixed(1)][tr];
  const k2 = LOG_PEARSON_K[cs2.toFixed(1)][tr];
  if (cs1 === cs2) return k1;
  return k1 + ((k2 - k1) / (cs2 - cs1)) * (cs - cs1);
}

export function calculateStatisticalParams(data: number[]): StatisticalParams {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  const m3 = data.reduce((sum, x) => sum + Math.pow(x - mean, 3), 0) / n;
  const cs = (n * m3) / ((n - 1) * (n - 2) * Math.pow(stdDev, 3));
  const m4 = data.reduce((sum, x) => sum + Math.pow(x - mean, 4), 0) / n;
  const ck = (n * (n + 1) * m4) / ((n - 1) * (n - 2) * (n - 3) * Math.pow(stdDev, 4)) - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  return { mean, stdDev, cv, cs, ck };
}

export function calculateDistributions(
  params: StatisticalParams,
  paramsLog: StatisticalParams,
  n: number,
  returnPeriods: number[] = [2, 5, 10, 25, 50, 100]
): DistributionResult[] {
  const mapVal = (tr: number, val: number) => ({ Tr: tr, R24: val, kalaUlang: tr, curahHujan: val });
  return [
    { method: 'normal', values: returnPeriods.map(tr => mapVal(tr, params.mean + NORMAL_Z[tr] * params.stdDev)) },
    { method: 'lognormal', values: returnPeriods.map(tr => mapVal(tr, Math.exp(paramsLog.mean + NORMAL_Z[tr] * paramsLog.stdDev))) },
    { method: 'gumbel', values: returnPeriods.map(tr => mapVal(tr, params.mean + ((GUMBEL_YTR[tr] - interpolate(GUMBEL_YN, n)) / interpolate(GUMBEL_SN, n)) * params.stdDev)) },
    { method: 'logpearson3', values: returnPeriods.map(tr => mapVal(tr, Math.exp(paramsLog.mean + interpolateLogPearsonK(paramsLog.cs, tr) * paramsLog.stdDev))) }
  ];
}

function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

function gumbelCDF(x: number, mean: number, stdDev: number): number {
  const alpha = Math.sqrt(6) / Math.PI / stdDev;
  const u = mean - 0.5772 / alpha;
  return Math.exp(-Math.exp(-alpha * (x - u)));
}

export function calculateGoodnessOfFit(data: number[], distributions: DistributionResult[]): GoodnessOfFitResult[] {
  const n = data.length;
  const ksCritical = interpolate(KS_CRITICAL, n);
  const sortedData = [...data].sort((a, b) => a - b);
  return distributions.map(dist => {
    let ksMax = 0;
    const params = calculateStatisticalParams(data);
    const paramsLog = calculateStatisticalParams(data.map(x => Math.log(Math.max(x, 1e-10))));
    
    sortedData.forEach((x, i) => {
      const empiricalProb = (i + 1) / (n + 1);
      let theoreticalProb = 0;
      if (dist.method === 'normal') theoreticalProb = normalCDF((x - params.mean) / params.stdDev);
      else if (dist.method === 'gumbel') theoreticalProb = gumbelCDF(x, params.mean, params.stdDev);
      else if (dist.method === 'lognormal') theoreticalProb = normalCDF((Math.log(Math.max(x, 1e-10)) - paramsLog.mean) / paramsLog.stdDev);
      else if (dist.method === 'logpearson3') theoreticalProb = normalCDF((Math.log(Math.max(x, 1e-10)) - paramsLog.mean) / paramsLog.stdDev);
      ksMax = Math.max(ksMax, Math.abs(empiricalProb - theoreticalProb));
    });
    const k_val = n <= 20 ? 4 : n <= 50 ? 6 : 8;
    const df = k_val - 3;
    const chiCritical = CHI_SQUARE_CRITICAL[df] || 7.815;
    const expected = n / k_val;
    let chiSquare = 0;
    for (let i = 0; i < k_val; i++) {
      const startIdx = Math.floor(i * expected);
      const endIdx = Math.floor((i + 1) * expected);
      const observed = endIdx - startIdx;
      if (expected > 0) chiSquare += Math.pow(observed - expected, 2) / expected;
    }
    return {
      method: dist.method,
      chiSquare: { statistic: chiSquare, critical: chiCritical, accepted: chiSquare <= chiCritical },
      kolmogorovSmirnov: { statistic: ksMax, critical: ksCritical, accepted: ksMax <= ksCritical }
    };
  });
}

export function selectBestMethod(goodnessOfFit: GoodnessOfFitResult[]): string {
  const passed = goodnessOfFit.filter(gof => gof.chiSquare.accepted && gof.kolmogorovSmirnov.accepted);
  
  // Priority: LP3 > Gumbel > LogNormal > Normal
  const priority = ['logpearson3', 'gumbel', 'lognormal', 'normal'];
  
  if (passed.length > 0) {
    // Return the highest priority method that passed
    for (const method of priority) {
      if (passed.find(p => p.method === method)) return method;
    }
    return passed[0].method;
  }
  
  // If none passed, return the one with minimum deviation
  return goodnessOfFit.reduce((best, current) => {
    const bestScore = best.chiSquare.statistic + best.kolmogorovSmirnov.statistic;
    const currentScore = current.chiSquare.statistic + current.kolmogorovSmirnov.statistic;
    return currentScore < bestScore ? current : best;
  }).method;
}
