/**
 * Rational Method Engine - Production Grade
 * ==========================================
 * 
 * Mathematical implementation of the Rational Method for peak discharge calculation.
 * Strictly compliant with SNI 2415:2016 and Permen PU No. 12/PRT/M/2014.
 * 
 * @module RationalMethodEngine
 * @standard SNI 2415:2016 Pasal 5.2
 * @standard Permen PU No. 12/PRT/M/2014
 * @author RekaSDA Engineering Team
 */

import { z } from 'zod';
import { SNI_VALIDATION_LIMITS } from '../constants/sni';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Rational Method Input Parameters
 * All units must be in metric system as specified
 */
export interface RationalMethodInput {
  /** Runoff Coefficient (Koefisien Pengaliran) - Dimensionless [0-1] */
  C: number;
  /** Rainfall Intensity (Intensitas Hujan) - mm/hour */
  I: number;
  /** Catchment Area (Luas DAS) - Hectares (Ha) */
  A: number;
}

/**
 * Time of Concentration Input Parameters
 */
export interface TcInput {
  /** Flow Length (Panjang Aliran) - km */
  L: number;
  /** Flow Velocity Coefficient (Koefisien Kecepatan) - m/s */
  K: number;
}

/**
 * Rational Method Calculation Result
 */
export interface RationalMethodOutput {
  /** Peak Discharge (Debit Puncak) - m³/s */
  Q: number;
  /** Specific Discharge per hectare - m³/s/Ha */
  qSpecific: number;
  /** Validation warnings if any */
  warnings: string[];
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod Schema for Rational Method Input Validation
 * Enforces SNI 2415:2016 compliance at runtime
 */
export const RationalInputSchema = z.object({
  C: z
    .number()
    .min(SNI_VALIDATION_LIMITS.runoffCoefficient.min, 'Koefisien C harus ≥ 0')
    .max(SNI_VALIDATION_LIMITS.runoffCoefficient.max, 'Koefisien C harus ≤ 1')
    .refine((val) => val >= 0 && val <= 1, {
      message: 'Koefisien pengaliran (C) harus antara 0.0 dan 1.0',
    }),
  I: z
    .number()
    .positive('Intensitas hujan harus > 0')
    .min(SNI_VALIDATION_LIMITS.rainfallIntensity.min, 'Intensitas hujan terlalu rendah')
    .max(SNI_VALIDATION_LIMITS.rainfallIntensity.max, 'Intensitas hujan tidak realistis (>500 mm/jam)'),
  A: z
    .number()
    .positive('Luas DAS harus > 0')
    .min(0.01, 'Luas DAS minimal 0.01 Ha')
    .max(50000, 'Luas DAS maksimal 50,000 Ha untuk Metode Rasional'),
});

/**
 * Zod Schema for Time of Concentration Input
 */
export const TcInputSchema = z.object({
  L: z.number().positive('Panjang aliran harus > 0').max(100, 'Panjang aliran maksimal 100 km'),
  K: z.number().positive('Koefisien kecepatan harus > 0').max(10, 'Koefisien kecepatan maksimal 10 m/s'),
});

// ============================================================================
// CORE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate Time of Concentration (Waktu Konsentrasi)
 * 
 * Formula: Tc = L / (60 × K)
 * 
 * Where:
 * - Tc = Time of concentration (hours)
 * - L = Flow length from farthest point to outlet (km)
 * - K = Flow velocity coefficient (m/s)
 * - 60 = Conversion factor (minutes to hours)
 * 
 * @param input - Time of concentration parameters
 * @returns Time of concentration in hours
 * @throws {z.ZodError} If input validation fails
 * 
 * @reference SNI 2415:2016 Pasal 5.3
 * @example
 * ```typescript
 * const tc = calculateTc({ L: 2.5, K: 1.2 });
 * // tc = 0.0347 hours (≈ 2.08 minutes)
 * ```
 */
export function calculateTc(input: TcInput): number {
  const validated = TcInputSchema.parse(input);
  
  // Tc = L / (60 * K)
  // Result in hours
  const tc = validated.L / (60 * validated.K);
  
  return tc;
}

/**
 * Calculate Peak Discharge using Rational Method
 * 
 * Formula: Q = 0.00278 × C × I × A
 * 
 * Where:
 * - Q = Peak discharge (m³/s)
 * - C = Runoff coefficient (dimensionless, 0-1)
 * - I = Rainfall intensity (mm/hour)
 * - A = Catchment area (Hectares)
 * - 0.00278 = Conversion factor for metric units (Ha to km²)
 * 
 * Note: 0.00278 = 1/360 = conversion from (mm/hr × Ha) to m³/s
 * Alternative: 0.278 when A is in km² (1 km² = 100 Ha)
 * 
 * @param input - Rational method parameters
 * @returns Calculation result with discharge and warnings
 * @throws {z.ZodError} If input validation fails
 * 
 * @reference SNI 2415:2016 Pasal 5.2
 * @reference Permen PU No. 12/PRT/M/2014 Lampiran A
 * 
 * @example
 * ```typescript
 * const result = calculateRationalDischarge({
 *   C: 0.75,
 *   I: 100,
 *   A: 250
 * });
 * // result.Q ≈ 52.125 m³/s
 * ```
 */
export function calculateRationalDischarge(input: RationalMethodInput): RationalMethodOutput {
  // Validate input using Zod schema
  const validated = RationalInputSchema.parse(input);
  
  const warnings: string[] = [];
  
  // Check catchment area suitability for Rational Method
  // SNI 2415:2016: Rational Method is suitable for A < 5000 Ha
  if (validated.A > 5000) {
    warnings.push(
      'Peringatan: Metode Rasional kurang akurat untuk DAS > 5000 Ha. ' +
      'Disarankan menggunakan metode HSS (Hidrograf Satuan Sintetik).'
    );
  } else if (validated.A > 300) {
    warnings.push(
      'Peringatan: Metode Rasional kurang akurat untuk DAS > 300 Ha. ' +
      'Pertimbangkan menggunakan metode HSS untuk hasil lebih akurat.'
    );
  }
  
  // Check runoff coefficient reasonableness
  if (validated.C < 0.1) {
    warnings.push('Koefisien C sangat rendah. Pastikan tata guna lahan sudah sesuai.');
  } else if (validated.C > 0.9) {
    warnings.push('Koefisien C sangat tinggi. Pastikan area sebagian besar kedap air.');
  }
  
  // Check rainfall intensity reasonableness
  if (validated.I > 200) {
    warnings.push('Intensitas hujan sangat tinggi (>200 mm/jam). Verifikasi data hujan rencana.');
  }
  
  // CRITICAL CALCULATION
  // Q = 0.00278 × C × I × A
  // Where A is in Hectares
  const Q = 0.00278 * validated.C * validated.I * validated.A;
  
  // Calculate specific discharge (per hectare)
  const qSpecific = Q / validated.A;
  
  return {
    Q: parseFloat(Q.toFixed(3)),
    qSpecific: parseFloat(qSpecific.toFixed(6)),
    warnings,
  };
}

/**
 * Validate Rational Method Input
 * 
 * Performs validation without executing calculation.
 * Useful for form validation before submission.
 * 
 * @param input - Input parameters to validate
 * @returns Validation result with success status and error messages
 * 
 * @example
 * ```typescript
 * const validation = validateRationalInput({ C: 0.75, I: 100, A: 250 });
 * if (!validation.success) {
 *   console.error(validation.errors);
 * }
 * ```
 */
export function validateRationalInput(input: RationalMethodInput): {
  success: boolean;
  errors: string[];
} {
  try {
    RationalInputSchema.parse(input);
    return { success: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Convert Area from km² to Hectares
 * 
 * @param areaKm2 - Area in square kilometers
 * @returns Area in hectares
 */
export function convertKm2ToHa(areaKm2: number): number {
  return areaKm2 * 100;
}

/**
 * Convert Area from Hectares to km²
 * 
 * @param areaHa - Area in hectares
 * @returns Area in square kilometers
 */
export function convertHaToKm2(areaHa: number): number {
  return areaHa / 100;
}
