import { safeRange } from '@/lib/utils/precision';
import { z } from 'zod';
import { SNI_VALIDATION_LIMITS } from '../../constants/sni';
import { HSSGamma1Input, HSSGamma1Output } from '@/types/hydrology';

const HSSGamma1InputSchema = z.object({
  Ro: z.number().min(SNI_VALIDATION_LIMITS.unitRainfall.min).max(SNI_VALIDATION_LIMITS.unitRainfall.max),
  A: z.number().positive(),
  L: z.number().positive(),
  S: z.number().positive(),
  SF: z.number().min(0.0001).max(100),
  SIM: z.number().min(0.0001).max(100),
  JN: z.number().min(0.0001).max(100),
  SN: z.number().min(0.0001).max(1.0),
  RUA: z.number().min(0.0001).max(1.0),
});

/**
 * calculateHSSGamma1
 * Engine for Gadjah Mada (Gamma I) Synthetic Unit Hydrograph
 */
export const calculateHSSGamma1 = (input: HSSGamma1Input): HSSGamma1Output => {
  const validated = HSSGamma1InputSchema.parse(input);
  const { Ro, A, L, S, SF, SIM, JN, SN, RUA } = validated;

  const TR = 0.43 * Math.pow(L / (100 * SF), 3) + 1.0665 * SIM + 1.2775;
  const QP = 0.1836 * Math.pow(A, 0.5886) * Math.pow(TR, -0.4008) * Math.pow(JN, 0.2381);
  const TB = 27.4132 * Math.pow(TR, 0.1457) * Math.pow(S, -0.0986) * Math.pow(SN, 0.7344) * Math.pow(RUA, 0.2574);
  const K = (TB - TR) / 3;

  const hydrograph: Array<{ time: number; discharge: number }> = [];
  const dt = 0.1;
  const maxTime = Math.max(TB, 24);

  for (const t of safeRange(0, maxTime, dt)) {
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
