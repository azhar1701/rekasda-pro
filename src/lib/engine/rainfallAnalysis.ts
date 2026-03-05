/**
 * Rainfall Analysis Engine
 * Thiessen Polygon Average, Area Reduction Factor (ARF), PMP (Hershfield)
 * Sesuai Modul 6 Analisis Hidrologi & PSA 007
 */

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

export interface ThiessenStation {
  stasiunId: string;
  namaStasiun: string;
  /** Luas pengaruh / area of influence (km²) */
  luasPengaruh: number;
  /** Daily max rainfall per year — annual maximum series */
  annualMax: number[];
}

export interface ThiessenResult {
  /** Per-station weights (fractions summing to 1.0) */
  bobotStasiun: { stasiunId: string; namaStasiun: string; bobot: number }[];
  /** Total catchment area (km²) */
  totalLuas: number;
  /** Weighted average annual max series */
  hujanRataRataDAS: number[];
}

export interface ARFResult {
  /** Area Reduction Factor (0–1) */
  arf: number;
  /** Point rainfall (mm) — input */
  hujanTitik: number;
  /** Areal rainfall = hujanTitik × arf */
  hujanDAS: number;
}

export interface PMPResult {
  /** Probable Maximum Precipitation (mm) */
  pmp: number;
  /** Mean of annual max series */
  mean: number;
  /** Standard deviation */
  stdDev: number;
  /** Hershfield frequency factor */
  kn: number;
}

// ─────────────────────────────────────────────────
// 1. Thiessen Polygon Weighted Average
// ─────────────────────────────────────────────────

/**
 * Calculates Thiessen polygon weighted-average rainfall.
 * 
 * Formula: P̄ = Σ(Ai × Pi) / ΣAi
 * 
 * @param stations - Array of stations with area and annual max data
 * @returns ThiessenResult with weights and weighted average series
 * @throws Error if stations array is empty or areas are invalid
 */
export function calculateThiessenAverage(stations: ThiessenStation[]): ThiessenResult {
  if (!stations || stations.length === 0) {
    throw new Error('Minimal satu stasiun diperlukan untuk perhitungan Thiessen.');
  }

  // Validate all areas are positive
  const invalidStation = stations.find(s => s.luasPengaruh <= 0);
  if (invalidStation) {
    throw new Error(`Luas pengaruh stasiun "${invalidStation.namaStasiun}" harus > 0.`);
  }

  const totalLuas = stations.reduce((sum, s) => sum + s.luasPengaruh, 0);
  if (totalLuas <= 0) {
    throw new Error('Total luas pengaruh harus > 0.');
  }

  // Calculate weights
  const bobotStasiun = stations.map(s => ({
    stasiunId: s.stasiunId,
    namaStasiun: s.namaStasiun,
    bobot: s.luasPengaruh / totalLuas,
  }));

  // Find the minimum number of data years across all stations
  const minYears = Math.min(...stations.map(s => s.annualMax.length));
  if (minYears === 0) {
    return { bobotStasiun, totalLuas, hujanRataRataDAS: [] };
  }

  // Calculate weighted average for each year
  const hujanRataRataDAS: number[] = [];
  for (let i = 0; i < minYears; i++) {
    let weightedSum = 0;
    for (const station of stations) {
      const weight = station.luasPengaruh / totalLuas;
      weightedSum += weight * station.annualMax[i];
    }
    hujanRataRataDAS.push(Number(weightedSum.toFixed(2)));
  }

  return { bobotStasiun, totalLuas, hujanRataRataDAS };
}

/**
 * Calculates Algebraic (Arithmetic) Average rainfall.
 * 
 * Formula: P̄ = ΣPi / n
 * 
 * @param stations - Array of stations with annual max data
 * @returns Weighted average series (equal weights)
 */
export function calculateAlgebraicAverage(stations: ThiessenStation[]): number[] {
  if (!stations || stations.length === 0) return [];
  const minYears = Math.min(...stations.map(s => s.annualMax.length));
  const result: number[] = [];
  for (let i = 0; i < minYears; i++) {
    const sum = stations.reduce((acc, s) => acc + s.annualMax[i], 0);
    result.push(Number((sum / stations.length).toFixed(2)));
  }
  return result;
}

