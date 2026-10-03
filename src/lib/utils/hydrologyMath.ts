/**
 * Core Hydrology Math Engine
 * Fungsi matematika murni untuk transformasi R24 → IDF → ABM → Hujan Efektif
 * SNI 2415:2016 compliant
 */

/**
 * 1. Fungsi Mononobe (IDF Curve)
 * Menghitung intensitas hujan berdasarkan durasi
 * 
 * Formula: I = (R24 / 24) × (24 / t)^(2/3)
 * 
 * @param R24 - Hujan harian maksimum (mm)
 * @param t - Durasi hujan kumulatif (jam)
 * @returns Intensitas hujan (mm/jam)
 */
export function calculateMononobe(R24: number, t: number): number {
  if (t <= 0) return 0;
  const I = (R24 / 24) * Math.pow(24 / t, 2 / 3);
  return I;
}

/**
 * 2. Alternating Block Method (ABM)
 * Mendistribusikan hujan harian menjadi distribusi jam-jaman
 * 
 * Algoritma 6 Langkah:
 * 1. Hitung intensitas I untuk setiap jam t (Mononobe)
 * 2. Hitung kedalaman kumulatif X = I × t
 * 3. Hitung selisih ΔX (incremental depth)
 * 4. Hitung persentase ΔX terhadap total
 * 5. Distribusi alternating (terbesar di tengah)
 * 6. Kalikan persentase dengan R24
 * 
 * @param R24 - Hujan harian maksimum (mm)
 * @param durasiHujan - Durasi total hujan (jam)
 * @param interval - Interval waktu (jam), default 1
 * @returns Array distribusi hujan jam-jaman (mm)
 */
// ============================================================================
// HOURLY RAINFALL DISTRIBUTION ENGINE (SNI 2415:2016 & PUPR STANDARDS)
// ============================================================================

export type HourlyRainfallMethod = 'abm' | 'pusair' | 'mononobe_forward' | 'uniform';

export interface HourlyDistributionOptions {
  interval?: number;
  abmPeakPosition?: 'center' | 'front' | 'rear';
}

export interface HourlyDistributionRow {
  jam: number;             // Jam ke-t (1-based)
  t: number;               // Waktu kumulatif (jam)
  intensitas: number;      // Intensitas ekuivalen (mm/jam)
  hujanJam: number;        // Kedalaman hujan jam ini (mm)
  persentase: number;      // Persentase terhadap total (%)
  hujanKumulatif: number;  // Hujan kumulatif (mm)
}

/**
 * Pola Distribusi Hujan Jam-jaman Empiris Puslitbang Pengairan (Pusair / Ditjen SDA)
 * Persentase fraksi per jam untuk durasi standar di Indonesia.
 * Referensi: SNI 2415:2016, Pd. T-02-2006-B, dan Pedoman Perencanaan Drainase Perkotaan.
 */
export const PUSAIR_HOURLY_PERCENTAGES: Record<number, number[]> = {
  2: [60, 40],
  3: [45, 35, 20],
  4: [35, 45, 12, 8],
  5: [30, 42, 14, 8, 6],
  6: [26, 45, 13, 8, 5, 3], // Pola standar baku Pusair 6 jam
  7: [22, 40, 16, 10, 6, 4, 2],
  8: [18, 38, 18, 10, 6, 4, 3, 3],
  10: [14, 30, 22, 14, 8, 5, 3, 2, 1, 1],
  12: [10, 25, 30, 12, 7, 5, 3, 2, 2, 2, 1, 1],
  24: [
    4, 8, 16, 22, 14, 8, 5, 4, 3, 2, 2, 2,
    1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5
  ]
};

/**
 * Helper: Menghitung bobot distribusi Pusair untuk durasi sembarang (n jam)
 */
