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
import type {
  RationalMethodInput,
  RationalMethodOutput,
  HSSNakayasuInput,
  HSSNakayasuOutput,
} from '@/types/hydrology';

/**
 * Batas Luas DAS untuk Metode Rasional (SNI 2415:2016 Pasal 5.2)
 * Metode Rasional HANYA berlaku untuk DAS ≤ 300 ha (3 km²)
 */
export { SNI_RATIONAL_AREA_LIMIT_KM2, SNI_RATIONAL_AREA_LIMIT_HA } from '../../constants/sni';

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
 * 
 * Aturan SNI 2415:2016 Pasal 5.2:
 * - Luas DAS ≤ 300 ha (3 km²): Metode Rasional DIPERBOLEHKAN
 * - Luas DAS > 300 ha (3 km²): WAJIB menggunakan HSS (Hidrograf Satuan Sintetis)
 * 
 * @param areaKm2 - Luas Daerah Aliran Sungai dalam km²
 * @returns Hasil validasi workflow dengan rekomendasi metode
 * 
 * @example
 * ```ts
 * const result = validateSNI2415Workflow(2.5);
 * // { recommendedMethod: 'rational', isRationalValid: true, areaKm2: 2.5 }
 * 
 * const result2 = validateSNI2415Workflow(25);
 * // { recommendedMethod: 'hss', isRationalValid: false, warning: '...', areaKm2: 25 }
 * ```
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
    warning: `Luas DAS (${areaKm2.toFixed(2)} km² / ${(areaKm2 * 100).toFixed(0)} ha) melebihi batas Metode Rasional (300 ha). Sesuai SNI 2415:2016 Pasal 5.2, gunakan Metode HSS (Hidrograf Satuan Sintetis).`,
    areaKm2,
  };
};

/**
 * Zod Schema - Validasi Input Metode Rasional (SNI 2415:2016 Pasal 5.2)
 */
const RationalInputSchema = z.object({
  C: z
    .number()
    .min(SNI_VALIDATION_LIMITS.runoffCoefficient.min, 'Koefisien Pengaliran (C) harus ≥ 0')
    .max(SNI_VALIDATION_LIMITS.runoffCoefficient.max, 'Koefisien Pengaliran (C) harus ≤ 1'),
  I: z
    .number()
    .min(SNI_VALIDATION_LIMITS.rainfallIntensity.min, 'Intensitas Hujan (I) terlalu rendah')
    .max(SNI_VALIDATION_LIMITS.rainfallIntensity.max, 'Intensitas Hujan (I) tidak realistis'),
  A: z
    .number()
    .min(SNI_VALIDATION_LIMITS.catchmentArea.min, 'Luas DAS (A) harus > 0')
    .max(SNI_RATIONAL_AREA_LIMIT_KM2, `Luas DAS (A) melebihi ${SNI_RATIONAL_AREA_LIMIT_KM2} km² (${SNI_RATIONAL_AREA_LIMIT_HA} ha). Gunakan Metode HSS sesuai SNI 2415:2016.`),
});

/**
 * Metode Rasional - Perhitungan Debit Banjir Rencana
 * 
 * Formula SNI 2415:2016 Pasal 5.2:
 * **Q = 0.278 × C × I × A**
 * 
 * Dimana:
 * - **Q** = Debit puncak banjir rencana (m³/s)
 * - **C** = Koefisien pengaliran (dimensionless, 0-1)
 * - **I** = Intensitas hujan (mm/jam)
 * - **A** = Luas Daerah Aliran Sungai (km²)
 * - **0.278** = Faktor konversi metrik (1/3.6)
 * 
 * Batasan Penggunaan:
 * - Luas DAS ≤ 300 ha (3 km²)
 * - DAS relatif homogen
 * - Waktu konsentrasi < 6 jam
 * 
 * @param input - Parameter input metode rasional
 * @returns Debit puncak dalam m³/s
 * @throws {z.ZodError} Jika input tidak valid atau luas DAS > 3 km²
 * 
 * @standard SNI 2415:2016 Pasal 5.2
 * @reference Permen PU No. 12/PRT/M/2014
 */
export const calculateRationalDischarge = (input: RationalMethodInput): RationalMethodOutput => {
  const validated = RationalInputSchema.parse(input);

  // Perhitungan debit puncak: Q = 0.278 × C × I × A
  const Q = RATIONAL_CONVERSION_FACTOR * validated.C * validated.I * validated.A;

  return { Q: parseFloat(Q.toFixed(3)) };
};

/**
 * Zod Schema - Validasi Input HSS Nakayasu (SNI 2415:2016 Pasal 6.3)
 */
const HSSNakayasuInputSchema = z.object({
  Ro: z
    .number()
    .min(SNI_VALIDATION_LIMITS.unitRainfall.min, 'Hujan satuan (Ro) terlalu kecil')
    .max(SNI_VALIDATION_LIMITS.unitRainfall.max, 'Hujan satuan (Ro) terlalu besar'),
  Tg: z
    .number()
    .min(SNI_VALIDATION_LIMITS.timeLag.min, 'Waktu kelambatan (Tg) terlalu kecil')
    .max(SNI_VALIDATION_LIMITS.timeLag.max, 'Waktu kelambatan (Tg) terlalu besar'),
  Tr: z.number().positive('Durasi hujan efektif (Tr) harus positif'),
  Alpha: z
    .number()
    .min(SNI_VALIDATION_LIMITS.alpha.min, `Parameter hidrograf (α) minimum ${SNI_VALIDATION_LIMITS.alpha.min}`)
    .max(SNI_VALIDATION_LIMITS.alpha.max, `Parameter hidrograf (α) maksimum ${SNI_VALIDATION_LIMITS.alpha.max}`),
  A: z
    .number()
    .min(SNI_VALIDATION_LIMITS.catchmentArea.min, 'Luas DAS (A) harus > 0')
    .max(SNI_VALIDATION_LIMITS.catchmentArea.max, 'Luas DAS (A) terlalu besar'),
  L: z
    .number()
    .min(SNI_VALIDATION_LIMITS.riverLength.min, 'Panjang sungai utama (L) terlalu kecil')
    .max(SNI_VALIDATION_LIMITS.riverLength.max, 'Panjang sungai utama (L) terlalu besar'),
});

