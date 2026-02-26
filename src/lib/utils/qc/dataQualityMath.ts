/**
 * Quality Control Data Hujan - Production Grade
 * Anti-Hallucination: Hardcoded Statistical Tables
 * @module dataQualityMath
 * @version 1.0.0
 * @standard SNI 2415:2016, SNI 6738:2015
 */

export interface RainfallData {
  tahun: number;
  hujan: number;
}

export class QCValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'QCValidationError';
  }
}

export interface QCResult {
  isKonsisten: boolean;
  isBebasOutlier: boolean;
  isHomogen: boolean;
  details: {
    raps: RAPSResult;
    grubbs: GrubbsResult;
    homogenitas: HomogenitasResult;
  };
}

interface RAPSResult {
  isKonsisten: boolean;
  Sk: number;
  Skk: number;
  QLimit: number;
  RLimit: number;
  pesan: string;
}

interface GrubbsResult {
  isBebasOutlier: boolean;
  mean: number;
  stdDev: number;
  upperLimit: number;
  lowerLimit: number;
  outliers: Array<{ tahun: number; hujan: number; type: 'HIGH' | 'LOW' }>;
  pesan: string;
}

interface HomogenitasResult {
  isHomogen: boolean;
  fTest: { F: number; Fkritis: number; lulus: boolean };
  tTest: { t: number; tkritis: number; lulus: boolean };
  pesan: string;
}

// HARDCODED: Tabel Kritis Smirnov-Grubbs (α = 5%)
const GRUBBS_TABLE: Record<number, number> = {
  10: 2.176, 11: 2.234, 12: 2.285, 13: 2.331, 14: 2.371,
  15: 2.409, 16: 2.443, 17: 2.475, 18: 2.504, 19: 2.532,
  20: 2.557, 21: 2.580, 22: 2.603, 23: 2.624, 24: 2.644,
  25: 2.663, 26: 2.681, 27: 2.698, 28: 2.714, 29: 2.730,
  30: 2.745, 31: 2.759, 32: 2.773, 33: 2.786, 34: 2.799,
  35: 2.811, 36: 2.823, 37: 2.835, 38: 2.846, 39: 2.857,
  40: 2.866, 41: 2.877, 42: 2.887, 43: 2.896, 44: 2.905,
  45: 2.914, 46: 2.922, 47: 2.931, 48: 2.939, 49: 2.947,
  50: 2.956
};

const RAPS_Q_TABLE: Record<number, number> = {
  10: 1.05, 11: 1.10, 12: 1.14, 13: 1.18, 14: 1.21,
  15: 1.24, 16: 1.27, 17: 1.29, 18: 1.32, 19: 1.34,
  20: 1.36, 21: 1.38, 22: 1.40, 23: 1.42, 24: 1.44,
  25: 1.46, 26: 1.48, 27: 1.49, 28: 1.51, 29: 1.52,
  30: 1.54, 31: 1.55, 32: 1.56, 33: 1.58, 34: 1.59,
  35: 1.60, 36: 1.61, 37: 1.62, 38: 1.63, 39: 1.64,
  40: 1.65, 41: 1.66, 42: 1.67, 43: 1.68, 44: 1.69,
  45: 1.70, 46: 1.71, 47: 1.72, 48: 1.73, 49: 1.74,
  50: 1.75
};

const RAPS_R_TABLE: Record<number, number> = {
  10: 1.21, 11: 1.28, 12: 1.34, 13: 1.40, 14: 1.45,
  15: 1.50, 16: 1.55, 17: 1.59, 18: 1.64, 19: 1.68,
  20: 1.71, 21: 1.75, 22: 1.78, 23: 1.81, 24: 1.84,
  25: 1.87, 26: 1.90, 27: 1.93, 28: 1.95, 29: 1.98,
  30: 2.00, 31: 2.03, 32: 2.05, 33: 2.07, 34: 2.09,
  35: 2.11, 36: 2.13, 37: 2.15, 38: 2.17, 39: 2.19,
  40: 2.21, 41: 2.23, 42: 2.24, 43: 2.26, 44: 2.28,
  45: 2.29, 46: 2.31, 47: 2.32, 48: 2.34, 49: 2.35,
  50: 2.37
};

const F_TABLE: Record<number, number> = {
  4: 6.39, 5: 5.05, 6: 4.28, 7: 3.79, 8: 3.44,
  9: 3.18, 10: 2.98, 11: 2.82, 12: 2.69, 13: 2.58,
  14: 2.48, 15: 2.40, 16: 2.33, 17: 2.27, 18: 2.21,
  19: 2.16, 20: 2.12, 21: 2.08, 22: 2.05, 23: 2.01,
  24: 1.98, 25: 1.96
};

