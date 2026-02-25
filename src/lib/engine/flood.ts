/**
 * Flood Calculation Engine
 * Compliant with SNI 2415:2016 and Permen PU No. 12/PRT/M/2014
 */

import { z } from 'zod';
import {
  RATIONAL_CONVERSION_FACTOR,
  SNI_VALIDATION_LIMITS,
} from '../constants/sni';
import type {
  RationalMethodInput,
  RationalMethodOutput,
  HSSNakayasuInput,
  HSSNakayasuOutput,
  HSSGamma1Input,
  HSSGamma1Output,
  HSSSnyderInput,
  HSSSnyderOutput,
} from '@/types/hydrology';

/**
 * Zod Schema - Validasi Input Metode Rasional
 * Sesuai SK Menteri PU No. 306/1989
 */
const RationalInputSchema = z.object({
  C: z
    .number()
    .min(SNI_VALIDATION_LIMITS.runoffCoefficient.min, 'Koefisien C tidak boleh < 0')
    .max(SNI_VALIDATION_LIMITS.runoffCoefficient.max, 'Koefisien C tidak boleh > 1'),
  I: z
    .number()
    .min(SNI_VALIDATION_LIMITS.rainfallIntensity.min, 'Intensitas hujan terlalu rendah')
    .max(SNI_VALIDATION_LIMITS.rainfallIntensity.max, 'Intensitas hujan tidak realistis'),
  A: z
    .number()
    .min(SNI_VALIDATION_LIMITS.catchmentArea.min, 'Luas DAS tidak boleh negatif')
    .max(SNI_VALIDATION_LIMITS.catchmentArea.max, 'Luas DAS terlalu besar'),
});

/**
 * Zod Schema - Validasi Input HSS Nakayasu
 * Sesuai SNI 2415:2016 Pasal 6.3
 */
const HSSNakayasuInputSchema = z.object({
  Ro: z
    .number()
    .min(SNI_VALIDATION_LIMITS.unitRainfall.min, 'Hujan satuan terlalu kecil')
    .max(SNI_VALIDATION_LIMITS.unitRainfall.max, 'Hujan satuan terlalu besar'),
  Tg: z
    .number()
    .min(SNI_VALIDATION_LIMITS.timeLag.min, 'Time lag terlalu kecil')
    .max(SNI_VALIDATION_LIMITS.timeLag.max, 'Time lag terlalu besar'),
  Tr: z.number().positive('Time unit harus positif'),
  Alpha: z
    .number()
    .min(SNI_VALIDATION_LIMITS.alpha.min, `Alpha minimum ${SNI_VALIDATION_LIMITS.alpha.min}`)
    .max(SNI_VALIDATION_LIMITS.alpha.max, `Alpha maksimum ${SNI_VALIDATION_LIMITS.alpha.max}`),
  A: z
    .number()
    .min(SNI_VALIDATION_LIMITS.catchmentArea.min, 'Luas DAS tidak boleh negatif')
    .max(SNI_VALIDATION_LIMITS.catchmentArea.max, 'Luas DAS terlalu besar'),
  L: z
    .number()
    .min(SNI_VALIDATION_LIMITS.riverLength.min, 'Panjang sungai terlalu kecil')
    .max(SNI_VALIDATION_LIMITS.riverLength.max, 'Panjang sungai terlalu besar'),
});

/**
 * Metode Rasional - Perhitungan Debit Puncak
 * 
 * Formula: Q = 0.278 * C * I * A
 * 
 * Dimana:
 * - Q = Debit puncak (m³/s)
 * - C = Koefisien pengaliran (dimensionless)
 * - I = Intensitas hujan (mm/jam)
 * - A = Luas DAS (km²)
 * - 0.278 = Faktor konversi metrik
 * 
 * @param input - Parameter input metode rasional
 * @returns Debit puncak dalam m³/s
 * @throws {z.ZodError} Jika input tidak valid
 * 
 * @reference SNI 2415:2016 Pasal 5.2
 * @reference Permen PU No. 12/PRT/M/2014
 */
export const calculateRationalDischarge = (input: RationalMethodInput): RationalMethodOutput => {
  // Validasi input
  const validated = RationalInputSchema.parse(input);

  // Perhitungan debit puncak
  // Q = 0.278 * C * I * A
  const Q = RATIONAL_CONVERSION_FACTOR * validated.C * validated.I * validated.A;

  return { Q };
};