/**
 * Calculates Isohyet Weighted Average rainfall.
 * 
 * Formula: P̄ = Σ(Li × Pi) / ΣLi
 * Dimana:
 * - Li = Luas antar dua garis isohyet (km²)
 * - Pi = Curah hujan rata-rata antar dua garis isohyet (mm)
 *  pride: production grade math
 * @param segments - Array of isohyet area segments
 * @returns Weighted average rainfall (mm)
 */
export function calculateIsohyetAverage(segments: { luasAntarGaris: number; curahHujanRataRata: number }[]): number {
  if (!segments || segments.length === 0) return 0;
  const totalLuas = segments.reduce((sum, s) => sum + s.luasAntarGaris, 0);
  if (totalLuas <= 0) return 0;
  const weightedSum = segments.reduce((sum, s) => sum + (s.luasAntarGaris * s.curahHujanRataRata), 0);
  return Number((weightedSum / totalLuas).toFixed(2));
}

// ─────────────────────────────────────────────────
// 2. Area Reduction Factor (ARF)
// ─────────────────────────────────────────────────

/**
 * Calculates Area Reduction Factor using empirical curve (PSA 007).
 * 
 * Based on WMO/UK FSR approach adapted for Indonesian conditions:
 * ARF = 1 - 0.04 × A^0.35  (for 24-hour duration)
 * 
 * Where A = catchment area in km²
 * 
 * @param luasDas - Catchment area (km²), must be > 0
 * @param hujanTitik - Point rainfall (mm)
 * @param durasi - Rainfall duration (hours), default 24
 * @returns ARFResult with arf value and areal rainfall
 */
export function calculateARF(luasDas: number, hujanTitik: number, durasi: number = 24): ARFResult {
  if (luasDas <= 0) {
    throw new Error('Luas DAS harus > 0 km².');
  }
  if (hujanTitik <= 0) {
    throw new Error('Curah hujan titik harus > 0 mm.');
  }

  // Duration-based coefficient adjustment
  // For shorter durations, ARF is lower (more reduction)
  let durationCoef = 0.04; // default for 24-hour
  if (durasi <= 1) durationCoef = 0.06;
  else if (durasi <= 6) durationCoef = 0.05;
  else if (durasi <= 12) durationCoef = 0.045;
  // 24h: 0.04

  // PSA 007 empirical: ARF = 1 - c × A^0.35
  let arf = 1 - durationCoef * Math.pow(luasDas, 0.35);

  // Clamp ARF between 0.1 and 1.0
  arf = Math.max(0.1, Math.min(1.0, arf));

  const hujanDAS = Number((hujanTitik * arf).toFixed(2));

  return {
    arf: Number(arf.toFixed(4)),
    hujanTitik,
    hujanDAS,
  };
}

// ─────────────────────────────────────────────────
// 3. PMP — Hershfield Statistical Method
// ─────────────────────────────────────────────────

/**
 * Calculates Probable Maximum Precipitation using Hershfield method.
 * 
 * Formula: PMP = X̄n + Kn × Sn
 * 
 * Where:
 * - X̄n = Mean of annual maximum series
 * - Sn = Standard deviation of annual maximum series
 * - Kn = Frequency factor (typically 15 for Hershfield, adjusted by n)
 * 
 * @param annualMax - Array of annual maximum rainfall values (mm)
 * @returns PMPResult with pmp value, mean, stdDev, and kn
 */
export function calculatePMP(annualMax: number[]): PMPResult {
  const n = annualMax.length;
  if (n < 3) {
    throw new Error('Minimal 3 data tahunan diperlukan untuk perhitungan PMP.');
  }

  const mean = annualMax.reduce((sum, v) => sum + v, 0) / n;

  const variance = annualMax.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  // Hershfield Kn factor — varies by sample size
  // Standard: Kn ≈ 15 for large samples, reduced for small samples
  // Using WMO-recommended table approximation
  let kn: number;
  if (n <= 10) kn = 10;
  else if (n <= 20) kn = 12;
  else if (n <= 30) kn = 13;
  else if (n <= 50) kn = 14;
  else kn = 15;

  // Guard: if stdDev is 0, PMP equals mean (no variability)
  const pmp = stdDev > 0
    ? Number((mean + kn * stdDev).toFixed(2))
    : Number(mean.toFixed(2));

  return {
    pmp,
    mean: Number(mean.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    kn,
  };
}
