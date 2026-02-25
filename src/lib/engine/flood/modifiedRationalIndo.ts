/**
 * Modified Rational Methods for Indonesian Hydrology
 * Based on: "Hidrologi untuk Pengairan" by Suyono Sosrodarsono
 * Standards: SNI 2415:2016, Indonesian empirical methods
 * 
 * Methods implemented:
 * 1. Haspers & Osugi - General purpose (A > 3 km²)
 * 2. der Weduwen - Small to medium catchments (3-100 km²)
 * 3. Melchior - Large catchments (A > 100 km²)
 */

import { z } from 'zod';

// ============================================================================
// TYPE DEFINITIONS & VALIDATION
// ============================================================================

export const ModifiedRationalInputSchema = z.object({
  luasDasKm2: z.number().positive().describe('Luas DAS dalam km²'),
  panjangSungaiUtamaKm: z.number().positive().describe('Panjang sungai utama dalam km'),
  kemiringanSungai: z.number().positive().max(1).describe('Kemiringan sungai (m/m atau %)'),
  curahHujanHarianMaksimum: z.number().positive().describe('Curah hujan harian maksimum R24 (mm)'),
  koefisienPengaliran: z.number().min(0.1).max(1).optional().describe('Koefisien pengaliran C (opsional)'),
});

export type ModifiedRationalInput = z.infer<typeof ModifiedRationalInputSchema>;

export interface ModifiedRationalResult {
  method: 'HASPERS_OSUGI' | 'DER_WEDUWEN' | 'MELCHIOR';
  qPeak: number; // m³/s
  tc: number; // jam
  alpha?: number; // Koefisien reduksi luas
  beta?: number; // Koefisien reduksi Haspers
  C: number; // Koefisien pengaliran
  intensity: number; // mm/jam
  warnings: string[];
  metadata: {
    areaCategory: string;
    formula: string;
    iterations?: number;
  };
}

export interface DesignFloodResult {
  recommended: ModifiedRationalResult;
  alternatives: ModifiedRationalResult[];
  areaAnalysis: {
    area: number;
    category: 'VERY_SMALL' | 'SMALL' | 'MEDIUM' | 'LARGE';
    recommendation: string;
  };
}

// ============================================================================
// HASPERS & OSUGI METHOD
// ============================================================================

/**
 * Haspers & Osugi Method (Indonesia)
 * Suitable for: A > 3 km²
 * 
 * Formula:
 * - tc = 0.1 * L^0.8 * S^-0.3 (jam)
 * - β = 1 / (1 + tc^2 + 10*tc) (koefisien reduksi)
 * - α = β * (120 / (120 + A)) (koefisien limpasan)
 * - I = R24 / 24 * (24 / tc)^(2/3) (Mononobe)
 * - Qp = α * I * A / 3.6
 * 
 * @param A - Luas DAS (km²)
 * @param L - Panjang sungai utama (km)
 * @param S - Kemiringan sungai (m/m)
 * @param R24 - Curah hujan harian maksimum (mm)
 */
export function calculateHaspersOsugi(
  A: number,
  L: number,
  S: number,
  R24: number
): ModifiedRationalResult {
  const warnings: string[] = [];

  // Validasi area
  if (A <= 3) {
    warnings.push('Area terlalu kecil untuk Haspers & Osugi. Gunakan Metode Rasional Standar.');
  }

  // 1. Waktu konsentrasi (jam) - Formula Haspers
  let tc = 0.1 * Math.pow(L, 0.8) * Math.pow(S, -0.3);
  // Guard: tc must be > 0 to avoid Infinity in Mononobe intensity formula
  if (!isFinite(tc) || tc < 0.01) tc = 0.01;

  // 2. Koefisien reduksi β (Haspers)
  const beta = 1 / (1 + Math.pow(tc, 2) + 10 * tc);

  // 3. Koefisien limpasan α (Osugi modification)
  const alpha = beta * (120 / (120 + A));

  // 4. Intensitas hujan (mm/jam) - Mononobe
  const intensity = (R24 / 24) * Math.pow(24 / tc, 2 / 3);

  // 5. Debit puncak (m³/s)
  // Qp = α * I * A / 3.6
  const qPeak = (alpha * intensity * A) / 3.6;

  return {
    method: 'HASPERS_OSUGI',
    qPeak,
    tc,
    alpha,
    beta,
    C: alpha, // α berfungsi sebagai C dalam konteks ini
    intensity,
    warnings,
    metadata: {
      areaCategory: A <= 100 ? 'Small-Medium' : 'Large',
      formula: 'Qp = α × I × A / 3.6, dimana α = β × (120/(120+A))',
    },
  };
}

// ============================================================================
// DER WEDUWEN METHOD
// ============================================================================

