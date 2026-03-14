/**
 * SNI 2415:2016 Compliant Flood Calculation Engine
 * Tata Cara Perhitungan Debit Banjir Rencana
 * 
 * @standard SNI 2415:2016
 * @reference Permen PU No. 12/PRT/M/2014
 */

import { z } from 'zod';
import {
 RATIONAL_CONVERSION_FACTOR,
 SNI_VALIDATION_LIMITS,
 SNI_RATIONAL_AREA_LIMIT_KM2,
 SNI_RATIONAL_AREA_LIMIT_HA,
} from '../../constants/sni';

export { SNI_RATIONAL_AREA_LIMIT_KM2, SNI_RATIONAL_AREA_LIMIT_HA };

import type {
 RationalMethodInput,
 RationalMethodOutput,
 HSSNakayasuInput,
 HSSNakayasuOutput,
} from '@/types/hydrology';

/**
 * Engineering Metadata for Auditability
 */
export interface EngineeringMetadata {
 standard: string;
 clause: string;
 method: string;
 warnings: string[];
 notes?: string;
 error?: string;
}

export interface RationalOutputWithMetadata extends RationalMethodOutput {
 metadata: EngineeringMetadata;
}

export interface HSSNakayasuOutputWithMetadata extends HSSNakayasuOutput {
 metadata: EngineeringMetadata;
}

/**
 * Hasil Validasi Workflow SNI 2415:2016
 */
export interface SNI2415WorkflowResult {
 /** Metode yang direkomendasikan */
 recommendedMethod: 'rational' | 'hss';
 /** Apakah Metode Rasional valid untuk luas DAS ini? */
 isRationalValid: boolean;
 /** Peringatan SNI (jika ada) */
 warning?: string;
 /** Luas DAS dalam km² */
 areaKm2: number;
}

/**
 * Validasi Workflow SNI 2415:2016 - Pemilihan Metode Berdasarkan Luas DAS
 */
export const validateSNI2415Workflow = (areaKm2: number): SNI2415WorkflowResult => {
 const isRationalValid = areaKm2 <= SNI_RATIONAL_AREA_LIMIT_KM2;

 if (isRationalValid) {
 return {
 recommendedMethod: 'rational',
 isRationalValid: true,
 areaKm2,
 };
 }

 return {
 recommendedMethod: 'hss',
 isRationalValid: false,
 warning: `Luas DAS (${areaKm2.toFixed(2)} km² / ${(areaKm2 * 100).toFixed(0)} ha) melebihi batas Metode Rasional (300 ha) sesuai SNI 2415:2016 Pasal 5.2. Gunakan Metode HSS.`,
 areaKm2,
 };
};

/**
 * Zod Schema - Validasi Input Metode Rasional (SNI 2415:2016 Pasal 5.2)
 * Note: Area limit removed from schema to allow calculation with warning.
 */
const RationalInputSchema = z.object({
 C: z.number().min(0).max(1),
 I: z.number().positive().optional(),
 A: z.number().positive(),
 L: z.number().positive().optional(),
 S: z.number().positive().optional(),
 R24: z.number().positive().optional(),
 tc: z.number().positive().optional(),
});

/**
 * Metode Rasional - Perhitungan Debit Banjir Rencana
 * @standard SNI 2415:2016 Pasal 5.2
 */
export const calculateRationalDischarge = (input: RationalMethodInput): RationalOutputWithMetadata => {
 const result = RationalInputSchema.safeParse(input);
 
 if (!result.success) {
 return {
 Qp: 0, tc: input.tc || 0, I: input.I || 0,
 metadata: {
 standard: 'SNI 2415:2016', clause: 'Pasal 5.2', method: 'Metode Rasional',
 warnings: [], error: result.error.errors[0].message,
 }
 };
 }

 const validated = result.data;
 const warnings: string[] = [];
 
 // SNI 2415:2016 Compliance Check
 if (validated.A > SNI_RATIONAL_AREA_LIMIT_KM2) {
 warnings.push(`Luas DAS (${validated.A} km²) melebihi batas SNI 2415:2016 (3 km²). Hasil tidak direkomendasikan.`);
 }

 let tc = validated.tc;
 let I = validated.I;

 // 1. Fallback: Calculate tc using Kirpich Formula if missing
 if (tc === undefined && validated.L && validated.S) {
 const L_ft = validated.L * 3280.84;
 const tc_min = 0.0078 * Math.pow(L_ft, 0.77) * Math.pow(validated.S, -0.385);
 tc = tc_min / 60; // hours
 }

 // 2. Fallback: Calculate I using Mononobe if missing
 if (I === undefined && validated.R24 && tc) {
 I = (validated.R24 / 24) * Math.pow(24 / tc, 2 / 3);
 }

 if (I === undefined || isNaN(I)) {
 return {
 Qp: 0, tc: tc || 0, I: 0,
 metadata: { 
 standard: 'SNI 2415:2016', clause: 'Pasal 5.2', method: 'Metode Rasional', 
 warnings, error: 'Parameter I atau (L, S, R24) diperlukan untuk perhitungan.' 
 }
 };
 }

 const Q = RATIONAL_CONVERSION_FACTOR * validated.C * I * validated.A;

 return {
 Qp: parseFloat(Q.toFixed(3)),
 tc: parseFloat((tc || 0).toFixed(3)),
 I: parseFloat(I.toFixed(3)),
 metadata: {
 standard: 'SNI 2415:2016',
 clause: 'Pasal 5.2',
 method: 'Metode Rasional',
 warnings,
 notes: 'Q = 0.278 × C × I × A',
 }
 };
};