const T_TABLE: Record<number, number> = {
  8: 2.306, 9: 2.262, 10: 2.228, 11: 2.201, 12: 2.179,
  13: 2.160, 14: 2.145, 15: 2.131, 16: 2.120, 17: 2.110,
  18: 2.101, 19: 2.093, 20: 2.086, 21: 2.080, 22: 2.074,
  23: 2.069, 24: 2.064, 25: 2.060, 26: 2.056, 27: 2.052,
  28: 2.048, 30: 2.042, 40: 2.021, 50: 2.009
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

export function validateDataLength(data: RainfallData[]): void {
  if (!data || !Array.isArray(data)) {
    throw new QCValidationError('Data harus berupa array', 'INVALID_INPUT');
  }
  if (data.length < 10) {
    throw new QCValidationError(
      `Data terlalu pendek untuk uji statistik yang valid (Minimal 10 tahun, ditemukan ${data.length} tahun)`,
      'INSUFFICIENT_DATA'
    );
  }
  if (data.length > 100) {
    throw new QCValidationError('Data terlalu panjang (Maksimal 100 tahun)', 'EXCESSIVE_DATA');
  }
  
  data.forEach((d, idx) => {
    if (typeof d.tahun !== 'number' || typeof d.hujan !== 'number') {
      throw new QCValidationError(`Data tidak valid pada index ${idx}`, 'INVALID_DATA_TYPE');
    }
    if (d.hujan < 0) {
      throw new QCValidationError(`Curah hujan negatif pada tahun ${d.tahun}`, 'NEGATIVE_RAINFALL');
    }
    if (!isFinite(d.hujan) || !isFinite(d.tahun)) {
      throw new QCValidationError(`Data tidak valid pada tahun ${d.tahun}`, 'NON_FINITE_VALUE');
    }
  });
  
  const years = data.map(d => d.tahun);
  const uniqueYears = new Set(years);
  if (years.length !== uniqueYears.size) {
    throw new QCValidationError('Ditemukan tahun duplikat', 'DUPLICATE_YEARS');
  }
}

export function cekKonsistensiRAPS(data: RainfallData[]): RAPSResult {
  try {
    validateDataLength(data);
  } catch (error) {
    if (error instanceof QCValidationError) {
      return { isKonsisten: false, Sk: 0, Skk: 0, QLimit: 0, RLimit: 0, pesan: `✗ ${error.message}` };
    }
    throw error;
  }
  
  const n = data.length;
  const sortedData = [...data].sort((a, b) => a.hujan - b.hujan);
  const hujan = sortedData.map(d => d.hujan);
  const mean = hujan.reduce((a, b) => a + b, 0) / n;
  
  let Sk = 0, Skk = 0;
  for (let i = 0; i < n; i++) {
    const diff = hujan[i] - mean;
    Sk += diff * (i + 1);
    Skk += diff * (i + 1) ** 2;
  }
  
  const variance = hujan.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0 || !isFinite(stdDev)) {
    return { isKonsisten: false, Sk: 0, Skk: 0, QLimit: 0, RLimit: 0, pesan: '✗ Standar deviasi nol (data konstan)' };
  }
  
  const SkStar = Sk / (n * stdDev);
  const SkStarStar = Skk / (n * stdDev);
  const Q = interpolate(RAPS_Q_TABLE, n);
  const R = interpolate(RAPS_R_TABLE, n);
  const QLimit = Q / Math.sqrt(n);
  const RLimit = R / Math.sqrt(n);
  const isKonsisten = Math.abs(SkStar) <= QLimit && Math.abs(SkStarStar) <= RLimit;
  
  return {
    isKonsisten,
    Sk: SkStar,
    Skk: SkStarStar,
    QLimit,
    RLimit,
    pesan: isKonsisten ? '✓ Data konsisten (RAPS Test)' : `✗ Data tidak konsisten: |Sk*|=${Math.abs(SkStar).toFixed(3)} > ${QLimit.toFixed(3)} atau |Sk**|=${Math.abs(SkStarStar).toFixed(3)} > ${RLimit.toFixed(3)}`
  };
}

export function cekOutlierGrubbs(data: RainfallData[]): GrubbsResult {
  try {
    validateDataLength(data);
  } catch (error) {
    if (error instanceof QCValidationError) {
      return { isBebasOutlier: false, mean: 0, stdDev: 0, upperLimit: 0, lowerLimit: 0, outliers: [], pesan: `✗ ${error.message}` };
    }
    throw error;
  }
  
  const n = data.length;
  const hujan = data.map(d => d.hujan);
  const mean = hujan.reduce((a, b) => a + b, 0) / n;
  const variance = hujan.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0 || !isFinite(stdDev)) {
    return { isBebasOutlier: true, mean, stdDev: 0, upperLimit: mean, lowerLimit: mean, outliers: [], pesan: '⚠ Standar deviasi nol (data identik)' };
  }
  
  const Kn = interpolate(GRUBBS_TABLE, n);
  const upperLimit = mean + Kn * stdDev;
  const lowerLimit = mean - Kn * stdDev;
  const outliers: Array<{ tahun: number; hujan: number; type: 'HIGH' | 'LOW' }> = [];
  
  data.forEach(d => {
    if (d.hujan > upperLimit) outliers.push({ tahun: d.tahun, hujan: d.hujan, type: 'HIGH' });
    else if (d.hujan < lowerLimit) outliers.push({ tahun: d.tahun, hujan: d.hujan, type: 'LOW' });
  });
  
  const isBebasOutlier = outliers.length === 0;
  
  return {
    isBebasOutlier,
    mean,
    stdDev,
    upperLimit,
    lowerLimit,
    outliers,
    pesan: isBebasOutlier ? '✓ Tidak ada outlier (Grubbs Test)' : `✗ Ditemukan ${outliers.length} outlier: ${outliers.map(o => `${o.tahun} (${o.hujan.toFixed(1)}mm)`).join(', ')}`
  };
}

