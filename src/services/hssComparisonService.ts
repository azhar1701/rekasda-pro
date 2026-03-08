/**
 * TAHAP 2: Method Comparison Engine
 * Menjalankan semua metode HSS secara paralel untuk perbandingan
 */

import { calculateHSSNakayasu, calculateHSSSnyder } from '@/lib/engine/flood';
import { calculateHSSGamma1 } from '@/lib/engine/flood';
import { calculateMononobeIntensity } from '@/lib/utils/hydrology/runoff';
import type { HSSComparisonResult } from '@/stores/useHydrologyStore';

export interface HSSComparisonInput {
  /** Hujan Efektif (mm) */
  effectiveRainfall: number;
  /** Luas DAS (km²) */
  A: number;
  /** Panjang Sungai Utama (km) */
  L: number;
  /** Panjang ke titik berat DAS (km) - untuk Snyder */
  Lc?: number;
  /** Durasi hujan satuan (jam) */
  Tr?: number;
  /** Parameter Alpha untuk Nakayasu */
  alpha?: number;
  /** Koefisien Ct untuk Snyder */
  Ct?: number;
  /** Koefisien Cp untuk Snyder */
  Cp?: number;
  /** Source Factor untuk Gamma-1 */
  SF?: number;
}

/**
 * Menjalankan semua metode HSS dan mengembalikan hasil perbandingan
 */
export async function calculateAllHSS(
  input: HSSComparisonInput
): Promise<HSSComparisonResult[]> {
  const results: HSSComparisonResult[] = [];
  
  const { effectiveRainfall, A, L, Lc, Tr, alpha, Ct, Cp, SF } = input;

  // Default parameters
  const defaultTr = Tr || 0.5 * (0.21 * Math.pow(L, 0.7));
  const defaultAlpha = alpha || 2.0;
  const defaultLc = Lc || L * 0.6;
  const defaultCt = Ct || 0.6;
  const defaultCp = Cp || 0.6;
  const defaultSF = SF || 1.0;
  const Tg = 0.21 * Math.pow(L, 0.7);

  // 1. HSS Nakayasu
  try {
    const nakayasu = calculateHSSNakayasu({
      Ro: effectiveRainfall,
      Tg,
      Tr: defaultTr,
      Alpha: defaultAlpha,
      A,
      L,
    });
    
    results.push({
      method: 'Nakayasu',
      Qp: nakayasu.Qp,
      Tp: nakayasu.Tp,
      Tb: nakayasu.Tb,
      hydrograph: nakayasu.hydrograph,
      color: '#3b82f6', // blue
    });
  } catch (error) {
    console.error('Nakayasu calculation failed:', error);
  }

  // 2. HSS Snyder
  try {
    const snyder = calculateHSSSnyder({
      Ro: effectiveRainfall,
      A,
      L,
      Lc: defaultLc,
      Ct: defaultCt,
      Cp: defaultCp,
    });
    
    results.push({
      method: 'Snyder',
      Qp: snyder.Qp,
      Tp: snyder.Tp,
      Tb: snyder.Tb,
      hydrograph: snyder.hydrograph,
      color: '#10b981', // green
    });
  } catch (error) {
    console.error('Snyder calculation failed:', error);
  }

  // 3. HSS Gamma-1 (ITB-1)
  try {
    const gamma1 = calculateHSSGamma1({
      Ro: effectiveRainfall,
      A,
      L,
      SF: defaultSF,
    });
    
    results.push({
      method: 'Gamma-1 (ITB-1)',
      Qp: gamma1.Qp,
      Tp: gamma1.Tp,
      Tb: gamma1.Tb,
      hydrograph: gamma1.hydrograph,
      color: '#f59e0b', // amber
    });
  } catch (error) {
    console.error('Gamma-1 calculation failed:', error);
  }

  // 4. SCS (Placeholder - implement if available)
  // try {
  //   const scs = calculateHSSSCS({ ... });
  //   results.push({ method: 'SCS', ... });
  // } catch (error) {}

  // 5. ITB-2 (Placeholder - implement if available)
  // try {
  //   const itb2 = calculateHSSITB2({ ... });
  //   results.push({ method: 'ITB-2', ... });
  // } catch (error) {}

  return results;
}

/**
 * Membandingkan distribusi hujan (Mononobe vs PSA-007)
 */
export interface RainfallDistributionComparison {
  method: string;
  hourlyDistribution: number[];
  peakIntensity: number;
  totalDepth: number;
}

export function compareRainfallDistributions(
  totalRainfall: number,
  duration: number
): RainfallDistributionComparison[] {
  const results: RainfallDistributionComparison[] = [];

  // Mononobe
  const mononobe = calculateMononobeDistribution(totalRainfall, duration);
  results.push({
    method: 'Mononobe',
    hourlyDistribution: mononobe,
    peakIntensity: Math.max(...mononobe),
    totalDepth: mononobe.reduce((a, b) => a + b, 0),
  });

  // PSA-007 (Alternating Block Method)
  const psa007 = calculatePSA007Distribution(totalRainfall, duration);
  results.push({
    method: 'PSA-007',
    hourlyDistribution: psa007,
    peakIntensity: Math.max(...psa007),
    totalDepth: psa007.reduce((a, b) => a + b, 0),
  });

  return results;
}

function calculateMononobeDistribution(R: number, duration: number): number[] {
  const distribution: number[] = [];
  for (let t = 1; t <= duration; t++) {
    const I = calculateMononobeIntensity(R, t);
    distribution.push(I);
  }
  return distribution;
}

function calculatePSA007Distribution(R: number, duration: number): number[] {
  // Simplified alternating block method
  const incremental: number[] = [];
  for (let t = 1; t <= duration; t++) {
    const cumulative_t = (R / 24) * Math.pow(24 / t, 2 / 3) * t;
    const cumulative_prev = t > 1 ? (R / 24) * Math.pow(24 / (t - 1), 2 / 3) * (t - 1) : 0;
    incremental.push(cumulative_t - cumulative_prev);
  }
  
  // Rearrange with peak at center
  incremental.sort((a, b) => b - a);
  const rearranged: number[] = [];
  const mid = Math.floor(duration / 2);
  
  for (let i = 0; i < incremental.length; i++) {
    if (i % 2 === 0) {
      rearranged[mid + Math.floor(i / 2)] = incremental[i];
    } else {
      rearranged[mid - Math.ceil(i / 2)] = incremental[i];
    }
  }
  
  return rearranged.filter(v => v !== undefined);
}
