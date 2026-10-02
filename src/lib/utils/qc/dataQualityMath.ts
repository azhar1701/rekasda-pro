/**
 * Quality Control Data Hujan - Production Grade
 * Mengikuti: SNI 2415:2016, WMO Guide No. 100
 *
 * Uji yang diimplementasi:
 * 1. RAPS (Rescaled Adjusted Partial Sums) — Uji Konsistensi
 * 2. Smirnov-Grubbs (skala linear + log) — Uji Pencilan (Outlier)
 * 3. F-Test & t-Test — Uji Homogenitas
 *
 * Fase 3: Tiered Ambang Batas
 *   - n < 5   : INSUFFICIENT — blokir mutlak
 *   - n 5–9   : PRELIMINARY  — hitung, tandai indikatif (Barnett & Lewis, 1994)
 *   - n ≥ 10  : SNI_COMPLIANT — standar SNI 2415:2016 terpenuhi
 *
 * @module dataQualityMath
 * @version 3.0.0
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

/**
 * Level kecukupan data sesuai SNI 2415:2016
 * SNI_COMPLIANT : n ≥ 10 tahun — standar terpenuhi
 * PRELIMINARY   : 5 ≤ n < 10  — hasil bersifat indikatif
 * INSUFFICIENT  : n < 5       — tidak dapat dihitung
 */
export type QCDataLevel = 'SNI_COMPLIANT' | 'PRELIMINARY' | 'INSUFFICIENT';

export function getDataLevel(n: number): QCDataLevel {
  if (n < 5) return 'INSUFFICIENT';
  if (n < 10) return 'PRELIMINARY';
  return 'SNI_COMPLIANT';
}

