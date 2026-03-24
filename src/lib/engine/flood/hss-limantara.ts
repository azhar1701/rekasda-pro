import { safeRange } from '@/lib/utils/precision';
import { z } from 'zod';
import { SNI_VALIDATION_LIMITS } from '../../constants/sni';
import { HSSLimantaraInput, HSSLimantaraOutput } from '@/types/hydrology';

const HSSLimantaraInputSchema = z.object({
  Ro: z.number().min(SNI_VALIDATION_LIMITS.unitRainfall.min).max(SNI_VALIDATION_LIMITS.unitRainfall.max),
  A: z.number().min(SNI_VALIDATION_LIMITS.catchmentArea.min).max(SNI_VALIDATION_LIMITS.catchmentArea.max),
  L: z.number().min(SNI_VALIDATION_LIMITS.riverLength.min).max(SNI_VALIDATION_LIMITS.riverLength.max),
  Lc: z.number().min(0.01).max(SNI_VALIDATION_LIMITS.riverLength.max),
  S: z.number().min(0.0001).max(1.0),
});

/**
 * calculateHSSLimantara
 * Engine for Limantara Synthetic Unit Hydrograph
 */
export const calculateHSSLimantara = (input: HSSLimantaraInput): HSSLimantaraOutput => {
  const validated = HSSLimantaraInputSchema.parse(input);
  const { Ro, A, L, Lc, S } = validated;

  // Limantara Formula Constants (derived for Indonesian watersheds)
  const Tp = 0.044 * Math.pow(L, 0.716) * Math.pow(S, -0.345);
  const Qp = 0.043 * Math.pow(A, 0.505) * Math.pow(L, 0.045) * Math.pow(Lc, 0.005) * Math.pow(S, -0.065);
  const Tb = Math.max(5 * Tp, 24); // Tb approximation for Limantara is often standard 5*Tp or base separation

  const hydrograph: Array<{ time: number; discharge: number }> = [];
  const dt = 0.5;
  
  for (const t of safeRange(0, Tb, dt)) {
    let Q = 0;
    if (t <= Tp) {
      Q = Qp * Math.pow(t / Tp, 1.5);
    } else {
      Q = Qp * Math.exp(-0.8 * (t - Tp));
    }
    hydrograph.push({ time: parseFloat(t.toFixed(2)), discharge: parseFloat((Q * Ro).toFixed(4)) });
  }

  return { 
    Qp: parseFloat((Qp * Ro).toFixed(3)), 
    Tp: parseFloat(Tp.toFixed(2)), 
    Tb: parseFloat(Tb.toFixed(2)), 
    hydrograph 
  };
};