function getPusairWeights(n: number): number[] {
  if (PUSAIR_HOURLY_PERCENTAGES[n]) {
    return [...PUSAIR_HOURLY_PERCENTAGES[n]];
  }

  // Jika durasi non-standar, gunakan fungsi bobot asimetris tropis (puncak di ~35% durasi)
  const peakTime = Math.max(1, Math.round(0.35 * n));
  const rawWeights: number[] = [];
  for (let i = 1; i <= n; i++) {
    const diff = (i - peakTime) / (0.28 * n);
    const w = Math.exp(-0.5 * diff * diff);
    rawWeights.push(w);
  }
  const sumW = rawWeights.reduce((s, w) => s + w, 0);
  return rawWeights.map(w => (w / sumW) * 100);
}

/**
 * Distribusi Hujan Jam-jaman Multi-Metode
 *
 * Mendukung:
 * 1. 'abm': Alternating Block Method (Metode Blok Bergantian Mononobe, standar SNI 2415:2016)
 * 2. 'pusair': Pola Empiris Puslitbang Pengairan Ditjen SDA
 * 3. 'mononobe_forward': Mononobe Terurut Menurun (Forward Mononobe)
 * 4. 'uniform': Distribusi Seragam (Rata per jam)
 *
 * Dijamin 100% konservasi massa volume hujan: sum(distribution) === R24
 *
 * @param method - Metode distribusi
 * @param R24 - Curah hujan harian rencana (mm)
 * @param durasiHujan - Durasi total hujan (jam)
 * @param options - Interval & posisi puncak
 * @returns Array distribusi hujan jam-jaman (mm)
 */
export function distributeHourlyRainfall(
  method: HourlyRainfallMethod,
  R24: number,
  durasiHujan: number,
  options?: HourlyDistributionOptions
): number[] {
  const interval = options?.interval ?? 1;
  const n = Math.floor(durasiHujan / interval);
  if (n <= 0 || R24 <= 0) return [];

  let rawDistribution: number[] = [];

  switch (method) {
    case 'abm': {
      // 1. Kedalaman kumulatif Mononobe
      const cumulativeDepth: number[] = [];
      for (let i = 1; i <= n; i++) {
        const t = i * interval;
        const I = calculateMononobe(R24, t);
        cumulativeDepth.push(I * t);
      }

      // 2. Selisih kedalaman (incremental depth)
      const incrementalDepth: number[] = [];
      for (let i = 0; i < n; i++) {
        const deltaX = i === 0 ? cumulativeDepth[0] : cumulativeDepth[i] - cumulativeDepth[i - 1];
        incrementalDepth.push(deltaX);
      }

      // 3. Normalisasi persentase
      const totalDepth = incrementalDepth.reduce((s, v) => s + v, 0);
      const percentages = incrementalDepth.map(v => (v / totalDepth) * 100);

      // 4. Urutkan descending
      const sortedIndices = percentages
        .map((val, idx) => ({ val, idx }))
        .sort((a, b) => b.val - a.val);

      rawDistribution = new Array(n).fill(0);

      // Tentukan posisi puncak
      let mid = Math.floor(n / 2);
      if (options?.abmPeakPosition === 'front') {
        mid = Math.max(0, Math.floor(n / 3));
      } else if (options?.abmPeakPosition === 'rear') {
        mid = Math.min(n - 1, Math.floor((2 * n) / 3));
      }

      for (let i = 0; i < sortedIndices.length; i++) {
        let position: number;
        if (i === 0) {
          position = mid;
        } else if (i % 2 === 1) {
          position = mid + Math.ceil(i / 2);
        } else {
          position = mid - i / 2;
        }
        position = Math.max(0, Math.min(n - 1, position));
        rawDistribution[position] = percentages[sortedIndices[i].idx];
      }

      rawDistribution = rawDistribution.map(pct => (pct / 100) * R24);
      break;
    }

    case 'pusair': {
      const weights = getPusairWeights(n);
      rawDistribution = weights.map(pct => (pct / 100) * R24);
      break;
    }

    case 'mononobe_forward': {
      const cumulativeDepth: number[] = [];
      for (let i = 1; i <= n; i++) {
        const t = i * interval;
        const I = calculateMononobe(R24, t);
        cumulativeDepth.push(I * t);
      }
      for (let i = 0; i < n; i++) {
        const deltaX = i === 0 ? cumulativeDepth[0] : cumulativeDepth[i] - cumulativeDepth[i - 1];
        rawDistribution.push(deltaX);
      }
      break;
    }

    case 'uniform':
    default: {
      const perHour = R24 / n;
      rawDistribution = new Array(n).fill(perHour);
      break;
    }
  }

  // Normalisasi ketat untuk memastikan 100% volume conservation
  const total = rawDistribution.reduce((sum, v) => sum + v, 0);
  if (total <= 0) return new Array(n).fill(0);

  const scale = R24 / total;
  return rawDistribution.map(v => v * scale);
}

