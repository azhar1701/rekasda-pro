/**
 * =============================================================================
 * Flood Routing Service — Level-Pool (Storage) Routing
 * =============================================================================
 * Implements the continuity equation for reservoir routing:
 *   (I₁ + I₂)/2 - (O₁ + O₂)/2 = (S₂ - S₁) / Δt
 *
 * Uses linear interpolation on Stage-Storage and Stage-Discharge curves.
 *
 * Referensi: Modul 6 Analisis Hidrologi PUPR — Penelusuran Banjir
 * =============================================================================
 */

import {
  HydroValidationError,
  type FloodRoutingInput,
  type FloodRoutingResult,
  type RoutingTimeStep,
  type CurvePoint,
} from '@/features/embung/types/embung.types';
import { linearInterpolate, toCurvePoints } from './mathUtils';

// ---------------------------------------------------------------------------
// Input Validation
// ---------------------------------------------------------------------------

function validateRoutingInput(input: FloodRoutingInput): void {
  if (input.inflowHydrograph.length < 2) {
    throw new HydroValidationError(
      'Hidrograf inflow membutuhkan minimal 2 titik.',
      'INFLOW_TOO_SHORT',
      { length: input.inflowHydrograph.length }
    );
  }

  // Check time is sorted ascending
  for (let i = 1; i < input.inflowHydrograph.length; i++) {
    if (input.inflowHydrograph[i].time <= input.inflowHydrograph[i - 1].time) {
      throw new HydroValidationError(
        `Hidrograf inflow harus berurutan waktu naik. Titik ke-${i} tidak valid.`,
        'INFLOW_NOT_SORTED',
        { index: i }
      );
    }
  }

  if (input.deltaT <= 0) {
    throw new HydroValidationError(
      'Δt harus bernilai positif.',
      'INVALID_DELTA_T',
      { deltaT: input.deltaT }
    );
  }

  const { stageStorageCurve, stageDischargeCurve } = input;

  if (stageStorageCurve.elevation.length !== stageStorageCurve.storage.length) {
    throw new HydroValidationError(
      'Panjang array elevation dan storage pada Stage-Storage Curve harus sama.',
      'CURVE_LENGTH_MISMATCH'
    );
  }

  if (stageStorageCurve.elevation.length !== stageStorageCurve.area.length) {
    throw new HydroValidationError(
      'Panjang array elevation dan area pada Stage-Storage Curve harus sama.',
      'CURVE_LENGTH_MISMATCH'
    );
  }

  if (stageDischargeCurve.elevation.length !== stageDischargeCurve.discharge.length) {
    throw new HydroValidationError(
      'Panjang array elevation dan discharge pada Stage-Discharge Curve harus sama.',
      'CURVE_LENGTH_MISMATCH'
    );
  }
}

// ---------------------------------------------------------------------------
// Core Routing Algorithm
// ---------------------------------------------------------------------------

/**
 * Interpolate storage from elevation using the Stage-Storage Curve.
 */
function storageFromElevation(
  elevStorageCurve: CurvePoint[],
  elevation: number
): number {
  return linearInterpolate(elevStorageCurve, elevation, 'Elevasi-Tampungan');
}

/**
 * Interpolate outflow from elevation using the Stage-Discharge Curve.
 */
function outflowFromElevation(
  elevDischargeCurve: CurvePoint[],
  elevation: number
): number {
  return linearInterpolate(elevDischargeCurve, elevation, 'Elevasi-Outflow');
}



/**
 * Get inflow at arbitrary time by interpolating the hydrograph.
 */
function inflowAtTime(
  hydrographCurve: CurvePoint[],
  time: number
): number {
  return linearInterpolate(hydrographCurve, time, 'Hidrograf Inflow');
}

/**
 * Performs Level-Pool (Storage) Routing.
 *
 * **Algorithm** (Modified Puls Method):
 *
 * The continuity equation is rearranged as:
 *   (2S₂/Δt + O₂) = (I₁ + I₂) + (2S₁/Δt - O₁)
 *
 * We build an auxiliary curve: f(elevation) = 2S/Δt + O
 * Then solve iteratively for each time step.
 *
 * @param input — All required routing inputs with curves and hydrograph.
 * @returns FloodRoutingResult containing step-by-step results and peaks.
 */
