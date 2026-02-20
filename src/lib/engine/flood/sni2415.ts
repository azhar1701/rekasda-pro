/**
 * SNI 2415:2016 Flood Discharge Calculation Engine
 * =================================================
 * 
 * Strictly compliant implementation of flood discharge calculations
 * per SNI 2415:2016 (Tata Cara Perhitungan Debit Banjir Rencana).
 * 
 * @module SNI2415Engine
 * @standard SNI 2415:2016
 * @author RekaSDA Engineering Team
 */

import { z } from 'zod';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type FloodMethod = 'RATIONAL' | 'HSS_NAKAYASU';

export interface MethodRecommendation {
  recommended: FloodMethod;
  isValid: boolean;
  warnings: string[];
  compliance: {
    sniReference: string;
    areaLimit: number;
    areaUnit: string;
  };
}

export interface RationalMethodInput {
  /** Koefisien Pengaliran (Runoff Coefficient) - Dimensionless [0-1] */
  C: number;
  /** Intensitas Hujan (Rainfall Intensity) - mm/jam */
  I: number;
  /** Luas Daerah Aliran Sungai (Catchment Area) - km² */
  A: number;
}

export interface HSSNakayasuInput {
  /** Luas DAS (Catchment Area) - km² */
  A: number;
  /** Panjang Sungai Utama (Main River Length) - km */
  L: number;
  /** Hujan Efektif (Effective Rainfall) - mm */
  Ro: number;
  /** Durasi Hujan Satuan (Unit Rainfall Duration) - jam */
  Tr: number;
  /** Parameter Hidrograf (Hydrograph Parameter) - dimensionless [1.5-3.0] */
  alpha?: number;
}

export interface RationalMethodOutput {
  /** Debit Puncak (Peak Discharge) - m³/s */
  Q: number;
  /** Debit Spesifik (Specific Discharge) - m³/s/km² */
  qSpecific: number;
  method: 'RATIONAL';
  sniCompliance: boolean;
}