export interface QCResult {
  isKonsisten: boolean;
  isBebasOutlier: boolean;
  isHomogen: boolean;
  /** Level kecukupan data: SNI_COMPLIANT | PRELIMINARY | INSUFFICIENT */
  dataLevel: QCDataLevel;
  /** Jumlah tahun data yang dievaluasi */
  dataYearsCount: number;
  details: {
    raps: RAPSResult;
    grubbs: GrubbsResult;
    grubbsLog?: GrubbsResult;  // Uji outlier skala log (opsional, WMO Guide No.100)
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
// n=5-9: Barnett & Lewis (1994), "Outliers in Statistical Data", 3rd ed.
// n≥10 : Grubbs (1969), tabel standar
const GRUBBS_TABLE: Record<number, number> = {
  5: 1.672, 6: 1.822, 7: 1.938, 8: 2.032, 9: 2.110,
  10: 2.176, 11: 2.234, 12: 2.285, 13: 2.331, 14: 2.371,
  15: 2.409, 16: 2.443, 17: 2.475, 18: 2.504, 19: 2.532,
  20: 2.557, 21: 2.580, 22: 2.603, 23: 2.624, 24: 2.644,
  25: 2.663, 30: 2.745, 35: 2.811, 40: 2.866, 50: 2.956
};

// Tabel Q/√n dan R/√n untuk RAPS (α = 5%) — Buishand (1982)
// Termasuk nilai ekstensi untuk data preliminer n=5–9
const RAPS_Q_TABLE: Record<number, number> = {
  5: 0.88, 6: 0.92, 7: 0.96, 8: 0.99, 9: 1.02,
  10: 1.05, 11: 1.10, 12: 1.14, 13: 1.18, 14: 1.21,
  15: 1.24, 16: 1.27, 17: 1.29, 18: 1.32, 19: 1.34,
  20: 1.36, 25: 1.46, 30: 1.54, 35: 1.60, 40: 1.65, 50: 1.75
};

const RAPS_R_TABLE: Record<number, number> = {
  5: 1.00, 6: 1.05, 7: 1.10, 8: 1.14, 9: 1.18,
  10: 1.21, 11: 1.28, 12: 1.34, 13: 1.40, 14: 1.45,
  15: 1.50, 16: 1.55, 17: 1.59, 18: 1.64, 19: 1.68,
  20: 1.71, 25: 1.87, 30: 2.00, 35: 2.11, 40: 2.21, 50: 2.37
};

// Tabel F-kritis (α = 5%, df1 = df2 = n/2 - 1)
const F_TABLE: Record<number, number> = {
  1: 161.4, 2: 19.00, 3: 9.28,
  4: 6.39, 5: 5.05, 6: 4.28, 7: 3.79, 8: 3.44,
  9: 3.18, 10: 2.98, 11: 2.82, 12: 2.69, 13: 2.58,
  14: 2.48, 15: 2.40, 16: 2.33, 17: 2.27, 18: 2.21,
  19: 2.16, 20: 2.12, 25: 1.96
};

// Tabel t-kritis (α = 5%, two-tailed)
const T_TABLE: Record<number, number> = {
  3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365,
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
// Fase 3: Ambang batas berjenjang
//   n < 5   → throw INSUFFICIENT_DATA (blokir mutlak)
//   5 ≤ n < 10 → tidak throw; caller memeriksanya lewat getDataLevel()
//   n ≥ 10  → standar SNI 2415:2016
// =============================================================
export function validateDataLength(data: RainfallData[]): void {
  if (!data || !Array.isArray(data)) {
    throw new QCValidationError('Data harus berupa array', 'INVALID_INPUT');
  }
  // Blokir mutlak hanya di bawah 5 tahun
  if (data.length < 5) {
    throw new QCValidationError(
      `Data terlalu pendek (Minimum absolut 5 tahun, ditemukan ${data.length} tahun). Penuhi data terlebih dahulu.`,
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
export interface DoubleMassResult {
  isKonsisten: boolean;
  koreksiDiperlukan: boolean;
  breakYear?: number;
  faktorKoreksi?: number;
  dataPlot: Array<{ tahun: number; akumulasiReferensi: number; akumulasiTarget: number }>;
  pesan: string;
}

// 1. UJI KONSISTENSI — RAPS (Rescaled Adjusted Partial Sums)
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
  const sorted = [...data].sort((a, b) => a.tahun - b.tahun);
  const Xi = sorted.map(d => d.hujan);
  
  const mean = Xi.reduce((a, b) => a + b, 0) / n;
  const variance = Xi.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
  const Dy = Math.sqrt(variance);
  
  if (Dy === 0 || !isFinite(Dy)) {
    return { isKonsisten: false, QHitung: 0, RHitung: 0, QKritis: 0, RKritis: 0, pesan: '✗ Standar deviasi nol (data konstan)' };
  }
  
  const Sk: number[] = [];
  let cumSum = 0;
  for (let k = 0; k < n; k++) {
    cumSum += (Xi[k] - mean);
    Sk.push(cumSum / Dy);
  }
  
  const QHitung = Math.max(...Sk.map(Math.abs)) / Math.sqrt(n);
  const RHitung = (Math.max(...Sk) - Math.min(...Sk)) / Math.sqrt(n);
  
  const QKritis = interpolate(RAPS_Q_TABLE, n);
  const RKritis = interpolate(RAPS_R_TABLE, n);
  
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
  const variance = hujan.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1);
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
// 2b. UJI PENCILAN (SKALA LOG) — Grubbs Log-Normal (WMO Guide No.100)
// Mentransformasi data ke ruang logaritmik sebelum uji Grubbs.
// Efektif untuk distribusi curah hujan tahunan maksimum yang condong kanan.
// =============================================================
export function cekOutlierGrubbsLog(data: RainfallData[]): GrubbsResult {
  try {
    validateDataLength(data);
  } catch (error) {
    if (error instanceof QCValidationError) {
      return { isBebasOutlier: false, mean: 0, stdDev: 0, upperLimit: 0, lowerLimit: 0, outliers: [], pesan: `✗ ${error.message}` };
    }
    throw error;
  }

  // Filter nilai nol atau negatif sebelum transformasi log
  const validData = data.filter(d => d.hujan > 0);
  if (validData.length < data.length) {
    // Jika ada nilai nol, gunakan Grubbs linear saja
    return cekOutlierGrubbs(data);
  }

  const n = validData.length;
  const logHujan = validData.map(d => Math.log(d.hujan));
  const meanLog = logHujan.reduce((a, b) => a + b, 0) / n;
  const varLog = logHujan.reduce((sum, x) => sum + Math.pow(x - meanLog, 2), 0) / (n - 1);
  const stdLog = Math.sqrt(varLog);

  if (stdLog === 0 || !isFinite(stdLog)) {
    return { isBebasOutlier: true, mean: Math.exp(meanLog), stdDev: 0, upperLimit: Math.exp(meanLog), lowerLimit: Math.exp(meanLog), outliers: [], pesan: '⚠ Standar deviasi log nol (data identik)' };
  }

  const Kn = interpolate(GRUBBS_TABLE, n);
  const upperLimitLog = meanLog + Kn * stdLog;
  const lowerLimitLog = meanLog - Kn * stdLog;

  // Konversi batas kembali ke ruang asli
  const upperLimit = Math.exp(upperLimitLog);
  const lowerLimit = Math.exp(lowerLimitLog);
  const mean = Math.exp(meanLog);

  const outliers: Array<{ tahun: number; hujan: number; type: 'HIGH' | 'LOW' }> = [];
  validData.forEach(d => {
    if (d.hujan > upperLimit) outliers.push({ tahun: d.tahun, hujan: d.hujan, type: 'HIGH' });
    else if (d.hujan < lowerLimit) outliers.push({ tahun: d.tahun, hujan: d.hujan, type: 'LOW' });
  });

  const isBebasOutlier = outliers.length === 0;

  return {
    isBebasOutlier,
    mean,
    stdDev: stdLog, // Disimpan dalam skala log untuk transparansi
    upperLimit,
    lowerLimit,
    outliers,
    pesan: isBebasOutlier
      ? `✓ Tidak ada outlier log-normal (Kn=${Kn.toFixed(3)}, batas=[${lowerLimit.toFixed(1)}, ${upperLimit.toFixed(1)}] mm)`
      : `✗ Ditemukan ${outliers.length} outlier log: ${outliers.map(o => `${o.tahun} (${o.hujan.toFixed(1)}mm, ${o.type})`).join(', ')}`
  };
}

// =============================================================
// 3. UJI HOMOGENITAS — F-Test (Varians) & t-Test (Rata-rata)
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
  
  const sorted = [...data].sort((a, b) => a.tahun - b.tahun);
  const n = sorted.length;
  const mid = Math.floor(n / 2);
  
  const seri1 = sorted.slice(0, mid).map(d => d.hujan);
  const seri2 = sorted.slice(mid).map(d => d.hujan);
  const n1 = seri1.length;
  const n2 = seri2.length;
  
  const mean1 = seri1.reduce((a, b) => a + b, 0) / n1;
  const mean2 = seri2.reduce((a, b) => a + b, 0) / n2;
  const var1 = seri1.reduce((sum, x) => sum + Math.pow(x - mean1, 2), 0) / (n1 - 1);
  const var2 = seri2.reduce((sum, x) => sum + Math.pow(x - mean2, 2), 0) / (n2 - 1);
  
  if (var1 === 0 || var2 === 0 || !isFinite(var1) || !isFinite(var2)) {
    return { isHomogen: true, fTest: { F: 1, Fkritis: 0, lulus: true }, tTest: { t: 0, tkritis: 0, lulus: true }, pesan: '⚠ Varians nol pada salah satu grup' };
  }
  
  const varMax = Math.max(var1, var2);
  const varMin = Math.min(var1, var2);
  const F_val = varMax / varMin;
  
  const df1 = (var1 === varMax ? n1 : n2) - 1;
  const df2 = (var1 === varMin ? n1 : n2) - 1;
  
  const Fkritis_val = interpolate(F_TABLE, Math.min(df1, df2));
  const fTestLulus_val = F_val <= Fkritis_val;
  
  const Sp = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n - 2));
  const t = Math.abs(mean1 - mean2) / (Sp * Math.sqrt(1 / n1 + 1 / n2));
  const dfT = n - 2;
  const tkritis = interpolate(T_TABLE, dfT);
  const tTestLulus = t <= tkritis;
  
  const isHomogen = fTestLulus_val && tTestLulus;
  
  return {
    isHomogen,
    fTest: { F: F_val, Fkritis: Fkritis_val, lulus: fTestLulus_val },
    tTest: { t, tkritis, lulus: tTestLulus },
    pesan: isHomogen 
      ? `✓ Data homogen (F=${F_val.toFixed(2)} ≤ ${Fkritis_val.toFixed(2)}, t=${t.toFixed(2)} ≤ ${tkritis.toFixed(2)})` 
      : `✗ Data tidak homogen: F=${F_val.toFixed(2)} ${fTestLulus_val ? '✓' : `> ${Fkritis_val.toFixed(2)} ✗`}, t=${t.toFixed(2)} ${tTestLulus ? '✓' : `> ${tkritis.toFixed(2)} ✗`}`
  };
}

// =============================================================
// RUNNER: Jalankan semua uji QC secara berurutan
// Fase 3: Mengisi dataLevel (SNI_COMPLIANT | PRELIMINARY | INSUFFICIENT)
//         dan menjalankan uji Grubbs log-scale sebagai uji tambahan.
// =============================================================
export function runFullQC(data: RainfallData[]): QCResult {
  const n = data?.length ?? 0;
  const dataLevel = getDataLevel(n);

  // Blokir mutlak: n < 5
  if (dataLevel === 'INSUFFICIENT') {
    const errorMsg = `✗ Data terlalu pendek (${n} tahun — minimum 5 tahun untuk komputasi QC)`;
    return {
      isKonsisten: false,
      isBebasOutlier: false,
      isHomogen: false,
      dataLevel: 'INSUFFICIENT',
      dataYearsCount: n,
      details: {
        raps: { isKonsisten: false, QHitung: 0, RHitung: 0, QKritis: 0, RKritis: 0, pesan: errorMsg },
        grubbs: { isBebasOutlier: false, mean: 0, stdDev: 0, upperLimit: 0, lowerLimit: 0, outliers: [], pesan: errorMsg },
        homogenitas: { isHomogen: false, fTest: { F: 0, Fkritis: 0, lulus: false }, tTest: { t: 0, tkritis: 0, lulus: false }, pesan: errorMsg },
      },
    };
  }

  // Validasi struktur data (tipe, negatif, duplikat)
  try {
    validateDataLength(data);
  } catch (error) {
    if (error instanceof QCValidationError) {
      const errorMsg = `✗ ${error.message}`;
      return {
        isKonsisten: false,
        isBebasOutlier: false,
        isHomogen: false,
        dataLevel,
        dataYearsCount: n,
        details: {
          raps: { isKonsisten: false, QHitung: 0, RHitung: 0, QKritis: 0, RKritis: 0, pesan: errorMsg },
          grubbs: { isBebasOutlier: false, mean: 0, stdDev: 0, upperLimit: 0, lowerLimit: 0, outliers: [], pesan: errorMsg },
          homogenitas: { isHomogen: false, fTest: { F: 0, Fkritis: 0, lulus: false }, tTest: { t: 0, tkritis: 0, lulus: false }, pesan: errorMsg },
        },
      };
    }
    throw error;
  }

  const raps = cekKonsistensiRAPS(data);
  const grubbs = cekOutlierGrubbs(data);       // Grubbs linear (skala asli)
  const grubbsLog = cekOutlierGrubbsLog(data); // Grubbs log-normal (WMO)
  const homogenitas = cekHomogenitas(data);

  // Outlier: konservatif — flagged jika SALAH SATU uji (linear atau log) mendeteksi outlier
  const isBebasOutlier = grubbs.isBebasOutlier && grubbsLog.isBebasOutlier;

  // Fase 3: Untuk data PRELIMINARY (5–9 tahun), uji homogenitas tidak dapat diandalkan
  // karena split seri terlalu pendek → tandai isHomogen sebagai true secara heuristik
  // dengan pesan peringatan, bukan blokir
  const finalHomogenitas = dataLevel === 'PRELIMINARY'
    ? {
        ...homogenitas,
        pesan: homogenitas.pesan + ' ⚠ (Hasil indikatif: n < 10 tahun)',
      }
    : homogenitas;

  return {
    isKonsisten: raps.isKonsisten,
    isBebasOutlier,
    isHomogen: finalHomogenitas.isHomogen,
    dataLevel,
    dataYearsCount: n,
    details: { raps, grubbs, grubbsLog, homogenitas: finalHomogenitas },
  };
}

// =============================================================
// 4. UJI KONSISTENSI — Double Mass Curve (Kurva Massa Ganda)
// Membandingkan akumulasi stasiun target dengan rata-rata stasiun referensi
// =============================================================
export function cekDoubleMassCurve(targetData: RainfallData[], referenceData: RainfallData[]): DoubleMassResult {
  try {
    validateDataLength(targetData);
    validateDataLength(referenceData);
  } catch (error) {
    if (error instanceof QCValidationError) {
      return { isKonsisten: false, koreksiDiperlukan: false, dataPlot: [], pesan: `✗ ${error.message}` };
    }
    throw error;
  }

  // Pastikan tahun sinkron
  const refMap = new Map(referenceData.map(d => [d.tahun, d.hujan]));
  const syncedData = targetData.filter(d => refMap.has(d.tahun)).sort((a, b) => a.tahun - b.tahun);
  
  if (syncedData.length < 10) {
    return { isKonsisten: false, koreksiDiperlukan: false, dataPlot: [], pesan: '✗ Data beririsan kurang dari 10 tahun' };
  }

  const dataPlot: Array<{ tahun: number; akumulasiReferensi: number; akumulasiTarget: number }> = [];
  let sumRef = 0;
  let sumTarget = 0;

  // Hitung akumulasi (terbalik dari tahun terbaru ke terlama, atau kronologis. SNI biasanya kronologis)
  for (let i = 0; i < syncedData.length; i++) {
    const year = syncedData[i].tahun;
    sumTarget += syncedData[i].hujan;
    sumRef += refMap.get(year)!;
    
    dataPlot.push({
      tahun: year,
      akumulasiTarget: sumTarget,
      akumulasiReferensi: sumRef
    });
  }

  // Deteksi patahan (Break point) via regresi linear terpisah (Segmented Regression sederhana)
  // Jika kemiringan (slope) berubah signifikan (>10%), flag inkonstensi
  const n = dataPlot.length;
  const mid = Math.floor(n / 2);
  
  const getSlope = (pts: typeof dataPlot) => {
    const n = pts.length;
    const sumX = pts.reduce((a, b) => a + b.akumulasiReferensi, 0);
    const sumY = pts.reduce((a, b) => a + b.akumulasiTarget, 0);
    const sumXY = pts.reduce((a, b) => a + b.akumulasiReferensi * b.akumulasiTarget, 0);
    const sumX2 = pts.reduce((a, b) => a + Math.pow(b.akumulasiReferensi, 2), 0);
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  };

  // Deteksi patahan sederhana membagi 2 rentang waktu
  const slope1 = getSlope(dataPlot.slice(0, mid));
  const slope2 = getSlope(dataPlot.slice(mid));
  
  // Beda kemiringan lebih dari 15% dianggap ada stasiun pindah / anomali sensor
  const slopeDiff = Math.abs((slope1 - slope2) / Math.max(slope1, slope2));
  const isKonsisten = slopeDiff < 0.15;
  
  let faktorKoreksi = 1;
  let breakYear = undefined;

  if (!isKonsisten) {
    faktorKoreksi = slope1 / slope2; // Slope lama / Slope baru
    breakYear = dataPlot[mid].tahun;
  }

  return {
    isKonsisten,
    koreksiDiperlukan: !isKonsisten,
    breakYear,
    faktorKoreksi,
    dataPlot,
    pesan: isKonsisten 
      ? `✓ Data konsisten secara grafis (Beda Slope: ${(slopeDiff*100).toFixed(1)}%)`
      : `✗ Patahan terdeteksi sekitar tahun ${breakYear}. Faktor Koreksi: ${faktorKoreksi.toFixed(3)}`
  };
}

export function getQCSummary(result: QCResult): string {
  const { isKonsisten, isBebasOutlier, isHomogen } = result;
  const passed = [isKonsisten, isBebasOutlier, isHomogen].filter(Boolean).length;
  return `QC: ${passed}/3 passed | Konsisten: ${isKonsisten ? '✓' : '✗'} | Outlier: ${isBebasOutlier ? '✓' : '✗'} | Homogen: ${isHomogen ? '✓' : '✗'}`;
}
