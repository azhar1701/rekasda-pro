/**
 * Flood Hydrograph Generation — Engine Layer
 *
 * Fungsi pure untuk menghasilkan hidrograf banjir rencana.
 * Diekstrak dari FloodDischargeCalculator.tsx untuk memisahkan
 * logika bisnis dari komponen UI React.
 *
 * @standard SNI 2415:2016
 */

import { roundEng, safeRange } from '@/lib/utils/precision';
import { PRECISION } from '@/lib/constants/precision';
import type { EngineResult } from '@/lib/engine/types';

// ─── Types ──────────────────────────────────────────────────────────

export interface HydrographPoint {
  time: number;
  discharge: number;
}

export interface RationalHydrographInput {
  /** Debit puncak (m³/s) */
  Q: number;
  /** Waktu konsentrasi (menit) */
  tc: number;
}

export interface RationalHydrographData {
  hydrograph: HydrographPoint[];
  qPeak: number;
  tPeak: number;
  volume: number;
}

// ─── Mononobe IDF Formula ───────────────────────────────────────────

/**
 * Hitung intensitas hujan dengan rumus Mononobe.
 * Formula: I = (R₂₄ / 24) × (24 / tc)^(2/3)
 *
 * Dipindahkan dari event handler FloodDischargeCalculator.tsx
 * ke engine layer untuk menghindari duplikasi logika.
 *
 * @param R24 - Curah hujan harian maksimum (mm)
 * @param tcHours - Waktu konsentrasi (jam)
 * @returns Intensitas hujan (mm/jam)
 *
 * @standard SNI 2415:2016 Pasal 4
 */
export function calculateMononobeIntensity(R24: number, tcHours: number): number {
  if (R24 <= 0 || tcHours <= 0) return 0;
  return (R24 / 24) * Math.pow(24 / tcHours, 2 / 3);
}

// ─── Rational Hydrograph ────────────────────────────────────────────

/**
 * Generate hidrograf segitiga sederhana untuk Metode Rasional.
 * Diekstrak dari FloodDischargeCalculator.tsx (L197-212).
 *
 * Pola segitiga:
 * - Fase naik (0 → tc): Q(t) = Qpeak × (t / tc)
 * - Fase turun (tc → 2tc): Q(t) = Qpeak × (2 - t / tc)
 * - Setelahnya: 0
 *
 * @param input - Parameter hidrograf rasional
 * @returns EngineResult dengan data hidrograf dan metadata
 */
export function generateRationalHydrograph(
  input: RationalHydrographInput
): EngineResult<RationalHydrographData> {
  const { Q, tc } = input;
  const warnings: string[] = [];

  if (Q <= 0) warnings.push('Debit puncak (Q) harus > 0');
  if (tc <= 0) warnings.push('Waktu konsentrasi (tc) harus > 0');

  const data: HydrographPoint[] = [];
  const totalTime = tc * 3;
  const timeStep = totalTime / 20;

  for (const t of safeRange(0, totalTime, timeStep)) {
    let discharge = 0;
    if (t <= tc) {
      discharge = Q * (t / tc);
    } else if (t <= tc * 2) {
      discharge = Q * (2 - t / tc);
    }
    data.push({
      time: roundEng(t, PRECISION.time),
      discharge: roundEng(discharge, PRECISION.discharge),
    });
  }

  const tcHours = tc / 60;
  const volume = roundEng(Q * tcHours * 3600, PRECISION.volume);

  return {
    data: {
      hydrograph: data,
      qPeak: roundEng(Q, PRECISION.discharge),
      tPeak: roundEng(tcHours, PRECISION.time),
      volume,
    },
    metadata: {
      standard: 'SNI 2415:2016',
      clause: 'Pasal 5.2',
      method: 'Metode Rasional — Hidrograf Segitiga',
      warnings,
      precision: { discharge: PRECISION.discharge, time: PRECISION.time },
    },
  };
}