/**
 * der Weduwen Method (Indonesia)
 * Suitable for: 3 < A < 100 km²
 * 
 * Karakteristik: Iteratif karena C dan tc saling bergantung
 * 
 * Formula:
 * - tc = 0.167 * L^0.77 * S^-0.385 (jam) - initial guess
 * - C = 1 / (1 + (tc / (tc + 1))) (iteratif)
 * - I = R24 / 24 * (24 / tc)^(2/3)
 * - Qp = C * I * A / 3.6
 * 
 * Iterasi dilakukan hingga C konvergen (toleransi 0.001) atau max 20 iterasi
 * 
 * @param A - Luas DAS (km²)
 * @param L - Panjang sungai utama (km)
 * @param S - Kemiringan sungai (m/m)
 * @param R24 - Curah hujan harian maksimum (mm)
 */
export function calculateDerWeduwen(
  A: number,
  L: number,
  S: number,
  R24: number
): ModifiedRationalResult {
  const warnings: string[] = [];
  const MAX_ITERATIONS = 20;
  const TOLERANCE = 0.001;

  // Validasi area
  if (A <= 3) {
    warnings.push('Area terlalu kecil. Gunakan Metode Rasional Standar.');
  }
  if (A > 100) {
    warnings.push('Area terlalu besar untuk der Weduwen. Pertimbangkan Metode Melchior.');
  }

  // 1. Initial guess untuk tc (jam) - Formula der Weduwen
  let tc = 0.167 * Math.pow(L, 0.77) * Math.pow(S, -0.385);
  // Guard: tc must be > 0 to avoid Infinity in Mononobe intensity formula
  if (!isFinite(tc) || tc < 0.01) tc = 0.01;
  let C = 0.5; // Initial guess
  let prevC = 0;
  let iterations = 0;

  // 2. Iterasi untuk mencari C yang konvergen
  while (Math.abs(C - prevC) > TOLERANCE && iterations < MAX_ITERATIONS) {
    prevC = C;

    // Formula der Weduwen untuk C (empiris Indonesia)
    // C bergantung pada tc dan karakteristik DAS
    C = 1 / (1 + tc / (tc + 1));

    // Update tc berdasarkan C baru (coupling effect)
    // tc dipengaruhi oleh karakteristik aliran yang bergantung pada C
    const tcAdjustment = 1 + (1 - C) * 0.5; // Faktor empiris
    tc = (0.167 * Math.pow(L, 0.77) * Math.pow(S, -0.385)) * tcAdjustment;

    iterations++;
  }

  if (iterations >= MAX_ITERATIONS) {
    warnings.push(`Iterasi mencapai batas maksimum (${MAX_ITERATIONS}). Hasil mungkin kurang akurat.`);
  }

  // 3. Intensitas hujan (mm/jam) - Mononobe
  const intensity = (R24 / 24) * Math.pow(24 / tc, 2 / 3);

  // 4. Debit puncak (m³/s)
  const qPeak = (C * intensity * A) / 3.6;

  return {
    method: 'DER_WEDUWEN',
    qPeak,
    tc,
    C,
    intensity,
    warnings,
    metadata: {
      areaCategory: 'Small-Medium',
      formula: 'Qp = C × I × A / 3.6 (iteratif)',
      iterations,
    },
  };
}

// ============================================================================
// MELCHIOR METHOD
// ============================================================================

/**
 * Melchior Method (Indonesia)
 * Suitable for: A > 100 km²
 * 
 * Menggunakan faktor reduksi luas berbentuk elips
 * 
 * Formula:
 * - tc = 0.1 * L^0.8 * S^-0.3 (jam)
 * - α = 1 / (1 + (A / 120)^0.5) (koefisien reduksi elips)
 * - C = 0.7 * α (asumsi koefisien pengaliran dengan reduksi)
 * - I = R24 / 24 * (24 / tc)^(2/3)
 * - Qp = C * I * A / 3.6
 * 
 * @param A - Luas DAS (km²)
 * @param L - Panjang sungai utama (km)
 * @param S - Kemiringan sungai (m/m)
 * @param R24 - Curah hujan harian maksimum (mm)
 * @param C_base - Koefisien pengaliran dasar (default 0.7)
 */