export function cekHomogenitas(data: RainfallData[]): HomogenitasResult {
  try {
    validateDataLength(data);
  } catch (error) {
    if (error instanceof QCValidationError) {
      return { isHomogen: false, fTest: { F: 0, Fkritis: 0, lulus: false }, tTest: { t: 0, tkritis: 0, lulus: false }, pesan: `✗ ${error.message}` };
    }
    throw error;
  }
  
  const n = data.length;
  const mid = Math.floor(n / 2);
  const seri1 = data.slice(0, mid).map(d => d.hujan);
  const seri2 = data.slice(mid).map(d => d.hujan);
  const mean1 = seri1.reduce((a, b) => a + b, 0) / seri1.length;
  const mean2 = seri2.reduce((a, b) => a + b, 0) / seri2.length;
  const var1 = seri1.reduce((sum, x) => sum + (x - mean1) ** 2, 0) / (seri1.length - 1);
  const var2 = seri2.reduce((sum, x) => sum + (x - mean2) ** 2, 0) / (seri2.length - 1);
  
  if (var1 === 0 || var2 === 0 || !isFinite(var1) || !isFinite(var2)) {
    return { isHomogen: true, fTest: { F: 1, Fkritis: 0, lulus: true }, tTest: { t: 0, tkritis: 0, lulus: true }, pesan: '⚠ Varians nol (data konstan)' };
  }
  
  const F = Math.max(var1, var2) / Math.min(var1, var2);
  const df = mid - 1;
  const Fkritis = interpolate(F_TABLE, df);
  const fTestLulus = F <= Fkritis;
  
  const Sp = Math.sqrt(((seri1.length - 1) * var1 + (seri2.length - 1) * var2) / (n - 2));
  const t = Math.abs(mean1 - mean2) / (Sp * Math.sqrt(1 / seri1.length + 1 / seri2.length));
  const dfT = n - 2;
  const tkritis = interpolate(T_TABLE, dfT);
  const tTestLulus = t <= tkritis;
  const isHomogen = fTestLulus && tTestLulus;
  
  return {
    isHomogen,
    fTest: { F, Fkritis, lulus: fTestLulus },
    tTest: { t, tkritis, lulus: tTestLulus },
    pesan: isHomogen ? '✓ Data homogen (F-Test & t-Test)' : `✗ Data tidak homogen: F=${F.toFixed(2)} ${fTestLulus ? '✓' : `> ${Fkritis.toFixed(2)} ✗`}, t=${t.toFixed(2)} ${tTestLulus ? '✓' : `> ${tkritis.toFixed(2)} ✗`}`
  };
}

export function runFullQC(data: RainfallData[]): QCResult {
  try {
    validateDataLength(data);
  } catch (error) {
    if (error instanceof QCValidationError) {
      const errorMsg = `✗ ${error.message}`;
      return {
        isKonsisten: false,
        isBebasOutlier: false,
        isHomogen: false,
        details: {
          raps: { isKonsisten: false, Sk: 0, Skk: 0, QLimit: 0, RLimit: 0, pesan: errorMsg },
          grubbs: { isBebasOutlier: false, mean: 0, stdDev: 0, upperLimit: 0, lowerLimit: 0, outliers: [], pesan: errorMsg },
          homogenitas: { isHomogen: false, fTest: { F: 0, Fkritis: 0, lulus: false }, tTest: { t: 0, tkritis: 0, lulus: false }, pesan: errorMsg }
        }
      };
    }
    throw error;
  }
  
  const raps = cekKonsistensiRAPS(data);
  const grubbs = cekOutlierGrubbs(data);
  const homogenitas = cekHomogenitas(data);
  
  return {
    isKonsisten: raps.isKonsisten,
    isBebasOutlier: grubbs.isBebasOutlier,
    isHomogen: homogenitas.isHomogen,
    details: { raps, grubbs, homogenitas }
  };
}

export function getQCSummary(result: QCResult): string {
  const { isKonsisten, isBebasOutlier, isHomogen } = result;
  const passed = [isKonsisten, isBebasOutlier, isHomogen].filter(Boolean).length;
  return `QC: ${passed}/3 passed | Konsisten: ${isKonsisten ? '✓' : '✗'} | Outlier: ${isBebasOutlier ? '✓' : '✗'} | Homogen: ${isHomogen ? '✓' : '✗'}`;
}