export interface HSSNakayasuOutput {
  /** Debit Puncak (Peak Discharge) - m³/s */
  Qp: number;
  /** Waktu Puncak (Time to Peak) - jam */
  Tp: number;
  /** Waktu Dasar (Base Time) - jam */
  Tb: number;
  /** Waktu Kelambatan (Time Lag) - jam */
  Tg: number;
  /** Waktu Menurun (Recession Time) - jam */
  T03: number;
  method: 'HSS_NAKAYASU';
  sniCompliance: boolean;
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Rational Method Input Schema
 * SNI 2415:2016 Pasal 5.2
 */
export const RationalInputSchema = z.object({
  C: z
    .number()
    .min(0, 'Koefisien C harus ≥ 0')
    .max(1, 'Koefisien C harus ≤ 1'),
  I: z
    .number()
    .positive('Intensitas hujan harus > 0')
    .max(500, 'Intensitas hujan tidak realistis (>500 mm/jam)'),
  A: z
    .number()
    .positive('Luas DAS harus > 0')
    .max(30, 'Metode Rasional: Luas DAS maksimal 30 km² (3000 Ha) sesuai SNI 2415:2016'),
});

/**
 * HSS Nakayasu Input Schema
 * SNI 2415:2016 Pasal 6.3
 */
export const HSSNakayasuInputSchema = z.object({
  A: z
    .number()
    .positive('Luas DAS harus > 0')
    .max(10000, 'Luas DAS maksimal 10,000 km²'),
  L: z
    .number()
    .positive('Panjang sungai harus > 0')
    .max(1000, 'Panjang sungai maksimal 1000 km'),
  Ro: z
    .number()
    .positive('Hujan efektif harus > 0')
    .max(200, 'Hujan efektif maksimal 200 mm'),
  Tr: z
    .number()
    .positive('Durasi hujan harus > 0')
    .max(24, 'Durasi hujan maksimal 24 jam'),
  alpha: z
    .number()
    .min(1.5, 'Parameter alpha minimal 1.5')
    .max(3.0, 'Parameter alpha maksimal 3.0')
    .optional()
    .default(2.0),
});

// ============================================================================
// SNI 2415:2016 WORKFLOW VALIDATION
// ============================================================================

/**
 * Determine Recommended Method Based on Catchment Area
 * 
 * SNI 2415:2016 Pasal 3.1 & Praktik Empiris Indonesia:
 * - Metode Rasional: A ≤ 3 km² (300 Ha)
 * - Metode Haspers/Weduwen: 3 km² < A ≤ 100 km²
 * - Metode Melchior: A > 100 km²
 * - HSS: A > 3 km² (untuk analisis hidrograf lengkap)
 * 
 * @param areaKm2 - Luas DAS dalam km²
 * @returns Method recommendation with compliance status
 * 
 * @reference SNI 2415:2016 Pasal 3.1
 */
export function useSNI2415Workflow(areaKm2: number): MethodRecommendation {
  const areaHa = areaKm2 * 100;
  const warnings: string[] = [];
  
  // SNI 2415:2016 Pasal 3.1: Rational Method limit
  const RATIONAL_LIMIT_HA = 300;
  const RATIONAL_LIMIT_KM2 = 3;
  
  if (areaKm2 <= RATIONAL_LIMIT_KM2) {
    // Rational Method is valid
    return {
      recommended: 'RATIONAL',
      isValid: true,
      warnings: [],
      compliance: {
        sniReference: 'SNI 2415:2016 Pasal 3.1',
        areaLimit: RATIONAL_LIMIT_HA,
        areaUnit: 'Ha',
      },
    };
  } else if (areaKm2 <= 100) {
    // Modified Rational Methods (Haspers, Weduwen) are valid
    warnings.push(
      `Luas DAS (${areaHa.toFixed(0)} Ha / ${areaKm2.toFixed(2)} km²) melebihi batas Metode Rasional (${RATIONAL_LIMIT_HA} Ha).`
    );
    warnings.push(
      'Sesuai SNI 2415:2016 Pasal 3.1, gunakan Metode Empiris Modifikasi (Haspers/Weduwen) atau HSS (Hidrograf Satuan Sintetis).'
    );
    
    return {
      recommended: 'HSS_NAKAYASU',
      isValid: false, // Rational is NOT valid, but empirical methods are OK
      warnings,
      compliance: {
        sniReference: 'SNI 2415:2016 Pasal 3.1',
        areaLimit: RATIONAL_LIMIT_HA,
        areaUnit: 'Ha',
      },
    };
  } else {
    // Large catchment: Melchior or HSS required
    warnings.push(
      `Luas DAS (${areaHa.toFixed(0)} Ha / ${areaKm2.toFixed(2)} km²) melebihi batas Metode Rasional (${RATIONAL_LIMIT_HA} Ha).`
    );
    warnings.push(
      'Sesuai SNI 2415:2016 Pasal 3.1, gunakan Metode Melchior (A > 100 km²) atau HSS (Hidrograf Satuan Sintetis).'
    );
    
    return {
      recommended: 'HSS_NAKAYASU',
      isValid: false,
      warnings,
      compliance: {
        sniReference: 'SNI 2415:2016 Pasal 3.1',
        areaLimit: RATIONAL_LIMIT_HA,
        areaUnit: 'Ha',
      },
    };
  }
}

// ============================================================================
// RATIONAL METHOD (SNI 2415:2016 Pasal 5)
// ============================================================================

/**
 * Calculate Peak Discharge using Rational Method
 * 
 * Formula: Q = 0.278 × C × I × A
 * 
 * Where:
 * - Q = Debit puncak (Peak discharge) - m³/s
 * - C = Koefisien pengaliran (Runoff coefficient) - dimensionless [0-1]
 * - I = Intensitas hujan (Rainfall intensity) - mm/jam
 * - A = Luas DAS (Catchment area) - km²
 * - 0.278 = Faktor konversi metrik (Metric conversion factor)
 * 
 * Valid for: A ≤ 300 Ha (3 km²)
 * 
 * @param input - Rational method parameters
 * @returns Peak discharge calculation result
 * @throws {z.ZodError} If input validation fails
 * 
 * @reference SNI 2415:2016 Pasal 5.2
 * @reference Suripin (2004) - Sistem Drainase Perkotaan Berkelanjutan
 */
export function calculateRationalMethod(input: RationalMethodInput): RationalMethodOutput {
  // Validate input
  const validated = RationalInputSchema.parse(input);
  
  // Check SNI compliance
  const workflow = useSNI2415Workflow(validated.A);
  const sniCompliant = workflow.recommended === 'RATIONAL';
  
  // Calculate peak discharge
  // Q = 0.278 × C × I × A (A in km²)
  const Q = 0.278 * validated.C * validated.I * validated.A;
  
  // Calculate specific discharge
  const qSpecific = Q / validated.A;
  
  return {
    Q: parseFloat(Q.toFixed(3)),
    qSpecific: parseFloat(qSpecific.toFixed(3)),
    method: 'RATIONAL',
    sniCompliance: sniCompliant,
  };
}

// ============================================================================
// HSS NAKAYASU (SNI 2415:2016 Pasal 6.3)
// ============================================================================

/**
 * Calculate Time Lag (Waktu Kelambatan)
 * 
 * Formula: Tg = 0.21 × L^0.7
 * 
 * Alternative: Tg = 0.4 + 0.058 × L (for Indonesian conditions)
 * 
 * @param L - Panjang sungai utama (km)
 * @returns Tg - Waktu kelambatan (jam)
 * 
 * @reference SNI 2415:2016 Pasal 6.3.2
 */
export function calculateTg(L: number): number {
  // Using Indonesian empirical formula
  return 0.4 + 0.058 * L;
}

/**
 * Calculate Time to Peak (Waktu Puncak)
 * 
 * Formula: Tp = Tg + 0.8 × Tr
 * 
 * @param Tg - Waktu kelambatan (jam)
 * @param Tr - Durasi hujan satuan (jam)
 * @returns Tp - Waktu puncak (jam)
 * 
 * @reference SNI 2415:2016 Pasal 6.3.3
 */
export function calculateTp(Tg: number, Tr: number): number {
  return Tg + 0.8 * Tr;
}

/**
 * Calculate Recession Time (Waktu Menurun)
 * 
 * Formula: T0.3 = α × Tg
 * 
 * @param alpha - Parameter hidrograf [1.5-3.0], default 2.0
 * @param Tg - Waktu kelambatan (jam)
 * @returns T0.3 - Waktu menurun (jam)
 * 
 * @reference SNI 2415:2016 Pasal 6.3.4
 */
export function calculateT03(alpha: number, Tg: number): number {
  return alpha * Tg;
}

/**
 * Calculate Peak Discharge for HSS Nakayasu
 * 
 * Formula: Qp = (A × Ro) / (3.6 × (0.3 × Tp + T0.3))
 * 
 * Where:
 * - Qp = Debit puncak (m³/s)
 * - A = Luas DAS (km²)
 * - Ro = Hujan efektif (mm)
 * - Tp = Waktu puncak (jam)
 * - T0.3 = Waktu menurun (jam)
 * - 3.6 = Faktor konversi
 * 
 * @param A - Luas DAS (km²)
 * @param Ro - Hujan efektif (mm)
 * @param Tp - Waktu puncak (jam)
 * @param T03 - Waktu menurun (jam)
 * @returns Qp - Debit puncak (m³/s)
 * 
 * @reference SNI 2415:2016 Pasal 6.3.5
 */
export function calculateQp(A: number, Ro: number, Tp: number, T03: number): number {
  return (A * Ro) / (3.6 * (0.3 * Tp + T03));
}

/**
 * Calculate Base Time (Waktu Dasar)
 * 
 * Formula: Tb = Tp + 2.5 × T0.3
 * 
 * @param Tp - Waktu puncak (jam)
 * @param T03 - Waktu menurun (jam)
 * @returns Tb - Waktu dasar (jam)
 * 
 * @reference SNI 2415:2016 Pasal 6.3.6
 */
export function calculateTb(Tp: number, T03: number): number {
  return Tp + 2.5 * T03;
}

/**
 * Calculate HSS Nakayasu Complete Analysis
 * 
 * Implements full Nakayasu Unit Hydrograph method per SNI 2415:2016.
 * 
 * @param input - HSS Nakayasu parameters
 * @returns Complete hydrograph analysis
 * @throws {z.ZodError} If input validation fails
 * 
 * @reference SNI 2415:2016 Pasal 6.3
 */
export function calculateHSSNakayasu(input: HSSNakayasuInput): HSSNakayasuOutput {
  // Validate input
  const validated = HSSNakayasuInputSchema.parse(input);
  
  // Use default alpha if not provided
  const alpha = validated.alpha ?? 2.0;
  
  // Calculate time parameters
  const Tg = calculateTg(validated.L);
  const Tp = calculateTp(Tg, validated.Tr);
  const T03 = calculateT03(alpha, Tg);
  const Tb = calculateTb(Tp, T03);
  
  // Calculate peak discharge
  const Qp = calculateQp(validated.A, validated.Ro, Tp, T03);
  
  // Check SNI compliance
  const workflow = useSNI2415Workflow(validated.A);
  const sniCompliant = workflow.recommended === 'HSS_NAKAYASU' || validated.A > 3;
  
  return {
    Qp: parseFloat(Qp.toFixed(3)),
    Tp: parseFloat(Tp.toFixed(3)),
    Tb: parseFloat(Tb.toFixed(3)),
    Tg: parseFloat(Tg.toFixed(3)),
    T03: parseFloat(T03.toFixed(3)),
    method: 'HSS_NAKAYASU',
    sniCompliance: sniCompliant,
  };
}

/**
 * Validate Method Selection Against SNI 2415:2016
 * 
 * @param method - Selected method
 * @param areaKm2 - Luas DAS (km²)
 * @returns Validation result with warnings
 */
export function validateMethodSelection(
  method: FloodMethod,
  areaKm2: number
): { isValid: boolean; warnings: string[] } {
  const workflow = useSNI2415Workflow(areaKm2);
  
  if (method === 'RATIONAL' && workflow.recommended !== 'RATIONAL') {
    return {
      isValid: false,
      warnings: workflow.warnings,
    };
  }
  
  return {
    isValid: true,
    warnings: [],
  };
}
