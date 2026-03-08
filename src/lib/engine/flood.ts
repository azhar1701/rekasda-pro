/**
 * Flood Calculation Engine
 * Compliant with SNI 2415:2016 and Permen PU No. 12/PRT/M/2014
 */

import { z } from 'zod';
import {
  SNI_VALIDATION_LIMITS
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
  MelchiorInput,
  MelchiorOutput,
  HaspersInput,
  HaspersOutput,
  DerWeduwenInput,
  DerWeduwenOutput,
  HSSClarkInput,
  HSSClarkOutput,
  HSSSCSInput,
  HSSSCSOutput,
  ConvolutionInput,
  ConvolutionOutput,
} from '@/types/hydrology';

/**
 * Zod Schema - Validasi Input Metode Rasional
 * Sesuai SK Menteri PU No. 306/1989
 */
const RationalInputSchema = z.object({
  C: z.number().min(0).max(1),
  A: z.number().positive(),
  L: z.number().positive(),
  S: z.number().positive(),
  R24: z.number().positive(),
  tc: z.number().optional(),
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
    .max(SNI_VALIDATION_LIMITS.timeLag.max, 'Time lag terlalu besar')
    .optional(),
  Tr: z.number().positive('Time unit harus positif').optional(),
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
export const calculateRational = (input: RationalMethodInput): RationalMethodOutput => {
  const { C, A, L, S, R24 } = RationalInputSchema.parse(input);

  // 1. Waktu Konsentrasi (tc) - Kirpich Formula (konversi ke metrik)
  // L_ft = L(km) * 3280.84
  const L_ft = L * 3280.84;
  const tc_min = 0.0078 * Math.pow(L_ft, 0.77) * Math.pow(S, -0.385);
  const tc = input.tc || (tc_min / 60); // jam

  // 2. Intensitas Hujan (I) - Mononobe Formula
  const I = (R24 / 24) * Math.pow(24 / tc, 2/3);

  // 3. Debit Puncak (Q) - Rumus Rasional: Q = 0.278 * C * I * A
  const Qp = 0.278 * C * I * A;

  return {
    Qp: parseFloat(Qp.toFixed(3)),
    I: parseFloat(I.toFixed(2)),
    tc: parseFloat(tc.toFixed(2))
  };
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
  const { Ro, Alpha, A, L } = validated;

  // Perhitungan Tg otomatis jika tidak diinput: Tg = 0.4 + 0.058L
  const Tg_calc = 0.4 + 0.058 * L;
  const Tg_used = validated.Tg || Tg_calc;
  const Tr_used = validated.Tr || (0.75 * Tg_used);

  const Tp = Tg_used + 0.8 * Tr_used;
  const T03 = Alpha * Tg_used;
  const Qp = (A * Ro) / (3.6 * (0.3 * Tp + T03));
  const Tb = Tp + 2.5 * T03;

  const hydrograph: Array<{ time: number; discharge: number }> = [];
  const timeStep = 0.1;
  const maxTime = Math.max(Tb + 2 * T03, 24);

  for (let t = 0; t <= maxTime; t += timeStep) {
    let Q = 0;
    if (t === 0) {
      Q = 0;
    } else if (t > 0 && t <= Tp) {
      // Rising Limb
      Q = Qp * Math.pow(t / Tp, 2.4);
    } else if (t > Tp && t <= Tp + T03) {
      // Recession segment 1: Q > 0.3Qp
      Q = Qp * Math.pow(0.3, (t - Tp) / T03);
    } else if (t > Tp + T03 && t <= Tp + T03 + 1.5 * T03) {
      // Recession segment 2: 0.3Qp > Q > 0.09Qp
      Q = 0.3 * Qp * Math.pow(0.3, (t - Tp - T03) / (1.5 * T03));
    } else {
      // Recession segment 3: Q < 0.09Qp
      Q = 0.09 * Qp * Math.pow(0.3, (t - Tp - 2.5 * T03) / (2 * T03));
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

const HSSClarkInputSchema = z.object({
  Ro: z.number().min(SNI_VALIDATION_LIMITS.unitRainfall.min).max(SNI_VALIDATION_LIMITS.unitRainfall.max),
  A: z.number().min(SNI_VALIDATION_LIMITS.catchmentArea.min).max(SNI_VALIDATION_LIMITS.catchmentArea.max),
  Tc: z.number().min(0.1, 'Tc harus > 0').max(48),
  R: z.number().min(0.1, 'Storage coefficient R harus > 0').max(48),
});

const HSSSCSInputSchema = z.object({
  Ro: z.number().min(SNI_VALIDATION_LIMITS.unitRainfall.min).max(SNI_VALIDATION_LIMITS.unitRainfall.max),
  A: z.number().min(SNI_VALIDATION_LIMITS.catchmentArea.min).max(SNI_VALIDATION_LIMITS.catchmentArea.max),
  L: z.number().min(0.1).max(1000),
  S: z.number().min(0.0001).max(1.0),
  Tc: z.number().optional(),
});

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
  L: z.number().min(0.1, 'Panjang sungai harus > 0').max(1000),
  S: z.number().min(0.0001, 'Slope harus > 0').max(1.0),
  SF: z.number().min(0.0001, 'Stream Factor harus > 0').max(100),
  SIM: z.number().min(0.0001, 'Shape Index Mountain harus > 0').max(100),
  JN: z.number().min(0.0001, 'Jaringan Sungai harus > 0').max(100),
  SN: z.number().min(0.0001, 'Slope Network harus > 0').max(1.0),
  RUA: z.number().min(0.0001, 'Ratio Urban Area harus > 0').max(1.0),
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
  const { Ro, A, L, S, SF, SIM, JN, SN, RUA } = validated;

  // 1. Waktu Naik (TR)
  const TR = 0.43 * Math.pow(L / (100 * SF), 3) + 1.0665 * SIM + 1.2775;
  
  // 2. Debit Puncak (QP)
  const QP = 0.1836 * Math.pow(A, 0.5886) * Math.pow(TR, -0.4008) * Math.pow(JN, 0.2381);
  
  // 3. Waktu Dasar (TB)
  const TB = 27.4132 * Math.pow(TR, 0.1457) * Math.pow(S, -0.0986) * Math.pow(SN, 0.7344) * Math.pow(RUA, 0.2574);

  // 4. Storage Constant (K) for recession: Qt = Qp * exp(-t/K)
  // Simplified K = (TB - TR) / 3 (assuming 95% recession in TB)
  const K = (TB - TR) / 3;

  const hydrograph: Array<{ time: number; discharge: number }> = [];
  const dt = 0.1;
  const maxTime = Math.max(TB, 24);

  for (let t = 0; t <= maxTime; t += dt) {
    let Q = 0;
    if (t <= TR) {
      Q = (QP / TR) * t;
    } else {
      Q = QP * Math.exp(-(t - TR) / K);
    }
    hydrograph.push({ 
      time: parseFloat(t.toFixed(2)), 
      discharge: parseFloat((Q * Ro).toFixed(4)) 
    });
  }

  return { 
    Qp: parseFloat((QP * Ro).toFixed(3)), 
    Tp: parseFloat(TR.toFixed(2)), 
    Tb: parseFloat(TB.toFixed(2)), 
    hydrograph 
  };
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
  
  // Tb = 3 + 0.125 * Tp (hari) -> Convert to hours
  const Tb_days = 3 + 0.125 * (Tp / 24); // Tp in hours here, Tb days formula
  const Tb = Tp + (Tb_days * 24); 

  const hydrograph: Array<{ time: number; discharge: number }> = [];
  const timeStep = 0.2;
  const maxTime = Tb;

  for (let t = 0; t <= maxTime; t += timeStep) {
    let Q = 0;
    if (t === 0) {
      Q = 0;
    } else if (t > 0 && t <= Tp) {
      Q = Qp * Math.pow(t / Tp, 2.0);
    } else {
      Q = Qp * Math.pow((Tb - t) / (Tb - Tp), 1.2);
    }
    hydrograph.push({ time: parseFloat(t.toFixed(2)), discharge: parseFloat(Q.toFixed(4)) });
  }

  return { Qp: parseFloat(Qp.toFixed(3)), Tp: parseFloat(Tp.toFixed(2)), Tb: parseFloat(Tb.toFixed(2)), hydrograph };
};

/**
 * HSS SCS (Soil Conservation Service)
 * Menggunakan kurva curvilinear dimensionless unit hydrograph.
 */
export const calculateHSSSCS = (input: HSSSCSInput): HSSSCSOutput => {
  const validated = HSSSCSInputSchema.parse(input);
  let { Ro, A, L, S, Tc } = validated;

  // 1. Calculate Tc if not provided (Kirpich)
  if (!Tc) {
    Tc = 0.0195 * Math.pow(L * 1000, 0.77) * Math.pow(S, -0.385) / 60; // jam
  }

  // 2. Tp (Time to peak) = 0.6 * Tc + 0.5 * duration (duration assumed 1hr for unit hydrograph)
  const Tp = 0.6 * Tc + 0.5;
  const Qp = (0.208 * A * Ro) / Tp;
  const Tb = 5 * Tp;

  const hydrograph: Array<{ time: number; discharge: number }> = [];
  const timeStep = 0.5; // Coarser for long Tb
  
  // SCS Curvilinear approximation
  for (let t = 0; t <= Tb; t += timeStep) {
    const ratio = t / Tp;
    let Q = 0;
    if (ratio <= 1) {
      Q = Qp * Math.pow(ratio, 1.5) * Math.exp(1.5 * (1 - ratio));
    } else {
      Q = Qp * Math.pow(ratio, -1.5) * Math.exp(-1.5 * (ratio - 1));
    }
    hydrograph.push({ time: parseFloat(t.toFixed(2)), discharge: parseFloat(Q.toFixed(4)) });
  }

  return { Qp: parseFloat(Qp.toFixed(3)), Tp: parseFloat(Tp.toFixed(2)), Tb: parseFloat(Tb.toFixed(2)), hydrograph };
};

/**
 * HSS Clark
 * Menggunakan routing linear reservoir sederhana.
 */
export const calculateHSSClark = (input: HSSClarkInput): HSSClarkOutput => {
  const validated = HSSClarkInputSchema.parse(input);
  const { Ro, A, Tc, R } = validated;

  const Tb = Tc + 3 * R;

  const hydrograph: Array<{ time: number; discharge: number }> = [];
  const dt = 0.5;
  let prevQ = 0;
  
  // Storage constant K = R
  const K = R;
  const C = dt / (2 * K + dt);

  for (let t = 0; t <= Tb; t += dt) {
    // Inflow I is simplified: 1 unit area over Tc hours
    const I = t <= Tc ? (A * Ro / Tc) : 0;
    const Q = C * (I + I) + (1 - 2 * C) * prevQ; // Muskingum-like linear reservoir
    const safeQ = Math.max(0, Q);
    hydrograph.push({ time: parseFloat(t.toFixed(2)), discharge: parseFloat(safeQ.toFixed(4)) });
    prevQ = safeQ;
  }

  const actualQp = Math.max(...hydrograph.map(h => h.discharge));
  const peak = hydrograph.find(h => h.discharge === actualQp);

  return { Qp: parseFloat(actualQp.toFixed(3)), Tp: peak?.time || 0, Tb: parseFloat(Tb.toFixed(2)), hydrograph };
};

/**
 * Metode Melchior
 * Sesuai Standar Pengairan Indonesia (Melchior, 1895)
 */
export const calculateMelchior = (input: MelchiorInput): MelchiorOutput => {
  const { A, L, S, R24 } = input;
  
  // 1. Waktu Konsentrasi (tc) - Melchior Formula
  const tc = 0.43 * Math.pow(L / Math.sqrt(S), 0.467); // jam
  
  // 2. Koefisien Reduksi (Alpha)
  let Alpha = 1.0;
  if (A > 100) {
    Alpha = 1 - (0.012 * Math.pow(A, 0.5) / Math.pow(tc, 0.2));
  }
  Alpha = Math.max(0.5, Math.min(1.0, Alpha));

  // 3. Intensitas rata-rata (q)
  const q = R24 / 24; 
  
  // 4. Debit Puncak
  const Qp = (Alpha * 1.0 * q * A) / 3.6;

  return {
    Qp: parseFloat(Qp.toFixed(3)),
    Alpha: parseFloat(Alpha.toFixed(3)),
    tc: parseFloat(tc.toFixed(2))
  };
};

/**
 * Metode Haspers
 */
export const calculateHaspers = (input: HaspersInput): HaspersOutput => {
  const { A, L, S, R24 } = input;

  const tc = 0.1 * L * Math.pow(S, -0.33); 
  
  const num = 1 + 0.012 * Math.pow(A, 0.7);
  const den = 1 + 0.075 * Math.pow(A, 0.7);
  const term2 = (tc + (3.7 * Math.pow(10, -4) * A)) / (Math.pow(tc, 2) + 15);
  const AlphaReciprocal = 1 + (num / den) * term2;
  const Alpha = 1 / AlphaReciprocal;

  const q = (R24 / 24) * ((tc + 1) / tc);
  const Qp = (Alpha * 1.0 * q * A) / 3.6;

  return {
    Qp: parseFloat(Qp.toFixed(3)),
    Alpha: parseFloat(Alpha.toFixed(3)),
    tc: parseFloat(tc.toFixed(2))
  };
};

/**
 * Metode Der Weduwen
 */
export const calculateDerWeduwen = (input: DerWeduwenInput): DerWeduwenOutput => {
  const { A, L, S, R24 } = input;

  const tc = 0.25 * L * Math.pow(S, -0.125); 
  const Alpha = 1 - (Math.sqrt(A) / (Math.sqrt(A) + 3 * tc));
  const q = (R24 / 24) * ((67 + tc) / (1.25 + tc));
  const Qp = (Alpha * 1.0 * q * A) / 3.6;

  return {
    Qp: parseFloat(Qp.toFixed(3)),
    Alpha: parseFloat(Alpha.toFixed(3)),
    tc: parseFloat(tc.toFixed(2))
  };
};

/**
 * Konvolusi Hidrograf
 */
export const calculateConvolution = (input: ConvolutionInput): ConvolutionOutput => {
  const { effectiveRainfall, unitHydrograph } = input;
  
  const floodHydrograph: Array<{ time: number; discharge: number }> = [];
  const nRain = effectiveRainfall.length;
  const nUH = unitHydrograph.length;
  
  const dt = unitHydrograph[1]?.time - unitHydrograph[0]?.time || 1;
  const totalSteps = nRain + nUH - 1;

  for (let tIdx = 0; tIdx < totalSteps; tIdx++) {
    let Q = 0;
    for (let i = 0; i < nRain; i++) {
      const idxUH = tIdx - i;
      if (idxUH >= 0 && idxUH < nUH) {
        Q += effectiveRainfall[i] * unitHydrograph[idxUH].discharge;
      }
    }
    floodHydrograph.push({
      time: parseFloat((tIdx * dt).toFixed(2)),
      discharge: parseFloat(Q.toFixed(4))
    });
  }

  const Qp = Math.max(...floodHydrograph.map(f => f.discharge));
  const peak = floodHydrograph.find(f => f.discharge === Qp);

  return {
    hydrograph: floodHydrograph,
    Qp: parseFloat(Qp.toFixed(3)),
    Tp: peak?.time || 0
  };
};
