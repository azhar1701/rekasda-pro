import { safeRange } from '@/lib/utils/precision';
import { z } from 'zod';
import { SNI_VALIDATION_LIMITS } from '../../constants/sni';
import { HSSITB1Input, HSSITB1Output } from '@/types/hydrology';

const HSSITB1InputSchema = z.object({
  Ro: z.number().min(SNI_VALIDATION_LIMITS.unitRainfall.min).max(SNI_VALIDATION_LIMITS.unitRainfall.max),
  A: z.number().min(SNI_VALIDATION_LIMITS.catchmentArea.min).max(SNI_VALIDATION_LIMITS.catchmentArea.max),
  L: z.number().min(SNI_VALIDATION_LIMITS.riverLength.min).max(SNI_VALIDATION_LIMITS.riverLength.max),
  S: z.number().min(0.0001).max(1.0),
});

/**
 * calculateHSSITB1
 * Engine for ITB-1 Synthetic Unit Hydrograph
 * Developed by Institut Teknologi Bandung (1995) for Java flow models
 */
export const calculateHSSITB1 = (input: HSSITB1Input): HSSITB1Output => {
  const validated = HSSITB1InputSchema.parse(input);
  const { Ro, A, L, S } = validated;

  // ITB-1 Parameters
  const Tp = 0.5 * Math.pow(L / Math.sqrt(S), 0.5); 
  const Qp = (0.278 * A) / Tp; // Triangular approximation volume
  const Tb = 3 * Tp;

  const hydrograph: Array<{ time: number; discharge: number }> = [];
  const dt = 0.5;
  
  for (const t of safeRange(0, Tb, dt)) {
    let Q = 0;
    if (t <= Tp) {
      Q = Qp * (t / Tp);
    } else {
      Q = Qp * ((Tb - t) / (Tb - Tp));
    }
    const finalQ = Math.max(0, Q * Ro);
    hydrograph.push({ time: parseFloat(t.toFixed(2)), discharge: parseFloat(finalQ.toFixed(4)) });
  }

  return { 
    Qp: parseFloat((Qp * Ro).toFixed(3)), 
    Tp: parseFloat(Tp.toFixed(2)), 
    Tb: parseFloat(Tb.toFixed(2)), 
    hydrograph 
  };
};
