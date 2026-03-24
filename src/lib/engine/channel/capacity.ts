/**
 * Channel Hydraulics Engine — Manning Equation for Channel Capacity
 *
 * Logika komputasi hidrolika saluran terbuka yang diekstrak dari
 * ChannelCapacity.tsx komponen UI React.
 *
 * @standard SNI 8066:2015
 * @reference Chow, V.T. (1959) Open Channel Hydraulics
 */

import { roundEng } from '@/lib/utils/precision';
import { PRECISION } from '@/lib/constants/precision';
import type { EngineResult } from '@/lib/engine/types';

// ─── Types ──────────────────────────────────────────────────────────

export interface TrapezoidChannelInput {
  /** Lebar dasar (m) */
  b: number;
  /** Tinggi air (m) */
  h: number;
  /** Kemiringan tebing (m:1) */
  m: number;
  /** Kemiringan saluran (m/m) */
  S: number;
  /** Kekasaran Manning */
  n: number;
}

export interface ChannelHydraulicResult {
  /** Luas penampang basah (m²) */
  A: number;
  /** Keliling basah (m) */
  P: number;
  /** Jari-jari hidrolis (m) */
  R: number;
  /** Lebar atas (m) */
  T: number;
  /** Debit kapasitas (m³/s) */
  Q: number;
  /** Kecepatan aliran (m/s) */
  V: number;
  /** Bilangan Froude */
  Fr: number;
  /** Tipe aliran (Subkritis / Superkritis / Kritis) */
  flowType: string;
}

const GRAVITY = 9.81; // m/s²

// ─── Channel Capacity Calculation ───────────────────────────────────

/**
 * Hitung parameter hidrolika saluran trapesium dengan persamaan Manning.
 * Diekstrak dari ChannelCapacity.tsx (L38-63).
 *
 * Formula Manning: Q = (1/n) × A × R^(2/3) × √S
 *
 * @param input - Parameter geometri dan hidrolika saluran
 * @returns EngineResult dengan data hidrolika lengkap
 */
export function calculateTrapezoidCapacity(
  input: TrapezoidChannelInput
): EngineResult<ChannelHydraulicResult> {
  const { b, h, m, S, n } = input;
  const warnings: string[] = [];

  // Validasi input
  if (b <= 0) warnings.push('Lebar dasar (b) harus > 0');
  if (h <= 0) warnings.push('Tinggi air (h) harus > 0');
  if (m < 0) warnings.push('Kemiringan tebing (m) tidak boleh negatif');
  if (S <= 0) warnings.push('Kemiringan saluran (S) harus > 0');
  if (n <= 0) warnings.push('Kekasaran Manning (n) harus > 0');

  if (warnings.length > 0) {
    return {
      data: { A: 0, P: 0, R: 0, T: 0, Q: 0, V: 0, Fr: 0, flowType: 'N/A' },
      metadata: {
        standard: 'SNI 8066:2015',
        clause: 'Pasal 4.3',
        method: 'Manning Equation — Saluran Trapesium',
        warnings,
        error: 'Parameter tidak valid',
      },
    };
  }

  // Perhitungan geometri penampang basah
  const A = roundEng((b + m * h) * h, PRECISION.area);
  const P = roundEng(b + 2 * h * Math.sqrt(1 + m * m), PRECISION.discharge);
  const R = roundEng(A / P, PRECISION.discharge);
  const T = roundEng(b + 2 * m * h, PRECISION.discharge);

  // Manning equation
  const Q = roundEng((1 / n) * A * Math.pow(R, 2 / 3) * Math.sqrt(S), PRECISION.discharge);
  const V = roundEng(Q / A, PRECISION.velocity);

  // Froude number
  const hydraulicDepth = A / T;
  const Fr = roundEng(V / Math.sqrt(GRAVITY * hydraulicDepth), PRECISION.coefficient);

  const flowType = Fr < 0.9 ? 'Subkritis' : Fr > 1.1 ? 'Superkritis' : 'Kritis';

  if (Fr > 1.1) {
    warnings.push('Aliran superkritis terdeteksi — periksa stabilitas saluran');
  }

  return {
    data: { A, P, R, T, Q, V, Fr, flowType },
    metadata: {
      standard: 'SNI 8066:2015',
      clause: 'Pasal 4.3',
      method: 'Manning Equation — Saluran Trapesium',
      warnings,
      notes: `Q = (1/${n}) × ${A.toFixed(3)} × ${R.toFixed(3)}^(2/3) × √${S}`,
      precision: { discharge: PRECISION.discharge, velocity: PRECISION.velocity },
    },
  };
}