/**
 * Zod Schema - Validasi Input HSS Nakayasu (SNI 2415:2016 Pasal 6.3)
 */
const HSSNakayasuInputSchema = z.object({
 Ro: z.number().min(SNI_VALIDATION_LIMITS.unitRainfall.min).max(SNI_VALIDATION_LIMITS.unitRainfall.max),
 Tg: z.number().positive().optional(),
 Tr: z.number().positive().optional(),
 Alpha: z.number().min(1).max(5).default(2.0),
 A: z.number().positive(),
 L: z.number().positive(),
});

/**
 * HSS Nakayasu - Perhitungan Hidrograf Satuan Sintetik
 * @standard SNI 2415:2016 Pasal 6.3
 */
export const calculateHSSNakayasu = (input: HSSNakayasuInput): HSSNakayasuOutputWithMetadata => {
 const result = HSSNakayasuInputSchema.safeParse(input);
 
 if (!result.success) {
 return {
 Qp: 0, Tp: 0, Tb: 0, hydrograph: [],
 metadata: {
 standard: 'SNI 2415:2016', clause: 'Pasal 6.3', method: 'HSS Nakayasu',
 warnings: [], error: result.error.errors[0].message
 }
 };
 }

 const { Ro, Tg, Tr, Alpha, A, L } = result.data;
 const Tg_calc = 0.4 + 0.058 * L;
 const Tg_used = Tg ?? Tg_calc;
 const Tr_used = Tr ?? (0.75 * Tg_used);

 const Tp = Tg_used + 0.8 * Tr_used;
 const T03 = Alpha * Tg_used;
 const Qp = (A * Ro) / (3.6 * (0.3 * Tp + T03));
 const Tb = Tp + 2.5 * T03;

 const hydrograph: Array<{ time: number; discharge: number }> = [];
 const timeStep = 0.1;
 const maxTime = Math.max(Tb + 2 * T03, 24);

 for (let t = 0; t <= maxTime; t += timeStep) {
 let Q = 0;
 if (t > 0 && t <= Tp) Q = Qp * Math.pow(t / Tp, 2.4);
 else if (t > Tp && t <= Tp + T03) Q = Qp * Math.pow(0.3, (t - Tp) / T03);
 else if (t > Tp + T03 && t <= Tp + T03 + 1.5 * T03) Q = 0.3 * Qp * Math.pow(0.3, (t - Tp - T03) / (1.5 * T03));
 else if (t > Tp + 2.5 * T03) Q = 0.09 * Qp * Math.pow(0.3, (t - Tp - 2.5 * T03) / (2 * T03));
 hydrograph.push({ time: parseFloat(t.toFixed(2)), discharge: parseFloat(Q.toFixed(4)) });
 }

 return {
 Qp: parseFloat(Qp.toFixed(3)),
 Tp: parseFloat(Tp.toFixed(2)),
 Tb: parseFloat(Tb.toFixed(2)),
 hydrograph,
 metadata: {
 standard: 'SNI 2415:2016', clause: 'Pasal 6.3', method: 'HSS Nakayasu',
 warnings: [], notes: `Alpha=${Alpha.toFixed(1)}, Tg=${Tg_used.toFixed(2)}h`
 }
 };
};

export const validateRationalInput = (input: RationalMethodInput): void => {
 RationalInputSchema.parse(input);
};

export const validateHSSNakayasuInput = (input: HSSNakayasuInput): void => {
 HSSNakayasuInputSchema.parse(input);
};