/**
 * HSS Nakayasu - Perhitungan Hidrograf Satuan Sintetis
 * 
 * Formula SNI 2415:2016 Pasal 6.3:
 * 
 * 1. **Tg = 0.4 + 0.058 × L** (Waktu kelambatan, jam)
 * 2. **Tp = Tg + 0.8 × Tr** (Waktu puncak, jam)
 * 3. **T0.3 = α × Tg** (Waktu menurun ke 30% Qp, jam)
 * 4. **Qp = (C × A × Ro) / (3.6 × (0.3 × Tp + T0.3))** (Debit puncak, m³/s)
 * 5. **Tb = Tp + 2.5 × T0.3** (Waktu dasar, jam)
 * 
 * Kurva Hidrograf:
 * - **Naik (0 < t ≤ Tp)**: Qt = Qp × (t / Tp)^2.4
 * - **Turun (t > Tp)**: Qt = Qp × 0.3^((t - Tp) / T0.3)
 * 
 * Parameter:
 * - **Ro** = Hujan satuan (mm)
 * - **Tg** = Waktu kelambatan (jam)
 * - **Tr** = Durasi hujan efektif (jam), harus: 0.5 × Tg ≤ Tr ≤ Tg
 * - **α** = Parameter hidrograf (1.5 - 3.0, standar = 2.0)
 * - **A** = Luas DAS (km²)
 * - **L** = Panjang sungai utama (km)
 * - **C** = Koefisien pengaliran (default = 1.0 untuk HSS)
 * 
 * @param input - Parameter input HSS Nakayasu
 * @returns Output hidrograf dengan Qp, Tp, Tb, dan data time-discharge
 * @throws {z.ZodError} Jika input tidak valid
 * 
 * @standard SNI 2415:2016 Pasal 6.3
 */
export const calculateHSSNakayasu = (input: HSSNakayasuInput): HSSNakayasuOutput => {
  const validated = HSSNakayasuInputSchema.parse(input);
  const { Ro, Tg, Tr, Alpha, A, L } = validated;

  // 1. Perhitungan Tg (jika tidak diinput manual): Tg = 0.4 + 0.058 × L
  const Tg_calc = 0.4 + 0.058 * L;
  const Tg_used = Tg ?? Tg_calc;

  // 2. Validasi Tr: 0.5 × Tg ≤ Tr ≤ Tg (SNI 2415:2016)
  const Tr_min = 0.5 * Tg_used;
  const Tr_max = Tg_used;
  if (Tr < Tr_min || Tr > Tr_max) {
    const message = `Durasi hujan efektif (Tr = ${Tr.toFixed(2)} jam) di luar rentang: ${Tr_min.toFixed(2)} - ${Tr_max.toFixed(2)} jam`;
    console.warn('[SNI 2415:2016]', message);
  }

  // 3. Waktu puncak: Tp = Tg + 0.8 × Tr
  const Tp = Tg_used + 0.8 * Tr;

  // 4. Waktu menurun: T0.3 = α × Tg
  const T03 = Alpha * Tg_used;

  // 5. Debit puncak: Qp = (A × Ro) / (3.6 × (0.3 × Tp + T0.3))
  // Catatan: C = 1.0 untuk HSS (asumsi hujan efektif)
  const Qp = (A * Ro) / (3.6 * (0.3 * Tp + T03));

  // 6. Waktu dasar: Tb = Tp + 2.5 × T0.3
  const Tb = Tp + 2.5 * T03;

  // 7. Generate hidrograf
  const hydrograph: Array<{ time: number; discharge: number }> = [];
  const timeStep = 0.1;
  const maxTime = Tb + 2 * T03;

  for (let t = 0; t <= maxTime; t += timeStep) {
    let Q = 0;
    if (t > 0 && t <= Tp) {
      // Kurva naik: Qt = Qp × (t / Tp)^2.4
      Q = Qp * Math.pow(t / Tp, 2.4);
    } else if (t > Tp) {
      // Kurva turun: Qt = Qp × 0.3^((t - Tp) / T0.3)
      Q = Qp * Math.pow(0.3, (t - Tp) / T03);
    }
    hydrograph.push({ time: parseFloat(t.toFixed(2)), discharge: parseFloat(Q.toFixed(4)) });
  }

  return {
    Qp: parseFloat(Qp.toFixed(3)),
    Tp: parseFloat(Tp.toFixed(2)),
    Tb: parseFloat(Tb.toFixed(2)),
    hydrograph,
  };
};

/**
 * Validasi Input Metode Rasional
 * @param input - Input yang akan divalidasi
 * @returns true jika valid
 * @throws {z.ZodError} Jika input tidak valid
 */
export const validateRationalInput = (input: RationalMethodInput): void => {
  RationalInputSchema.parse(input);
};

/**
 * Validasi Input HSS Nakayasu
 * @param input - Input yang akan divalidasi
 * @throws {z.ZodError} Jika input tidak valid
 */
export const validateHSSNakayasuInput = (input: HSSNakayasuInput): void => {
  HSSNakayasuInputSchema.parse(input);
};
