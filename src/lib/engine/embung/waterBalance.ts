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

import { HydroValidationError } from '@/features/embung/types/embung.types';

// ---------------------------------------------------------------------------
// Input Validation
// ---------------------------------------------------------------------------

// 


// ---------------------------------------------------------------------------
// Core Simulation
// ---------------------------------------------------------------------------

/** Output per bulan untuk simulateReservoirOperation */
export interface ReservoirOperationStep {
  period: number;
  initialStorage: number;
  inflow: number;
  demand: number;
  evaporation: number;
  infiltration: number;
  finalStorage: number;
  spillVolume: number;
  deficitVolume: number;
  actualRelease: number;
  status: 'Surplus' | 'Defisit' | 'Limpasan' | 'Normal';
}

/** Result untuk Operation Simulation */
export interface ReservoirOperationResult {
  steps: ReservoirOperationStep[];
  totalSpill: number;
  totalDeficit: number;
  reliability: number;
}

/**
 * Menyimulasikan Pola Operasi Waduk dengan persamaan Neraca Air Langkah Waktu
 *
 * **Metode**: Persamaan Neraca Air Langkah Waktu
 * **Rumus Utama**: S_t = S_{t-1} + (I - R - O_target - (E_o - E_a)*A) * dt
 * Disederhanakan untuk array volume parameter masukan:
 *   S_t = S_{t-1} + Inflow - Demand - Evaporation - Infiltration
 *
 * **Batasan**:
 * - Jika S_t > sMax, Limpasan = S_t - sMax, S_t = sMax
 * - Jika S_t < sMin, Defisit = sMin - S_t, S_t = sMin
 *
 * @param initialStorage Volume awal waduk (misal m³)
 * @param inflows Array volume inflow (I * dt)
 * @param demands Array volume kebutuhan air/target release (O_target * dt)
 * @param evaporation Array volume evaporasi netto ((E_o - E_a)*A * dt)
 * @param infiltration Array volume infiltrasi/rembesan
 * @param sMax Kapasitas Aktif Maksimum (m³)
 * @param sMin Tampungan Mati (m³)
 */
export function simulateReservoirOperation(
  initialStorage: number,
  inflows: number[],
  demands: number[],
  evaporation: number[],
  infiltration: number[],
  sMax: number,
  sMin: number
): ReservoirOperationResult {
  
  if (inflows.length !== demands.length || inflows.length !== evaporation.length || inflows.length !== infiltration.length) {
    throw new HydroValidationError('Panjang array inflow, demand, evaporation, dan infiltration harus sama.', 'ARRAY_LENGTH_MISMATCH');
  }

  let currentStorage = initialStorage;
  const steps: ReservoirOperationStep[] = [];
  let totalSpill = 0;
  let totalDeficit = 0;
  let fulfilledPeriods = 0;

  for (let t = 0; t < inflows.length; t++) {
    const I = inflows[t];
    const D = demands[t]; // O_target
    const E = evaporation[t];
    const Inf = infiltration[t];

    const storageStart = currentStorage;
    
    // S_t = S_{t-1} + Inflow - Demand - Evap - Infil
    let S_t = currentStorage + I - D - E - Inf;
    
    let spill = 0;
    let deficit = 0;
    let actualRelease = D;

    // Batasan 1: Jika S_t > S_max, terjadi Limpasan (Spill)
    if (S_t > sMax) {
      spill = S_t - sMax;
      S_t = sMax;
    }

    // Batasan 2: Jika S_t < S_min, terjadi Defisit
    if (S_t < sMin) {
      deficit = sMin - S_t;
      S_t = sMin;
      actualRelease = Math.max(0, D - deficit);
    }

    // Penentuan Status
    let status: 'Surplus' | 'Defisit' | 'Limpasan' | 'Normal' = 'Normal';
    if (spill > 0) status = 'Limpasan';
    else if (deficit > 0) status = 'Defisit';
    else if (actualRelease >= D && S_t > sMin * 1.5) status = 'Surplus';

    if (deficit === 0) fulfilledPeriods++;
    totalSpill += spill;
    totalDeficit += deficit;

    steps.push({
      period: t,
      initialStorage: storageStart,
      inflow: I,
      demand: D,
      evaporation: E,
      infiltration: Inf,
      finalStorage: S_t,
      spillVolume: spill,
      deficitVolume: deficit,
      actualRelease,
      status
    });

    currentStorage = S_t;
  }

  return {
    steps,
    totalSpill,
    totalDeficit,
    reliability: inflows.length > 0 ? (fulfilledPeriods / inflows.length) * 100 : 0
  };
}
