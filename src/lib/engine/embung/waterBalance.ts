/**
 * =============================================================================
 * Water Balance Service — Reservoir Operation Simulation
 * =============================================================================
 * Sₜ = Sₜ₋₁ + (I - R - Ot - L + K) × Δt
 *
 * Where:
 *   I  = Inflow
 *   R  = Release / Demand
 *   Ot = Overflow (spillway)
 *   L  = Losses (evaporation + seepage)
 *   K  = Gains (rainfall on reservoir surface)
 *
 * Referensi: Modul 6 Analisis Hidrologi PUPR — Simulasi Pola Operasi
 * =============================================================================
 */

import {
  HydroValidationError,
  type WaterBalanceConfig,
  type WaterBalanceStepInput,
  type WaterBalanceTimeStep,
  type WaterBalanceResult,
} from '@/features/embung/types/embung.types';

// ---------------------------------------------------------------------------
// Input Validation
// ---------------------------------------------------------------------------

function validateConfig(config: WaterBalanceConfig): void {
  if (config.maxStorage <= 0) {
    throw new HydroValidationError(
      'Kapasitas maksimum waduk harus positif.',
      'INVALID_MAX_STORAGE',
      { maxStorage: config.maxStorage }
    );
  }
  if (config.deadStorage < 0) {
    throw new HydroValidationError(
      'Tampungan mati tidak boleh negatif.',
      'INVALID_DEAD_STORAGE',
      { deadStorage: config.deadStorage }
    );
  }
  if (config.deadStorage >= config.maxStorage) {
    throw new HydroValidationError(
      'Tampungan mati harus lebih kecil dari kapasitas maksimum.',
      'DEAD_EXCEEDS_MAX',
      { deadStorage: config.deadStorage, maxStorage: config.maxStorage }
    );
  }
  if (config.initialStorage < config.deadStorage || config.initialStorage > config.maxStorage) {
    throw new HydroValidationError(
      `Tampungan awal (${config.initialStorage}) harus antara dead storage (${config.deadStorage}) dan max storage (${config.maxStorage}).`,
      'INVALID_INITIAL_STORAGE'
    );
  }
  if (config.surfaceArea <= 0) {
    throw new HydroValidationError(
      'Luas permukaan waduk harus positif.',
      'INVALID_SURFACE_AREA',
      { surfaceArea: config.surfaceArea }
    );
  }
}

function validateSteps(steps: WaterBalanceStepInput[]): void {
  if (steps.length === 0) {
    throw new HydroValidationError(
      'Data neraca air tidak boleh kosong.',
      'EMPTY_STEPS'
    );
  }
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].inflow < 0) {
      throw new HydroValidationError(
        `Inflow pada periode ${i} tidak boleh negatif.`,
        'NEGATIVE_INFLOW',
        { period: i }
      );
    }
    if (steps[i].demand < 0) {
      throw new HydroValidationError(
        `Demand pada periode ${i} tidak boleh negatif.`,
        'NEGATIVE_DEMAND',
        { period: i }
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Core Simulation
// ---------------------------------------------------------------------------

/**
 * Runs a Water Balance simulation over the given time steps.
 *
 * **Logic per period:**
 * 1. Compute gains: rainfall (mm → m³) = rainfall / 1000 × surfaceArea
 * 2. Compute losses: evaporation (mm → m³) + seepage
 * 3. Available = storageStart + inflow + rainfallGain - evapLoss - seepage
 * 4. Release = min(demand, available - deadStorage)  (can't go below dead)
 * 5. If remaining > maxStorage → overflow = remaining - maxStorage
 * 6. storageEnd = clamp(remaining, deadStorage, maxStorage)
 *
 * @param config — Reservoir parameters.
 * @param steps — Per-period hydrological data.
 * @returns WaterBalanceResult with all steps and aggregate metrics.
 */
export function calculateWaterBalance(
  config: WaterBalanceConfig,
  steps: WaterBalanceStepInput[]
): WaterBalanceResult {
  validateConfig(config);
  validateSteps(steps);

  const seepagePerStep = config.seepageLoss ?? 0;
  let currentStorage = config.initialStorage;
  let totalOverflow = 0;
  let totalDeficit = 0;
  let fulfilledPeriods = 0;

  const results: WaterBalanceTimeStep[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const storageStart = currentStorage;

    // Convert mm to m³
    const rainfallGain = (step.rainfall / 1000) * config.surfaceArea;
    const evaporationLoss = (step.evaporation / 1000) * config.surfaceArea;

    // Net available water
    const available = storageStart + step.inflow + rainfallGain - evaporationLoss - seepagePerStep;

    // Determine release (can't draw below dead storage)
    const maxReleasable = Math.max(available - config.deadStorage, 0);
    const release = Math.min(step.demand, maxReleasable);
    const deficit = step.demand - release;

    // Storage after release
    let storageAfterRelease = available - release;

    // Overflow check
    let overflow = 0;
    if (storageAfterRelease > config.maxStorage) {
      overflow = storageAfterRelease - config.maxStorage;
      storageAfterRelease = config.maxStorage;
    }

    // Clamp to dead storage (shouldn't go below due to logic above, but defensive)
    const storageEnd = Math.max(storageAfterRelease, config.deadStorage);

    // Determine status
    let status: WaterBalanceTimeStep['status'];
    if (overflow > 0) {
      status = 'spill';
    } else if (deficit > 0) {
      status = 'deficit';
    } else if (release >= step.demand && storageEnd > config.deadStorage * 1.5) {
      status = 'surplus';
    } else {
      status = 'normal';
    }

    if (deficit === 0) {
      fulfilledPeriods++;
    }

    totalOverflow += overflow;
    totalDeficit += deficit;

    results.push({
      period: i,
      storageStart,
      inflow: step.inflow,
      release,
      deficit,
      rainfallGain,
      evaporationLoss,
      seepageLoss: seepagePerStep,
      overflow,
      storageEnd,
      status,
    });

    currentStorage = storageEnd;
  }

  return {
    steps: results,
    totalOverflow,
    totalDeficit,
    reliability: (fulfilledPeriods / steps.length) * 100,
  };
}
