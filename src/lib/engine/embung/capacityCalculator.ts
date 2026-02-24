/**
 * =============================================================================
 * Capacity Calculator Service — Sequent Peak Algorithm (Numerical Rippl)
 * =============================================================================
 * Menentukan volume tampungan efektif waduk/embung berdasarkan
 * selisih kumulatif aliran masuk (inflow) dan kebutuhan air (outflow).
 *
 * Referensi: Modul 6 Analisis Hidrologi PUPR — Metode Rippl / Sequent Peak
 * =============================================================================
 */

import {
  HydroValidationError,
  type SequentPeakInput,
  type SequentPeakResult,
  type MassCurvePoint,
} from '@/features/embung/types/embung.types';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Des',
];

/**
 * Validates input arrays for the Sequent Peak Algorithm.
 * @throws HydroValidationError on invalid input.
 */
function validateInput(input: SequentPeakInput): void {
  if (input.inflow.length === 0) {
    throw new HydroValidationError(
      'Array inflow tidak boleh kosong.',
      'EMPTY_INFLOW'
    );
  }
  if (input.inflow.length !== input.outflow.length) {
    throw new HydroValidationError(
      `Panjang array inflow (${input.inflow.length}) dan outflow (${input.outflow.length}) harus sama.`,
      'ARRAY_LENGTH_MISMATCH',
      { inflowLength: input.inflow.length, outflowLength: input.outflow.length }
    );
  }
  for (let i = 0; i < input.inflow.length; i++) {
    if (input.inflow[i] < 0) {
      throw new HydroValidationError(
        `Inflow pada periode ${i} tidak boleh negatif (nilai: ${input.inflow[i]}).`,
        'NEGATIVE_INFLOW',
        { period: i, value: input.inflow[i] }
      );
    }
    if (input.outflow[i] < 0) {
      throw new HydroValidationError(
        `Outflow pada periode ${i} tidak boleh negatif (nilai: ${input.outflow[i]}).`,
        'NEGATIVE_OUTFLOW',
        { period: i, value: input.outflow[i] }
      );
    }
  }
}

/**
 * Calculates the required reservoir storage using the Sequent Peak Algorithm.
 *
 * **Algorithm:**
 * 1. For each period t, compute net flow: Nt = Inflow_t - Outflow_t
 * 2. Compute cumulative net flow (mass curve).
 * 3. Sequent Peak: Pt = max(P_{t-1} - Nt, 0)
 *    where Pt represents the "peak" of required storage so far.
 * 4. Max storage = max(Pt) across all periods.
 *
 * @param input — inflow and outflow arrays (same length, ≥ 1 element).
 * @returns SequentPeakResult with all intermediate and final values.
 */
export function calculateSequentPeak(input: SequentPeakInput): SequentPeakResult {
  validateInput(input);

  const n = input.inflow.length;
  const netFlow: number[] = new Array(n);
  const cumulativeNetFlow: number[] = new Array(n);
  const sequentPeak: number[] = new Array(n);
  const requiredStorage: number[] = new Array(n);
  const massCurveData: MassCurvePoint[] = new Array(n);

  let cumInflow = 0;
  let cumOutflow = 0;
  let cumNet = 0;
  let prevPeak = 0;
  let maxStorage = 0;

  for (let i = 0; i < n; i++) {
    const nf = input.inflow[i] - input.outflow[i];
    netFlow[i] = nf;

    cumInflow += input.inflow[i];
    cumOutflow += input.outflow[i];
    cumNet += nf;
    cumulativeNetFlow[i] = cumNet;

    // Sequent Peak: if previous peak minus net flow > 0, storage is needed
    const peak = Math.max(prevPeak - nf, 0);
    sequentPeak[i] = peak;
    requiredStorage[i] = peak;
    prevPeak = peak;

    if (peak > maxStorage) {
      maxStorage = peak;
    }

    massCurveData[i] = {
      period: i + 1,
      month: MONTH_LABELS[i % MONTH_LABELS.length],
      cumulativeInflow: cumInflow,
      cumulativeOutflow: cumOutflow,
      cumulativeNetFlow: cumNet,
    };
  }

  return {
    netFlow,
    cumulativeNetFlow,
    sequentPeak,
    requiredStorage,
    maxStorageRequired: maxStorage,
    massCurveData,
  };
}
