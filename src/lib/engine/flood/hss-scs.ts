import { safeRange } from '@/lib/utils/precision';
import { z } from 'zod';
import { SNI_VALIDATION_LIMITS } from '../../constants/sni';
import { HSSSCSInput, HSSSCSOutput } from '@/types/hydrology';

const HSSSCSInputSchema = z.object({
  Ro: z.number().min(SNI_VALIDATION_LIMITS.unitRainfall.min).max(SNI_VALIDATION_LIMITS.unitRainfall.max),
  A: z.number().min(SNI_VALIDATION_LIMITS.catchmentArea.min).max(SNI_VALIDATION_LIMITS.catchmentArea.max),
  L: z.number().min(0.1).max(1000),
  S: z.number().min(0.0001).max(1.0),
  Tc: z.number().optional(),
});

/**
 * calculateHSSSCS
 * Engine for Soil Conservation Service (SCS) Synthetic Unit Hydrograph
 */
export const calculateHSSSCS = (input: HSSSCSInput): HSSSCSOutput => {
  const validated = HSSSCSInputSchema.parse(input);
  let { Ro, A, L, S, Tc } = validated;

  // If Tc is not provided, calculate using standard Kirpich/SCS empirical relationship.
  if (!Tc) {
    Tc = 0.0195 * Math.pow(L * 1000, 0.77) * Math.pow(S, -0.385) / 60;
  }
  
  const Tp = 0.6 * Tc + 0.5;
  const Qp = (0.208 * A * Ro) / Tp;
  const Tb = 5 * Tp;

  const hydrograph: Array<{ time: number; discharge: number }> = [];
  for (const t of safeRange(0, Tb, 0.5)) {
    const ratio = t / Tp;
    let Q = ratio <= 1 
      ? Qp * Math.pow(ratio, 1.5) * Math.exp(1.5 * (1 - ratio)) 
      : Qp * Math.pow(ratio, -1.5) * Math.exp(-1.5 * (ratio - 1));
    hydrograph.push({ time: parseFloat(t.toFixed(2)), discharge: parseFloat(Q.toFixed(4)) });
  }

  return { 
    Qp: parseFloat(Qp.toFixed(3)), 
    Tp: parseFloat(Tp.toFixed(2)), 
    Tb: parseFloat(Tb.toFixed(2)), 
    hydrograph 
  };
};
