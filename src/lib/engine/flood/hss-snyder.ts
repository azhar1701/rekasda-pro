import { safeRange } from '@/lib/utils/precision';
import { z } from 'zod';
import { SNI_VALIDATION_LIMITS } from '../../constants/sni';
import { HSSSnyderInput, HSSSnyderOutput } from '@/types/hydrology';

const HSSSnyderInputSchema = z.object({
  Ro: z.number().min(SNI_VALIDATION_LIMITS.unitRainfall.min).max(SNI_VALIDATION_LIMITS.unitRainfall.max),
  A: z.number().min(SNI_VALIDATION_LIMITS.catchmentArea.min).max(SNI_VALIDATION_LIMITS.catchmentArea.max),
  L: z.number().min(SNI_VALIDATION_LIMITS.riverLength.min).max(SNI_VALIDATION_LIMITS.riverLength.max),
  Lc: z.number().min(0.01).max(SNI_VALIDATION_LIMITS.riverLength.max),
  Ct: z.number().min(0.1).max(10),
  Cp: z.number().min(0.1).max(10),
});

/**
 * calculateHSSSnyder
 * Engine for Snyder's Synthetic Unit Hydrograph
 */
export const calculateHSSSnyder = (input: HSSSnyderInput): HSSSnyderOutput => {
  const validated = HSSSnyderInputSchema.parse(input);
  const { Ro, A, L, Lc, Ct, Cp } = validated;

  const tpR = Ct * Math.pow(L * Lc, 0.3);
  const tr = tpR / 5.5;
  const Tp = tpR + 0.25 * tr;
  const Qp = (2.78 * Cp * A * Ro) / Tp;
  const Tb = 5.56 * Tp; // Standard Snyder: Tb ≈ 5.56 * Tp

  const hydrograph: Array<{ time: number; discharge: number }> = [];
  const dt = 0.2;
  
  for (const t of safeRange(0, Tb, dt)) {
    let Q = 0;
    if (t <= Tp) {
        Q = Qp * Math.pow(t / Tp, 2.0);
    } else {
        Q = Qp * Math.pow((Tb - t) / (Tb - Tp), 1.2);
    }
    hydrograph.push({ time: parseFloat(t.toFixed(2)), discharge: parseFloat(Q.toFixed(4)) });
  }

  return { 
    Qp: parseFloat(Qp.toFixed(3)), 
    Tp: parseFloat(Tp.toFixed(2)), 
    Tb: parseFloat(Tb.toFixed(2)), 
    hydrograph 
  };
};
