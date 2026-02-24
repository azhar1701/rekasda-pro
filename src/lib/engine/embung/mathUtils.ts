/**
 * =============================================================================
 * Math Utilities for Embung Hydrology Calculations
 * =============================================================================
 * Pure functions for interpolation and curve validation.
 * No side effects. Strict input validation.
 * =============================================================================
 */

import { HydroValidationError, type CurvePoint } from '@/features/embung/types/embung.types';

/**
 * Validates that a curve's x-values are strictly monotonically increasing.
 * @throws HydroValidationError if the curve is invalid
 */
export function validateSortedCurve(curve: CurvePoint[], curveName: string): void {
  if (curve.length < 2) {
    throw new HydroValidationError(
      `Kurva "${curveName}" membutuhkan minimal 2 titik, diberikan ${curve.length}.`,
      'CURVE_TOO_SHORT',
      { curveName, length: curve.length }
    );
  }

  for (let i = 1; i < curve.length; i++) {
    if (curve[i].x <= curve[i - 1].x) {
      throw new HydroValidationError(
        `Kurva "${curveName}" harus berurutan naik (monotonically increasing). ` +
        `Titik ke-${i} (x=${curve[i].x}) ≤ titik ke-${i - 1} (x=${curve[i - 1].x}).`,
        'CURVE_NOT_SORTED',
        { curveName, indexA: i - 1, indexB: i, valA: curve[i - 1].x, valB: curve[i].x }
      );
    }
  }
}

/**
 * Performs linear interpolation on a sorted curve.
 *
 * Given a sorted array of {x, y} points, finds the y-value corresponding
 * to `targetX` by linear interpolation between the two bracketing points.
 *
 * **Boundary behavior** (clamping — no extrapolation):
 *  - If `targetX ≤ curve[0].x`, returns `curve[0].y`
 *  - If `targetX ≥ curve[last].x`, returns `curve[last].y`
 *
 * @param curve  — Array of {x, y} sorted ascending by x. Min length 2.
 * @param targetX  — The x-value to interpolate.
 * @param curveName — Human-readable label for error messages.
 * @returns Interpolated y-value.
 * @throws HydroValidationError if curve has < 2 points or is not sorted.
 */
export function linearInterpolate(
  curve: CurvePoint[],
  targetX: number,
  curveName = 'curve'
): number {
  validateSortedCurve(curve, curveName);

  // Clamp at boundaries (no extrapolation)
  if (targetX <= curve[0].x) {
    return curve[0].y;
  }
  if (targetX >= curve[curve.length - 1].x) {
    return curve[curve.length - 1].y;
  }

  // Binary search for the bracketing interval
  let lo = 0;
  let hi = curve.length - 1;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (curve[mid].x <= targetX) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const x0 = curve[lo].x;
  const x1 = curve[hi].x;
  const y0 = curve[lo].y;
  const y1 = curve[hi].y;

  // Guard against division by zero (should never happen after validateSortedCurve,
  // but defensive programming requires it)
  const dx = x1 - x0;
  if (dx === 0) {
    return y0;
  }

  const t = (targetX - x0) / dx;
  return y0 + t * (y1 - y0);
}

/**
 * Converts parallel arrays (e.g., elevation[] and storage[]) to CurvePoint[].
 * Validates that both arrays have the same length.
 */
export function toCurvePoints(
  xValues: number[],
  yValues: number[],
  xName = 'x',
  yName = 'y'
): CurvePoint[] {
  if (xValues.length !== yValues.length) {
    throw new HydroValidationError(
      `Array "${xName}" (panjang ${xValues.length}) dan "${yName}" (panjang ${yValues.length}) harus sama panjang.`,
      'ARRAY_LENGTH_MISMATCH',
      { xName, yName, xLength: xValues.length, yLength: yValues.length }
    );
  }
  return xValues.map((x, i) => ({ x, y: yValues[i] }));
}