export function calculateMelchior(
  A: number,
  L: number,
  S: number,
  R24: number,
  C_base: number = 0.7
): ModifiedRationalResult {
  const warnings: string[] = [];

  // Validasi area
  if (A <= 100) {
    warnings.push('Area terlalu kecil untuk Melchior. Pertimbangkan der Weduwen atau Haspers & Osugi.');
  }

  // 1. Waktu konsentrasi (jam)
  let tc = 0.1 * Math.pow(L, 0.8) * Math.pow(S, -0.3);
  // Guard: tc must be > 0 to avoid Infinity in Mononobe intensity formula
  if (!isFinite(tc) || tc < 0.01) tc = 0.01;

  // 2. Koefisien reduksi luas elips (Melchior)
  // α menurun seiring bertambahnya luas DAS
  const alpha = 1 / (1 + Math.pow(A / 120, 0.5));

  // 3. Koefisien pengaliran dengan reduksi
  const C = C_base * alpha;

  // 4. Intensitas hujan (mm/jam) - Mononobe
  const intensity = (R24 / 24) * Math.pow(24 / tc, 2 / 3);

  // 5. Debit puncak (m³/s)
  const qPeak = (C * intensity * A) / 3.6;

  return {
    method: 'MELCHIOR',
    qPeak,
    tc,
    alpha,
    C,
    intensity,
    warnings,
    metadata: {
      areaCategory: 'Large',
      formula: 'Qp = C × I × A / 3.6, dimana C = C_base × α (reduksi elips)',
    },
  };
}

// ============================================================================
// SMART ROUTER (EXPERT SYSTEM)
// ============================================================================

/**
 * Router Hidrologi - Expert System untuk Pemilihan Metode
 * 
 * Aturan pemilihan:
 * - A ≤ 3 km² → Metode Rasional Standar (throw error)
 * - 3 < A ≤ 100 km² → der Weduwen (primary), Haspers & Osugi (alternative)
 * - A > 100 km² → Melchior (primary), Haspers & Osugi (alternative)
 * 
 * @param inputs - Input parameter hidrologi
 * @returns Hasil perhitungan dengan rekomendasi metode
 */
export function calculateDesignFloodIndo(inputs: ModifiedRationalInput): DesignFloodResult {
  // Validasi input
  const validated = ModifiedRationalInputSchema.parse(inputs);
  const { luasDasKm2: A, panjangSungaiUtamaKm: L, kemiringanSungai: S, curahHujanHarianMaksimum: R24, koefisienPengaliran } = validated;

  // Analisis kategori area
  let category: 'VERY_SMALL' | 'SMALL' | 'MEDIUM' | 'LARGE';
  let recommendation: string;
  let recommended: ModifiedRationalResult;
  const alternatives: ModifiedRationalResult[] = [];

  if (A <= 3) {
    category = 'VERY_SMALL';
    recommendation = 'Gunakan Metode Rasional Standar (Q = C × I × A / 3.6). Area terlalu kecil untuk Modified Rational Methods.';
    
    throw new Error(
      `Area DAS terlalu kecil (${A.toFixed(2)} km²). ${recommendation}`
    );
  } else if (A <= 100) {
    category = A <= 50 ? 'SMALL' : 'MEDIUM';
    recommendation = 'der Weduwen (primary) atau Haspers & Osugi (alternative)';

    // Primary: der Weduwen
    recommended = calculateDerWeduwen(A, L, S, R24);

    // Alternative: Haspers & Osugi
    alternatives.push(calculateHaspersOsugi(A, L, S, R24));
  } else {
    category = 'LARGE';
    recommendation = 'Melchior (primary) atau Haspers & Osugi (alternative)';

    // Primary: Melchior
    recommended = calculateMelchior(A, L, S, R24, koefisienPengaliran);

    // Alternative: Haspers & Osugi
    alternatives.push(calculateHaspersOsugi(A, L, S, R24));
  }

  return {
    recommended,
    alternatives,
    areaAnalysis: {
      area: A,
      category,
      recommendation,
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Hitung semua metode dan bandingkan hasilnya
 * Berguna untuk analisis sensitivitas
 */
export function compareAllMethods(inputs: ModifiedRationalInput): {
  haspers: ModifiedRationalResult;
  derWeduwen: ModifiedRationalResult;
  melchior: ModifiedRationalResult;
  comparison: {
    qPeakRange: { min: number; max: number; diff: number };
    tcRange: { min: number; max: number; diff: number };
  };
} {
  const validated = ModifiedRationalInputSchema.parse(inputs);
  const { luasDasKm2: A, panjangSungaiUtamaKm: L, kemiringanSungai: S, curahHujanHarianMaksimum: R24, koefisienPengaliran } = validated;

  const haspers = calculateHaspersOsugi(A, L, S, R24);
  const derWeduwen = calculateDerWeduwen(A, L, S, R24);
  const melchior = calculateMelchior(A, L, S, R24, koefisienPengaliran);

  const qPeaks = [haspers.qPeak, derWeduwen.qPeak, melchior.qPeak];
  const tcs = [haspers.tc, derWeduwen.tc, melchior.tc];

  return {
    haspers,
    derWeduwen,
    melchior,
    comparison: {
      qPeakRange: {
        min: Math.min(...qPeaks),
        max: Math.max(...qPeaks),
        diff: Math.max(...qPeaks) - Math.min(...qPeaks),
      },
      tcRange: {
        min: Math.min(...tcs),
        max: Math.max(...tcs),
        diff: Math.max(...tcs) - Math.min(...tcs),
      },
    },
  };
}