/**
 * 2. Alternating Block Method (ABM) — Wrapper kompatibilitas mundur
 */
export function distributeRainfallABM(
  R24: number,
  durasiHujan: number,
  interval: number = 1
): number[] {
  return distributeHourlyRainfall('abm', R24, durasiHujan, { interval });
}

/**
 * 3. Hujan Efektif (Effective Rainfall)
 * Menghitung hujan efektif dengan metode Koefisien Pengaliran (C)
 * 
 * Formula: Pe = P × C
 * 
 * @param hyetograph - Array distribusi hujan jam-jaman (mm)
 * @param koefisienC - Koefisien pengaliran (0-1)
 * @returns Array hujan efektif (mm)
 */
export function calculateEffectiveRainfall(
  hyetograph: number[],
  koefisienC: number
): number[] {
  if (koefisienC < 0 || koefisienC > 1) {
    throw new Error('Koefisien C harus antara 0 dan 1');
  }
  
  return hyetograph.map(rainfall => rainfall * koefisienC);
}

/**
 * Utility: Generate tabel lengkap untuk visualisasi ABM
 */
export interface ABMTableRow {
  t: number;           // Durasi (jam)
  I: number;           // Intensitas (mm/jam)
  X: number;           // Kedalaman kumulatif (mm)
  deltaX: number;      // Selisih kedalaman (mm)
  deltaXPercent: number; // Persentase (%)
  hyetograph: number;  // Distribusi ABM (mm)
}

export function generateABMTable(
  R24: number,
  durasiHujan: number,
  interval: number = 1
): ABMTableRow[] {
  const n = Math.floor(durasiHujan / interval);
  if (n <= 0) return [];

  const cumulativeDepth: number[] = [];
  const incrementalDepth: number[] = [];

  for (let i = 1; i <= n; i++) {
    const t = i * interval;
    const I = calculateMononobe(R24, t);
    const X = I * t;
    cumulativeDepth.push(X);
    const deltaX = i === 1 ? X : X - cumulativeDepth[i - 2];
    incrementalDepth.push(deltaX);
  }

  const totalDepth = incrementalDepth.reduce((sum, val) => sum + val, 0);
  const percentages = incrementalDepth.map(val => (val / totalDepth) * 100);

  const hyetograph = distributeRainfallABM(R24, durasiHujan, interval);

  const table: ABMTableRow[] = [];
  for (let i = 0; i < n; i++) {
    table.push({
      t: (i + 1) * interval,
      I: calculateMononobe(R24, (i + 1) * interval),
      X: cumulativeDepth[i],
      deltaX: incrementalDepth[i],
      deltaXPercent: percentages[i],
      hyetograph: hyetograph[i]
    });
  }

  return table;
}

/**
 * Utility: Menghasilkan tabel distribusi jam-jaman multi-metode untuk antarmuka UI
 */
export function generateHourlyDistributionTable(
  method: HourlyRainfallMethod,
  R24: number,
  durasiHujan: number,
  options?: HourlyDistributionOptions
): HourlyDistributionRow[] {
  const interval = options?.interval ?? 1;
  const distribution = distributeHourlyRainfall(method, R24, durasiHujan, options);
  const rows: HourlyDistributionRow[] = [];
  let cum = 0;

  for (let i = 0; i < distribution.length; i++) {
    const val = distribution[i];
    cum += val;
    const t = (i + 1) * interval;
    rows.push({
      jam: i + 1,
      t,
      intensitas: val / interval,
      hujanJam: Number(val.toFixed(2)),
      persentase: Number(((val / R24) * 100).toFixed(2)),
      hujanKumulatif: Number(cum.toFixed(2)),
    });
  }

  return rows;
}