export function calculateFloodRouting(input: FloodRoutingInput): FloodRoutingResult {
  validateRoutingInput(input);

  const { inflowHydrograph, stageStorageCurve, stageDischargeCurve, deltaT, initialElevation } = input;

  // Build CurvePoint arrays from parallel arrays
  const elevStorageCurve = toCurvePoints(
    stageStorageCurve.elevation,
    stageStorageCurve.storage,
    'elevation', 'storage'
  );


  const elevDischargeCurve = toCurvePoints(
    stageDischargeCurve.elevation,
    stageDischargeCurve.discharge,
    'elevation', 'discharge'
  );

  // Build the auxiliary curve: elevation → (2S/Δt + O)
  const auxiliaryCurve: CurvePoint[] = stageStorageCurve.elevation.map((elev, i) => {
    const S = stageStorageCurve.storage[i];
    const O = outflowFromElevation(elevDischargeCurve, elev);
    return { x: 2 * S / deltaT + O, y: elev };
  });

  // Build inflow hydrograph as CurvePoint
  const hydrographCurve: CurvePoint[] = inflowHydrograph.map(p => ({
    x: p.time,
    y: p.discharge,
  }));

  // Initial conditions
  const endTime = inflowHydrograph[inflowHydrograph.length - 1].time;
  let currentElevation = initialElevation;
  let currentStorage = storageFromElevation(elevStorageCurve, currentElevation);
  let currentOutflow = outflowFromElevation(elevDischargeCurve, currentElevation);

  const steps: RoutingTimeStep[] = [];
  let peakInflow = 0;
  let peakOutflow = 0;
  let maxElevation = currentElevation;
  let maxStorage = currentStorage;

  // Record initial condition
  steps.push({
    time: 0,
    inflowAvg: inflowAtTime(hydrographCurve, 0),
    outflow: currentOutflow,
    storage: currentStorage,
    elevation: currentElevation,
  });

  // Route through each time step
  for (let t = deltaT; t <= endTime; t += deltaT) {
    const I1 = inflowAtTime(hydrographCurve, t - deltaT);
    const I2 = inflowAtTime(hydrographCurve, t);
    const Iavg = (I1 + I2) / 2;

    // LHS of rearranged continuity:
    // (2S₂/Δt + O₂) = (I₁ + I₂) + (2S₁/Δt - O₁)
    const rhs = (I1 + I2) + (2 * currentStorage / deltaT - currentOutflow);

    // Find elevation that gives (2S/Δt + O) = rhs
    const newElevation = linearInterpolate(auxiliaryCurve, rhs, 'Auxiliary (2S/Δt+O)');
    const newStorage = storageFromElevation(elevStorageCurve, newElevation);
    const newOutflow = outflowFromElevation(elevDischargeCurve, newElevation);

    steps.push({
      time: t,
      inflowAvg: Iavg,
      outflow: newOutflow,
      storage: newStorage,
      elevation: newElevation,
    });

    // Track peaks
    if (Iavg > peakInflow) peakInflow = Iavg;
    if (newOutflow > peakOutflow) peakOutflow = newOutflow;
    if (newElevation > maxElevation) maxElevation = newElevation;
    if (newStorage > maxStorage) maxStorage = newStorage;

    // Update for next step
    currentElevation = newElevation;
    currentStorage = newStorage;
    currentOutflow = newOutflow;
  }

  // Also check initial inflow
  const initialInflow = inflowAtTime(hydrographCurve, 0);
  if (initialInflow > peakInflow) peakInflow = initialInflow;

  const attenuationRatio = peakInflow > 0 ? 1 - peakOutflow / peakInflow : 0;

  return {
    steps,
    peakInflow,
    peakOutflow,
    maxElevation,
    maxStorage,
    attenuationRatio,
  };
}