/**
 * HSS Nakayasu - Perhitungan Hidrograf Satuan Sintetik
 * Sesuai rumus terlampir dan SNI 2415:2016 Pasal 6.3
 * 
 * Parameter:
 * - Tg = 0.4 + 0.058L (Time lag)
 * - Tp = Tg + 0.8tr (Waktu puncak)
 * - T0.3 = α · Tg (Waktu penurunan)
 * - Qp = (A · Ro) / (3.6 × (0.3Tp + T0.3)) (Debit puncak)
 * 
 * Kurva Hidrograf:
 * - Rising (0 < t < Tp): Qt = Qp × (t/Tp)^2.4
 * - Recession (t > Tp): Qt = Qp · 0.3^((t-Tp)/T0.3)
 */
export const calculateHSSNakayasu = (input: HSSNakayasuInput): HSSNakayasuOutput => {
  const validated = HSSNakayasuInputSchema.parse(input);
  const { Ro, Tg, Tr, Alpha, A, L } = validated;

  // Perhitungan Tg otomatis jika tidak diinput: Tg = 0.4 + 0.058L
  const Tg_calc = 0.4 + 0.058 * L;
  const Tg_used = Tg || Tg_calc;

  // Validasi Tr: 0.5Tr ≤ tr ≤ Tr
  if (Tr < 0.5 * Tg_used || Tr > Tg_used) {
    console.warn(`Tr (${Tr}) harus antara 0.5×Tg (${(0.5*Tg_used).toFixed(2)}) dan Tg (${Tg_used.toFixed(2)})`);
  }

  const Tp = Tg_used + 0.8 * Tr;
  const T03 = Alpha * Tg_used;
  const Qp = (A * Ro) / (3.6 * (0.3 * Tp + T03));
  const Tb = Tp + 2.5 * T03;

  const hydrograph: Array<{ time: number; discharge: number }> = [];
  const timeStep = 0.1;
  const maxTime = Tb + 2 * T03;

  for (let t = 0; t <= maxTime; t += timeStep) {
    let Q = 0;
    if (t === 0) {
      Q = 0;
    } else if (t > 0 && t <= Tp) {
      Q = Qp * Math.pow(t / Tp, 2.4);
    } else if (t > Tp && t <= Tp + T03) {
      // Kurva turun segmen 1
      Q = Qp * Math.pow(0.3, (t - Tp) / T03);
    } else if (t > Tp + T03 && t <= Tp + T03 + 1.5 * T03) {
      // Kurva turun segmen 2
      Q = Qp * Math.pow(0.3, 1 + (t - Tp - T03) / (1.5 * T03));
    } else if (t > Tp + 2.5 * T03) {
      // Kurva turun segmen 3
      Q = Qp * Math.pow(0.3, 2.5 + (t - Tp - 2.5 * T03) / (2 * T03));
    }
    hydrograph.push({ time: parseFloat(t.toFixed(2)), discharge: parseFloat(Q.toFixed(4)) });
  }

  return { Qp: parseFloat(Qp.toFixed(3)), Tp: parseFloat(Tp.toFixed(2)), Tb: parseFloat(Tb.toFixed(2)), hydrograph };
};

/**
 * Validasi Input Metode Rasional
 * @param input - Input yang akan divalidasi
 * @returns true jika valid, throw error jika tidak
 */
export const validateRationalInput = (input: RationalMethodInput): boolean => {
  RationalInputSchema.parse(input);
  return true;
};

/**
 * Validasi Input HSS Nakayasu
 * @param input - Input yang akan divalidasi
 * @returns true jika valid, throw error jika tidak
 */
export const validateHSSNakayasuInput = (input: HSSNakayasuInput): boolean => {
  HSSNakayasuInputSchema.parse(input);
  return true;
};

const HSSGamma1InputSchema = z.object({
  Ro: z.number().min(SNI_VALIDATION_LIMITS.unitRainfall.min, 'Hujan satuan terlalu kecil').max(SNI_VALIDATION_LIMITS.unitRainfall.max),
  A: z.number().min(SNI_VALIDATION_LIMITS.catchmentArea.min, 'Luas DAS harus > 0').max(SNI_VALIDATION_LIMITS.catchmentArea.max),
  L: z.number().min(SNI_VALIDATION_LIMITS.riverLength.min, 'Panjang sungai harus > 0').max(SNI_VALIDATION_LIMITS.riverLength.max),
  Tc: z.number().positive('Waktu konsentrasi harus positif').optional(),
});

