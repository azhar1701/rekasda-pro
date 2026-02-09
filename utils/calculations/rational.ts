/**
 * Rational Method Calculations
 * ========================================
 *
 * Hydrological calculations for peak discharge estimation
 * Commonly used in drainage design and flood prediction
 *
 * The Rational Method: Q = 0.278 * C * I * A
 * Where:
 *   Q = Peak discharge (m³/s)
 *   C = Runoff coefficient (0-1, dimensionless)
 *   I = Rainfall intensity (mm/hour)
 *   A = Catchment area (km²)
 *   0.278 = Conversion factor (for metric units)
 *
 * Reference:
 * - Soewarno (1995) "Hydrologi untuk Insinyur"
 * - Sosrodarsono & Takeda (1983) "Hidrologi untuk Pengairan"
 * - Indonesian Ministry of Public Works Standards
 */

import { RationalInputs } from '../../types';
import { HydraulicFormatter } from '../formatting/numbers';

const RATIONAL_CONSTANT = 0.278; // Conversion factor for metric units

/**
 * Calculate time of concentration
 * Time for runoff to travel from farthest point to outlet
 * 
 * Using Kirpich Formula:
 * Tc = 0.01947 * (L^0.77) / (S^0.385)
 * Where:
 *   L = Flow length (m)
 *   S = Slope (m/m)
 *   Tc = Time in minutes
 * 
 * @param flowLength - Distance from farthest point to outlet (m)
 * @param slope - Average catchment slope (m/m)
 * @returns Time of concentration in minutes
 */
export function calculateTimeOfConcentration(
  flowLength: number,
  slope: number
): number {
  if (flowLength <= 0 || slope <= 0) return 0;

  // Kirpich formula
  const Tc = 0.01947 * Math.pow(flowLength, 0.77) / Math.pow(slope, 0.385);
  return Math.max(Tc, 5); // Minimum 5 minutes
}

/**
 * Calculate rainfall intensity using IDF Curve approach
 * (Intensity-Duration-Frequency)
 *
 * Simple formula for Indonesian conditions:
 * I = a / (t + b)
 * Where a & b are region-specific coefficients
 *
 * Common coefficients for Indonesia:
 * - Bandung/Jawa Barat: a ≈ 1500-2000, b ≈ 30-60
 * 
 * @param duration - Rainfall duration in minutes
 * @param designRainfall - 24-hour design rainfall intensity (mm)
 * @returns Rainfall intensity in mm/hour
 */
export function calculateRainfallIntensity(
  duration: number,
  designRainfall: number
): number {
  if (duration <= 0 || designRainfall <= 0) return 0;

  // Simplified formula: I = R24 / (1 + (t/60))
  // More refined formula for Indonesian conditions
  const intensityFactor = 1 + duration / 60; // Simple approach
  return designRainfall / intensityFactor;
}

/**
 * Calculate peak discharge using Rational Method
 * 
 * Q = 0.278 * C * I * A
 * 
 * @param runoffCoefficient - C value (typical: 0.3-0.8)
 * @param rainfallIntensity - I value in mm/hour
 * @param area - Catchment area in km²
 * @returns Peak discharge in m³/s
 * 
 * @example
 * const Q = calculateRationalDischarge(0.75, 150, 0.5);
 * // Q ≈ 16.5 m³/s
 */
export function calculateRationalDischarge(
  runoffCoefficient: number,
  rainfallIntensity: number,
  area: number
): number {
  if (runoffCoefficient < 0 || runoffCoefficient > 1) return 0;
  if (rainfallIntensity <= 0 || area <= 0) return 0;

  return RATIONAL_CONSTANT * runoffCoefficient * rainfallIntensity * area;
}

/**
 * Calculate effective rainfall (excess rainfall)
 * 
 * Pe = C * R
 * Where:
 *   Pe = Effective rainfall (mm)
 *   C = Runoff coefficient
 *   R = Total rainfall (mm)
 */
function calculateEffectiveRainfall(
  runoffCoefficient: number,
  totalRainfall: number
): number {
  return runoffCoefficient * totalRainfall;
}

/**
 * Calculate runoff volume
 * 
 * V_runoff = Pe * A
 * Where Pe = effective rainfall, A = area
 */
function calculateRunoffVolume(
  effectiveRainfall: number,
  area: number
): number {
  // Convert mm rain to m³
  // 1 mm/1000 * area in m²
  const areaM2 = area * 1e6; // Convert km² to m²
  return (effectiveRainfall / 1000) * areaM2;
}

/**
 * Estimate critical rainfall duration
 * For Rational Method, Tc is critical
 */

/**
 * Calculate peak discharge characteristics
 */
export function calculateRational(inputs: RationalInputs) {
  const { runoffCoefficient, area, rainfallDesign, flowLength, catchmentSlope } =
    inputs;

  // ===== INPUT VALIDATION =====
  if (runoffCoefficient < 0 || runoffCoefficient > 1) {
    throw new Error('Runoff coefficient must be between 0 and 1');
  }
  if (area <= 0) {
    throw new Error('Catchment area must be > 0 km²');
  }
  if (rainfallDesign <= 0) {
    throw new Error('Design rainfall must be > 0 mm');
  }
  if (flowLength <= 0) {
    throw new Error('Flow length must be > 0 m');
  }
  if (catchmentSlope <= 0 || catchmentSlope > 1) {
    throw new Error('Slope must be between 0 and 1 m/m');
  }

  // ===== TIME & INTENSITY CALCULATIONS =====
  const timeOfConcentration = calculateTimeOfConcentration(
    flowLength,
    catchmentSlope
  );

  const rainfallIntensity = calculateRainfallIntensity(
    timeOfConcentration,
    rainfallDesign
  );

  // ===== DISCHARGE CALCULATIONS =====
  const peakDischarge = calculateRationalDischarge(
    runoffCoefficient,
    rainfallIntensity,
    area
  );

  // ===== RUNOFF CALCULATIONS =====
  const effectiveRainfall = calculateEffectiveRainfall(
    runoffCoefficient,
    rainfallDesign
  );

  const runoffVolume = calculateRunoffVolume(effectiveRainfall, area);

  // ===== RUNOFF RATE & CHARACTERISTICS =====
  const runoffRate = (peakDischarge / (area * 1e6)) * 1000; // mm per event
  const specificDischarge = peakDischarge / area; // m³/s per km²

  // ===== FLOW VERIFICATION =====
  // Check if result is reasonable
  let flowQuality = 'Normal';
  if (peakDischarge < 0.1) flowQuality = 'Very small (check inputs)';
  else if (peakDischarge > 500) flowQuality = 'Very large (verify inputs)';

  // ===== RETURN RESULTS =====
  return {
    // Time & Intensity
    TimeOfConcentration: timeOfConcentration.toFixed(1),
    RainfallIntensity: HydraulicFormatter.rainfall(rainfallIntensity),
    EffectiveRainfall: HydraulicFormatter.rainfall(effectiveRainfall),

    // Discharge & Volume
    PeakDischarge: HydraulicFormatter.discharge(peakDischarge),
    RunoffVolume: runoffVolume.toFixed(0),
    SpecificDischarge: specificDischarge.toFixed(3),

    // Status & Quality
    FlowQuality: flowQuality,

    // Additional Parameters
    RunoffRate: HydraulicFormatter.rainfall(runoffRate),
    AverageCatchmentSlope: (catchmentSlope * 100).toFixed(2) + '%',
    DesignStorm24h: HydraulicFormatter.rainfall(rainfallDesign),
  };
}

export type RationalResults = ReturnType<typeof calculateRational>;
