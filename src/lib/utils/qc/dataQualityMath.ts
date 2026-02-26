/**
 * Quality Control Data Hujan - Production Grade
 * Mengikuti: SNI 2415:2016, WMO Guide No. 100
 * 
 * Uji yang diimplementasi:
 * 1. RAPS (Rescaled Adjusted Partial Sums) — Uji Konsistensi
 * 2. Smirnov-Grubbs — Uji Pencilan (Outlier)
 * 3. F-Test & t-Test — Uji Homogenitas
 * 
 * @module dataQualityMath
 * @version 2.0.0
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
  QHitung: number;
  RHitung: number;
  QKritis: number;
  RKritis: number;
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

// =============================================================
// HARDCODED STATISTICAL TABLES (Anti-Hallucination)
// Sumber: Buku Statistik Hidrologi (Soewarno, 1995)
// =============================================================

// Tabel Kritis Smirnov-Grubbs (α = 5%, two-sided)
const GRUBBS_TABLE: Record<number, number> = {
  10: 2.176, 11: 2.234, 12: 2.285, 13: 2.331, 14: 2.371,
  15: 2.409, 16: 2.443, 17: 2.475, 18: 2.504, 19: 2.532,
  20: 2.557, 21: 2.580, 22: 2.603, 23: 2.624, 24: 2.644,
  25: 2.663, 30: 2.745, 35: 2.811, 40: 2.866, 50: 2.956
};

// Tabel Q/√n dan R/√n untuk RAPS (α = 5%) — Buishand (1982)
const RAPS_Q_TABLE: Record<number, number> = {
  10: 1.05, 11: 1.10, 12: 1.14, 13: 1.18, 14: 1.21,
  15: 1.24, 16: 1.27, 17: 1.29, 18: 1.32, 19: 1.34,
  20: 1.36, 25: 1.46, 30: 1.54, 35: 1.60, 40: 1.65, 50: 1.75
};

const RAPS_R_TABLE: Record<number, number> = {
  10: 1.21, 11: 1.28, 12: 1.34, 13: 1.40, 14: 1.45,
  15: 1.50, 16: 1.55, 17: 1.59, 18: 1.64, 19: 1.68,
  20: 1.71, 25: 1.87, 30: 2.00, 35: 2.11, 40: 2.21, 50: 2.37
};

// Tabel F-kritis (α = 5%, df1 = df2 = n/2 - 1)
const F_TABLE: Record<number, number> = {
  4: 6.39, 5: 5.05, 6: 4.28, 7: 3.79, 8: 3.44,
  9: 3.18, 10: 2.98, 11: 2.82, 12: 2.69, 13: 2.58,
  14: 2.48, 15: 2.40, 16: 2.33, 17: 2.27, 18: 2.21,
  19: 2.16, 20: 2.12, 25: 1.96
};

// Tabel t-kritis (α = 5%, two-tailed)
const T_TABLE: Record<number, number> = {
  8: 2.306, 9: 2.262, 10: 2.228, 11: 2.201, 12: 2.179,
  13: 2.160, 14: 2.145, 15: 2.131, 16: 2.120, 17: 2.110,
  18: 2.101, 19: 2.093, 20: 2.086, 25: 2.060, 30: 2.042,
  40: 2.021, 50: 2.009
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

// =============================================================
// VALIDASI INPUT
// =============================================================
export function validateDataLength(data: RainfallData[]): void {
  if (!data || !Array.isArray(data)) {
    throw new QCValidationError('Data harus berupa array', 'INVALID_INPUT');
  }
  if (data.length < 10) {
    throw new QCValidationError(
      `Data terlalu pendek (Minimal 10 tahun, ditemukan ${data.length} tahun)`,
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

// =============================================================
// 1. UJI KONSISTENSI — RAPS (Rescaled Adjusted Partial Sums)
//    Referensi: Buishand (1982), SNI 2415:2016 Lampiran
//    
//    Prosedur:
//    - Data diurutkan kronologis (BUKAN berdasarkan magnitude)
//    - Hitung Sk* = ∑(Xi - X̄) / Dy  untuk k = 1..n  (cumulative deviations)
//    - Q = max|Sk*|
//    - R = max(Sk*) - min(Sk*)
//    - Bandingkan Q dan R dengan nilai kritis tabel
// =============================================================
export function cekKonsistensiRAPS(data: RainfallData[]): RAPSResult {
  try {
    validateDataLength(data);
  } catch (error) {
    if (error instanceof QCValidationError) {
      return { isKonsisten: false, QHitung: 0, RHitung: 0, QKritis: 0, RKritis: 0, pesan: `✗ ${error.message}` };
    }
    throw error;
  }
  
  const n = data.length;
  
  // KRITIS: Urutkan data secara KRONOLOGIS (bukan berdasarkan nilai)
  const sorted = [...data].sort((a, b) => a.tahun - b.tahun);
  const Xi = sorted.map(d => d.hujan);
  
  const mean = Xi.reduce((a, b) => a + b, 0) / n;
  const variance = Xi.reduce((sum, x) => sum + (x - mean) ** 2, 0) / n;
  const Dy = Math.sqrt(variance);
  
  if (Dy === 0 || !isFinite(Dy)) {
    return { isKonsisten: false, QHitung: 0, RHitung: 0, QKritis: 0, RKritis: 0, pesan: '✗ Standar deviasi nol (data konstan)' };
  }
  
  // Hitung Cumulative Deviations: Sk* = Σ(Xi - X̄) / Dy, k = 1..n
  const Sk: number[] = [];
  let cumSum = 0;
  for (let k = 0; k < n; k++) {
    cumSum += (Xi[k] - mean);
    Sk.push(cumSum / Dy);
  }
  
  // Statistik Q (max absolute) dan R (range)
  const QHitung = Math.max(...Sk.map(Math.abs));
  const RHitung = Math.max(...Sk) - Math.min(...Sk);
  
  // Nilai kritis dari tabel (sudah dinormalisasi √n)
  const QKritis = interpolate(RAPS_Q_TABLE, n) / Math.sqrt(n);
  const RKritis = interpolate(RAPS_R_TABLE, n) / Math.sqrt(n);
  
  const isKonsisten = QHitung <= QKritis && RHitung <= RKritis;
  
  return {
    isKonsisten,
    QHitung,
    RHitung,
    QKritis,
    RKritis,
    pesan: isKonsisten 
      ? `✓ Data konsisten (RAPS: Q=${QHitung.toFixed(3)} ≤ ${QKritis.toFixed(3)}, R=${RHitung.toFixed(3)} ≤ ${RKritis.toFixed(3)})` 
      : `✗ Data tidak konsisten: Q=${QHitung.toFixed(3)} ${QHitung <= QKritis ? '✓' : `> ${QKritis.toFixed(3)} ✗`}, R=${RHitung.toFixed(3)} ${RHitung <= RKritis ? '✓' : `> ${RKritis.toFixed(3)} ✗`}`
  };
}

// =============================================================
// 2. UJI PENCILAN — Smirnov-Grubbs Test
//    Referensi: WMO Guide No. 100, SNI 2415:2016
//    Xh = X̄ + Kn × S  (batas atas)
//    Xl = X̄ - Kn × S  (batas bawah)
// =============================================================
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
    pesan: isBebasOutlier 
      ? `✓ Tidak ada outlier (Grubbs: Kn=${Kn.toFixed(3)}, batas=[${lowerLimit.toFixed(1)}, ${upperLimit.toFixed(1)}])` 
      : `✗ Ditemukan ${outliers.length} outlier: ${outliers.map(o => `${o.tahun} (${o.hujan.toFixed(1)}mm, ${o.type})`).join(', ')}`
  };
}

// =============================================================
// 3. UJI HOMOGENITAS — F-Test (Varians) & t-Test (Rata-rata)
//    Referensi: SNI 6738:2015, Soewarno (1995)
//    Data dibagi 2 kelompok (paruh awal vs paruh akhir)
//    F = S1² / S2² dimana S1 > S2 (F hitung < F kritis → homogen)
//    t = |X̄1 - X̄2| / (Sp × √(1/n1 + 1/n2))
// =============================================================
export function cekHomogenitas(data: RainfallData[]): HomogenitasResult {
  try {
    validateDataLength(data);
  } catch (error) {
    if (error instanceof QCValidationError) {
      return { isHomogen: false, fTest: { F: 0, Fkritis: 0, lulus: false }, tTest: { t: 0, tkritis: 0, lulus: false }, pesan: `✗ ${error.message}` };
    }
    throw error;
  }
  
  // Urutkan kronologis untuk membagi paruh awal vs akhir
  const sorted = [...data].sort((a, b) => a.tahun - b.tahun);
  const n = sorted.length;
  const mid = Math.floor(n / 2);
  
  const seri1 = sorted.slice(0, mid).map(d => d.hujan);
  const seri2 = sorted.slice(mid).map(d => d.hujan);
  const n1 = seri1.length;
  const n2 = seri2.length;
  
  const mean1 = seri1.reduce((a, b) => a + b, 0) / n1;
  const mean2 = seri2.reduce((a, b) => a + b, 0) / n2;
  const var1 = seri1.reduce((sum, x) => sum + (x - mean1) ** 2, 0) / (n1 - 1);
  const var2 = seri2.reduce((sum, x) => sum + (x - mean2) ** 2, 0) / (n2 - 1);
  
  if (var1 === 0 || var2 === 0 || !isFinite(var1) || !isFinite(var2)) {
    return { isHomogen: true, fTest: { F: 1, Fkritis: 0, lulus: true }, tTest: { t: 0, tkritis: 0, lulus: true }, pesan: '⚠ Varians nol pada salah satu grup' };
  }
  
  // F-Test: selalu letakkan varians yang lebih besar di pembilang
  const F = Math.max(var1, var2) / Math.min(var1, var2);
  const dfF = Math.min(n1, n2) - 1;
  const Fkritis = interpolate(F_TABLE, dfF);
  const fTestLulus = F <= Fkritis;
  
  // t-Test: pooled variance
  const Sp = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n - 2));
  const t = Math.abs(mean1 - mean2) / (Sp * Math.sqrt(1 / n1 + 1 / n2));
  const dfT = n - 2;
  const tkritis = interpolate(T_TABLE, dfT);
  const tTestLulus = t <= tkritis;
  
  const isHomogen = fTestLulus && tTestLulus;
  
  return {
    isHomogen,
    fTest: { F, Fkritis, lulus: fTestLulus },
    tTest: { t, tkritis, lulus: tTestLulus },
    pesan: isHomogen 
      ? `✓ Data homogen (F=${F.toFixed(2)} ≤ ${Fkritis.toFixed(2)}, t=${t.toFixed(2)} ≤ ${tkritis.toFixed(2)})` 
      : `✗ Data tidak homogen: F=${F.toFixed(2)} ${fTestLulus ? '✓' : `> ${Fkritis.toFixed(2)} ✗`}, t=${t.toFixed(2)} ${tTestLulus ? '✓' : `> ${tkritis.toFixed(2)} ✗`}`
  };
}

// =============================================================
// RUNNER: Jalankan semua uji QC secara berurutan
// =============================================================
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
          raps: { isKonsisten: false, QHitung: 0, RHitung: 0, QKritis: 0, RKritis: 0, pesan: errorMsg },
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
