/**
 * =============================================================================
 * Sedimentation Service — Sediment Yield Calculation
 * =============================================================================
 * Converts suspended sediment concentration (mg/L) and discharge (m³/s)
 * into sediment load (tonnes/year), volume (m³/year), specific yield,
 * erosion rate (mm/year), and estimated reservoir useful life.
 *
 * Referensi: Modul 6 Analisis Hidrologi PUPR — Perkiraan Sedimen
 * =============================================================================
 */

import {
  HydroValidationError,
  type SedimentationInput,
  type SedimentYieldResult,
  type SedimentSampleDetail,
} from '@/features/embung/types/embung.types';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateInput(input: SedimentationInput): void {
  if (input.samples.length === 0) {
    throw new HydroValidationError(
      'Minimal 1 sampel sedimen diperlukan.',
      'EMPTY_SAMPLES'
    );
  }

  if (input.bulkDensity <= 0) {
    throw new HydroValidationError(
      `Berat jenis bulk sedimen harus positif (diberikan: ${input.bulkDensity}).`,
      'INVALID_BULK_DENSITY',
      { bulkDensity: input.bulkDensity }
    );
  }

  if (input.catchmentArea <= 0) {
    throw new HydroValidationError(
      `Luas DAS harus positif (diberikan: ${input.catchmentArea}).`,
      'INVALID_CATCHMENT_AREA',
      { catchmentArea: input.catchmentArea }
    );
  }

  if (input.activeStorage <= 0) {
    throw new HydroValidationError(
      `Tampungan aktif harus positif (diberikan: ${input.activeStorage}).`,
      'INVALID_ACTIVE_STORAGE',
      { activeStorage: input.activeStorage }
    );
  }

  if (input.trapEfficiency <= 0 || input.trapEfficiency > 1) {
    throw new HydroValidationError(
      `Trap efficiency harus antara 0 (eksklusif) dan 1 (inklusif). Diberikan: ${input.trapEfficiency}.`,
      'INVALID_TRAP_EFFICIENCY',
      { trapEfficiency: input.trapEfficiency }
    );
  }

  for (let i = 0; i < input.samples.length; i++) {
    const s = input.samples[i];
    if (s.concentration < 0) {
      throw new HydroValidationError(
        `Konsentrasi sedimen pada sampel ${i} tidak boleh negatif.`,
        'NEGATIVE_CONCENTRATION',
        { sampleIndex: i }
      );
    }
    if (s.discharge < 0) {
      throw new HydroValidationError(
        `Debit pada sampel ${i} tidak boleh negatif.`,
        'NEGATIVE_DISCHARGE',
        { sampleIndex: i }
      );
    }
    if (s.duration <= 0) {
      throw new HydroValidationError(
        `Durasi pada sampel ${i} harus positif.`,
        'INVALID_DURATION',
        { sampleIndex: i }
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Core Calculation
// ---------------------------------------------------------------------------

/**
 * Calculates sediment yield from field samples.
 *
 * **Steps per sample:**
 * 1. Transport rate (kg/s) = concentration (mg/L) × discharge (m³/s) × 10⁻³
 *    (since 1 mg/L = 1 g/m³ → ×10⁻³ = kg/m³ × m³/s = kg/s)
 * 2. Total mass (tonnes) = transport rate (kg/s) × duration (s) × 10⁻³
 *
 * **Aggregation:**
 * 3. Sum total mass from all samples → total load (tonnes/year)
 * 4. Apply trap efficiency → trapped load
 * 5. Volume (m³/year) = trapped load / bulk density
 * 6. Specific yield = total load / catchment area (tonnes/km²/year)
 * 7. Erosion rate (mm/year) = volume / (catchmentArea × 10⁶) × 10³
 * 8. Useful life (years) = active storage / volume
 */
export function calculateSedimentYield(input: SedimentationInput): SedimentYieldResult {
  validateInput(input);

  const sampleDetails: SedimentSampleDetail[] = [];
  let totalMassTonnes = 0;

  for (const sample of input.samples) {
    // mg/L × m³/s = mg⋅m³/(L⋅s) = g/s (since 1 mg/L = 1 g/m³)
    // then ÷ 1000 = kg/s
    const transportRateKgPerSec = (sample.concentration * sample.discharge) / 1000;

    // kg/s × s = kg, then ÷ 1000 = tonnes
    const totalMass = (transportRateKgPerSec * sample.duration) / 1000;

    sampleDetails.push({
      transportRate: transportRateKgPerSec,
      totalMass,
    });

    totalMassTonnes += totalMass;
  }

  // Apply trap efficiency
  const trappedLoadTonnes = totalMassTonnes * input.trapEfficiency;

  // Convert to volume: tonnes / (tonnes/m³) = m³
  const totalVolumeM3PerYear = trappedLoadTonnes / input.bulkDensity;

  // Specific yield: tonnes / km²
  const specificYield = totalMassTonnes / input.catchmentArea;

  // Erosion rate: volume ÷ (area in m²) → m/year → ×1000 = mm/year
  // catchmentArea is in km², so km² × 10⁶ = m²
  const erosionRate = (totalVolumeM3PerYear / (input.catchmentArea * 1e6)) * 1000;

  // Useful life: activeStorage (m³) / annual sedimentation volume (m³/year)
  const reservoirUsefulLife = totalVolumeM3PerYear > 0
    ? input.activeStorage / totalVolumeM3PerYear
    : Infinity;

  return {
    totalLoadTonnesPerYear: totalMassTonnes,
    totalVolumeM3PerYear,
    specificYield,
    erosionRate,
    reservoirUsefulLife,
    sampleDetails,
  };
}
