/**
 * Dependable Flow Calculation Engine
 * Sesuai SNI 6738:2015 - Debit Andalan (Q80)
 */

import { z } from 'zod';

export interface DependableFlowInput {
  /** Data debit harian atau bulanan (m³/s) */
  dischargeData: number[];
  /** Probabilitas keandalan (%) - default 80% */
  probability?: number;
}

export interface DependableFlowOutput {
  /** Debit andalan Q80 (m³/s) */
  Q80: number;
  /** Debit rata-rata (m³/s) */
  Qavg: number;
  /** Debit maksimum (m³/s) */
  Qmax: number;
  /** Debit minimum (m³/s) */
  Qmin: number;
  /** Jumlah data */
  dataCount: number;
}

const DependableFlowSchema = z.object({
  dischargeData: z.array(z.number().nonnegative()).min(12, 'Minimal 12 data (1 tahun)'),
  probability: z.number().min(50).max(95).optional().default(80),
});

/**
 * Menghitung Debit Andalan (Dependable Flow)
 * Sesuai SNI 6738:2015 Pasal 4.2
 * 
 * Debit andalan adalah debit minimum yang dapat diandalkan
 * untuk memenuhi kebutuhan air dengan probabilitas tertentu.
 * 
 * Q80 = Debit yang terlampaui 80% dari waktu
 * (20% kemungkinan debit lebih kecil)
 * 
 * @param input - Data debit dan probabilitas
 * @returns Debit andalan dan statistik
 */
export const calculateDependableFlow = (input: DependableFlowInput): DependableFlowOutput => {
  const validated = DependableFlowSchema.parse(input);
  const { dischargeData, probability = 80 } = validated;

  // Urutkan data dari besar ke kecil
  const sortedData = [...dischargeData].sort((a, b) => b - a);
  const n = sortedData.length;

  // Hitung statistik dasar
  const Qmax = sortedData[0];
  const Qmin = sortedData[n - 1];
  const Qavg = sortedData.reduce((sum, q) => sum + q, 0) / n;

  // Hitung debit andalan dengan metode Weibull
  // P = m / (n + 1) × 100%
  // Dimana m = ranking data (1 = terbesar)
  
  const targetProbability = probability / 100;
  const targetRank = Math.ceil(targetProbability * (n + 1));
  const index = Math.min(targetRank - 1, n - 1);
  
  const Q80 = sortedData[index];

  return {
    Q80: parseFloat(Q80.toFixed(3)),
    Qavg: parseFloat(Qavg.toFixed(3)),
    Qmax: parseFloat(Qmax.toFixed(3)),
    Qmin: parseFloat(Qmin.toFixed(3)),
    dataCount: n,
  };
};

/**
 * Menghitung Debit Andalan Bulanan dari Data Harian
 * 
 * @param dailyData - Data debit harian (m³/s)
 * @param daysPerMonth - Jumlah hari per bulan [31,28,31,...]
 * @returns Array debit andalan bulanan (12 bulan)
 */
export const calculateMonthlyDependableFlow = (
  dailyData: number[],
  daysPerMonth: number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
): number[] => {
  const monthlyQ80: number[] = [];
  let startIndex = 0;

  for (const days of daysPerMonth) {
    const monthData = dailyData.slice(startIndex, startIndex + days);
    
    if (monthData.length > 0) {
      const result = calculateDependableFlow({ dischargeData: monthData });
      monthlyQ80.push(result.Q80);
    } else {
      monthlyQ80.push(0);
    }
    
    startIndex += days;
  }

  return monthlyQ80;
};

/**
 * Analisis Frekuensi Debit (Flow Duration Curve)
 * 
 * @param dischargeData - Data debit
 * @returns Array {probability, discharge}
 */
export const calculateFlowDurationCurve = (dischargeData: number[]) => {
  const sorted = [...dischargeData].sort((a, b) => b - a);
  const n = sorted.length;

  return sorted.map((discharge, index) => {
    const rank = index + 1;
    const probability = (rank / (n + 1)) * 100; // Weibull formula
    
    return {
      probability: parseFloat(probability.toFixed(2)),
      discharge: parseFloat(discharge.toFixed(3)),
    };
  });
};

/**
 * Validasi Ketersediaan Air
 * Sesuai SNI 6738:2015
 * 
 * @param Q80 - Debit andalan (m³/s)
 * @param demand - Kebutuhan air (m³/s)
 * @returns Status ketersediaan
 */
export const validateWaterAvailability = (Q80: number, demand: number) => {
  const ratio = Q80 / demand;
  
  let status: 'Aman' | 'Waspada' | 'Kritis';
  let recommendation: string;

  if (ratio >= 1.5) {
    status = 'Aman';
    recommendation = 'Ketersediaan air mencukupi dengan margin aman';
  } else if (ratio >= 1.0) {
    status = 'Waspada';
    recommendation = 'Ketersediaan air cukup, perlu monitoring berkala';
  } else {
    status = 'Kritis';
    recommendation = 'Ketersediaan air tidak mencukupi, perlu sumber alternatif';
  }

  return {
    ratio: parseFloat(ratio.toFixed(2)),
    status,
    recommendation,
  };
};
