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

  // 1. Waktu Konsentrasi (tc) - Kirpich Formula (METRIC)
  // Tc = 0.0195 × L_m^0.77 × S^(-0.385)  → result in MINUTES
  // Where L_m = L(km) × 1000
  const L_m = L * 1000;
  const tc_min = 0.0195 * Math.pow(L_m, 0.77) * Math.pow(S, -0.385);
  const tc = input.tc || (tc_min / 60); // jam

  // 2. Intensitas Hujan (I) - Mononobe Formula (SNI 2415:2016 Pasal 5.2.2)
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
      // Rising Limb: Qt = Qp × (t/Tp)^2.4
      Q = Qp * Math.pow(t / Tp, 2.4);
    } else if (t > Tp && t <= Tp + T03) {
      // Recession segment 1 (Qp → 0.3Qp): Qt = Qp × 0.3^((t-Tp)/T0.3)
      Q = Qp * Math.pow(0.3, (t - Tp) / T03);
    } else if (t > Tp + T03 && t <= Tp + T03 + 1.5 * T03) {
      // Recession segment 2 (0.3Qp → 0.09Qp): Qt = Qp × 0.3^(1 + (t-Tp-T0.3)/(1.5×T0.3))
      Q = Qp * Math.pow(0.3, 1 + (t - Tp - T03) / (1.5 * T03));
    } else {
      // Recession segment 3 (< 0.09Qp): Qt = Qp × 0.3^(2.5 + (t-Tp-2.5×T0.3)/(2×T0.3))
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

  // 1. Waktu Naik (TR) — Sri Harto (1993)
  // TR = 0.43 × (L / 100SF)³ + 1.0665 × SIM + 1.2775
  const TR = 0.43 * Math.pow(L / (100 * SF), 3) + 1.0665 * SIM + 1.2775;
  
  // 2. Debit Puncak (QP) — Sri Harto (1993)
  // QP = 0.1836 × A^0.5886 × TR^(-0.4008) × JN^0.2381
  const QP = 0.1836 * Math.pow(A, 0.5886) * Math.pow(TR, -0.4008) * Math.pow(JN, 0.2381);
  
  // 3. Waktu Dasar (TB) — Sri Harto (1993)
  // TB = 27.4132 × TR^0.1457 × S^(-0.0986) × SN^0.7344 × RUA^0.2574
  const TB = 27.4132 * Math.pow(TR, 0.1457) * Math.pow(S, -0.0986) * Math.pow(SN, 0.7344) * Math.pow(RUA, 0.2574);

  // 4. Storage Constant (K) — Sri Harto (1993)
  // K = 0.5617 × A^0.1798 × S^(-0.1446) × SF^(-1.0897) × D^0.0452
  // Where D = drainage density = L / A (km/km²)
  const D = L / A;
  const K = 0.5617 * Math.pow(A, 0.1798) * Math.pow(S, -0.1446) * Math.pow(SF, -1.0897) * Math.pow(D, 0.0452);

  // 5. Generate Hydrograph
  // Rising limb: linear from 0 to QP over TR hours
  // Recession limb: Qt = QP × exp(-(t - TR) / K)
  const hydrograph: Array<{ time: number; discharge: number }> = [];
  const dt = 0.1;
  const maxTime = Math.max(TB, 24);

  for (let t = 0; t <= maxTime; t += dt) {
    let Q = 0;
    if (t <= TR) {
      // Rising limb: linear interpolation to peak
      Q = (QP * Ro / TR) * t;
    } else {
      // Recession limb: exponential decay
      Q = QP * Ro * Math.exp(-(t - TR) / K);
    }
    hydrograph.push({ 
      time: parseFloat(t.toFixed(2)), 
      discharge: parseFloat(Q.toFixed(4)) 
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

  // 1. Time Lag: tL = Ct × (L × Lc)^0.3  (hours)
  const tL = Ct * Math.pow(L * Lc, 0.3);

  // 2. Standard rainfall duration: D = tL / 5.5  (hours)
  const D = tL / 5.5;

  // 3. Time to Peak: Tp = D/2 + tL  (hours)
  const Tp = D / 2 + tL;

  // 4. Peak Discharge: Qp = 2.78 × Cp × A × Ro / tL  (m³/s, A in km²)
  const Qp = (2.78 * Cp * A * Ro) / tL;

  // 5. Base Time: Tb = (3 + tL/8) × 24  (hours)
  // Standard Snyder: Tb (days) = 3 + tL(hours) / 8
  const Tb = (3 + tL / 8) * 24;

  // Width at 50%/75% available for future shaping refinement:
  // W50 = 2.14 × (Qp/A)^(-1.08), W75 = 1.22 × (Qp/A)^(-1.08)

  // 7. Generate Hydrograph using triangular approximation
  const hydrograph: Array<{ time: number; discharge: number }> = [];
  const timeStep = 0.2;
  const maxTime = Math.min(Tb, 240); // cap at 240 hours for safety

  for (let t = 0; t <= maxTime; t += timeStep) {
    let Q = 0;
    if (t === 0) {
      Q = 0;
    } else if (t > 0 && t <= Tp) {
      // Rising limb: power curve
      Q = Qp * Math.pow(t / Tp, 2.0);
    } else if (t <= Tb) {
      // Recession limb: power decay
      Q = Qp * Math.pow((Tb - t) / (Tb - Tp), 1.5);
    } else {
      Q = 0;
    }
    hydrograph.push({ time: parseFloat(t.toFixed(2)), discharge: parseFloat(Math.max(0, Q).toFixed(4)) });
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

  // 1. Calculate Tc if not provided (Kirpich metric formula)
  if (!Tc) {
    Tc = 0.0195 * Math.pow(L * 1000, 0.77) * Math.pow(S, -0.385) / 60; // jam
  }

  // 2. Tp (Time to peak) = 0.6 × Tc + 0.5 × D (duration assumed 1hr for unit hydrograph)
  const Tp = 0.6 * Tc + 0.5;

  // 3. Qp = 0.208 × A × Ro / Tp (m³/s, A in km²)  — PRF=484 standard
  const Qp = (0.208 * A * Ro) / Tp;
  const Tb = 5 * Tp;

  // 4. NRCS Dimensionless Unit Hydrograph Table (NEH Part 630, Table 16-1)
  // Standard 33-point tabular data: [t/Tp, Q/Qp]
  const SCS_TABLE: [number, number][] = [
    [0.0, 0.000], [0.1, 0.030], [0.2, 0.100], [0.3, 0.190], [0.4, 0.310],
    [0.5, 0.470], [0.6, 0.660], [0.7, 0.820], [0.8, 0.930], [0.9, 0.990],
    [1.0, 1.000], [1.1, 0.990], [1.2, 0.930], [1.3, 0.860], [1.4, 0.780],
    [1.5, 0.680], [1.6, 0.560], [1.7, 0.460], [1.8, 0.390], [1.9, 0.330],
    [2.0, 0.280], [2.2, 0.207], [2.4, 0.147], [2.6, 0.107], [2.8, 0.077],
    [3.0, 0.055], [3.2, 0.040], [3.4, 0.029], [3.6, 0.021], [3.8, 0.015],
    [4.0, 0.011], [4.5, 0.005], [5.0, 0.000],
  ];

  // Linear interpolation helper for SCS table
  const interpolateSCS = (tRatio: number): number => {
    if (tRatio <= 0) return 0;
    if (tRatio >= 5.0) return 0;
    for (let i = 0; i < SCS_TABLE.length - 1; i++) {
      const [t0, q0] = SCS_TABLE[i];
      const [t1, q1] = SCS_TABLE[i + 1];
      if (tRatio >= t0 && tRatio <= t1) {
        const fraction = (tRatio - t0) / (t1 - t0);
        return q0 + fraction * (q1 - q0);
      }
    }
    return 0;
  };

  // 5. Generate Hydrograph using tabular interpolation
  const hydrograph: Array<{ time: number; discharge: number }> = [];
  const timeStep = Tp * 0.1; // Use 0.1 × Tp for adequate resolution
  const clampedStep = Math.max(0.1, Math.min(timeStep, 1.0)); // Clamp between 0.1 and 1.0 hr
  
  for (let t = 0; t <= Tb; t += clampedStep) {
    const ratio = t / Tp;
    const Q = Qp * interpolateSCS(ratio);
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
  let prevI = 0;
  
  // Linear Reservoir Routing Coefficient
  // For Muskingum with X=0 (pure reservoir): S = R × O
  // Routing equation: Q(t) = C1 × I(t-1) + C2 × I(t) + C3 × Q(t-1)
  // Where C1 = C2 = dt / (2R + dt), C3 = (2R - dt) / (2R + dt)
  const C1 = dt / (2 * R + dt);
  const C2 = C1;
  const C3 = (2 * R - dt) / (2 * R + dt);

  for (let t = 0; t <= Tb; t += dt) {
    // Inflow: uniform distribution over Tc (time-area histogram simplified)
    const I_t = t <= Tc ? (A * Ro / Tc) : 0;

    // Linear reservoir routing: Q = C1 × I(t-1) + C2 × I(t) + C3 × Q(t-1)
    const Q = C1 * prevI + C2 * I_t + C3 * prevQ;
    const safeQ = Math.max(0, Q);

    hydrograph.push({ time: parseFloat(t.toFixed(2)), discharge: parseFloat(safeQ.toFixed(4)) });
    prevQ = safeQ;
    prevI = I_t;
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