/**
 * HSS Gamma I - Perhitungan Hidrograf Satuan Sintetik
 * Metode Sri Harto (1993)
 * 
 * Parameter:
 * - Tc = 0.43 × (L / √S)^0.467 (Waktu konsentrasi)
 * - Tp = 0.5 × Tc (Waktu puncak)
 * - Qp = (0.18 × A × Ro) / Tp (Debit puncak)
 * - Tb = 3 × Tp (Waktu dasar)
 */
export const calculateHSSGamma1 = (input: HSSGamma1Input): HSSGamma1Output => {
  const validated = HSSGamma1InputSchema.parse(input);
  const { Ro, A, L, Tc: TcInput } = validated;

  // Perhitungan Tc jika tidak diinput (asumsi slope 0.01)
  const Tc = TcInput || 0.43 * Math.pow(L / Math.sqrt(0.01), 0.467);
  const Tp = 0.5 * Tc;
  const Qp = (0.18 * A * Ro) / Tp;
  const Tb = 3 * Tp; // Simplified formula

  const hydrograph: Array<{ time: number; discharge: number }> = [];
  const timeStep = 0.1;
  const maxTime = Tb + Tp;

  for (let t = 0; t <= maxTime; t += timeStep) {
    let Q = 0;
    if (t === 0) {
      Q = 0;
    } else if (t > 0 && t <= Tp) {
      Q = Qp * Math.pow(t / Tp, 2.5);
    } else if (t > Tp && t <= Tb) {
      Q = Qp * Math.pow((Tb - t) / (Tb - Tp), 1.5);
    }
    hydrograph.push({ time: parseFloat(t.toFixed(2)), discharge: parseFloat(Q.toFixed(4)) });
  }

  return { Qp: parseFloat(Qp.toFixed(3)), Tp: parseFloat(Tp.toFixed(2)), Tb: parseFloat(Tb.toFixed(2)), hydrograph };
};

const HSSSnyderInputSchema = z.object({
  Ro: z.number().min(SNI_VALIDATION_LIMITS.unitRainfall.min).max(SNI_VALIDATION_LIMITS.unitRainfall.max),
  A: z.number().min(SNI_VALIDATION_LIMITS.catchmentArea.min, 'Luas DAS harus > 0').max(SNI_VALIDATION_LIMITS.catchmentArea.max),
  L: z.number().min(SNI_VALIDATION_LIMITS.riverLength.min, 'Panjang sungai harus > 0').max(SNI_VALIDATION_LIMITS.riverLength.max),
  Lc: z.number().min(0.01, 'Panjang ke titik berat harus > 0').max(SNI_VALIDATION_LIMITS.riverLength.max),
  Ct: z.number().min(0.1, 'Koefisien Ct harus > 0').max(10), // Limit arbitrary to ensure safety
  Cp: z.number().min(0.1, 'Koefisien Cp harus > 0').max(10),
});

/**
 * HSS Snyder - Perhitungan Hidrograf Satuan Sintetik
 * Metode Snyder (1938)
 * 
 * Parameter:
 * - tpR = Ct × (L × Lc)^0.3 (Time lag)
 * - Tp = tpR + 0.25 × tr (Waktu puncak)
 * - Qp = (2.78 × Cp × A × Ro) / Tp (Debit puncak)
 * - Tb = 5 × Tp (Waktu dasar)
 */
export const calculateHSSSnyder = (input: HSSSnyderInput): HSSSnyderOutput => {
  const validated = HSSSnyderInputSchema.parse(input);
  const { Ro, A, L, Lc, Ct, Cp } = validated;

  const tpR = Ct * Math.pow(L * Lc, 0.3);
  const tr = tpR / 5.5;
  const Tp = tpR + 0.25 * tr;
  const Qp = (2.78 * Cp * A * Ro) / Tp;
  const Tb = 5 * Tp; // Simplified: base time = 5 × peak time

  const hydrograph: Array<{ time: number; discharge: number }> = [];
  const timeStep = 0.1;
  const maxTime = Tb + Tp;

  for (let t = 0; t <= maxTime; t += timeStep) {
    let Q = 0;
    if (t === 0) {
      Q = 0;
    } else if (t > 0 && t <= Tp) {
      Q = Qp * Math.pow(t / Tp, 2.0);
    } else if (t > Tp && t <= Tb) {
      Q = Qp * Math.pow((Tb - t) / (Tb - Tp), 1.2);
    }
    hydrograph.push({ time: parseFloat(t.toFixed(2)), discharge: parseFloat(Q.toFixed(4)) });
  }

  return { Qp: parseFloat(Qp.toFixed(3)), Tp: parseFloat(Tp.toFixed(2)), Tb: parseFloat(Tb.toFixed(2)), hydrograph };
};
