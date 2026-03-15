/**
 * tc-kirpich.ts
 * Engine for Kirpich Time of Concentration Calculation
 */

import { z } from 'zod';
import { SNI_VALIDATION_LIMITS } from '../../constants/sni';

export interface KirpichInput {
  L: number; // Channel length in km
  S: number; // Slope in m/m
}

const KirpichInputSchema = z.object({
  L: z.number().min(SNI_VALIDATION_LIMITS.riverLength.min).max(SNI_VALIDATION_LIMITS.riverLength.max),
  S: z.number().min(0.0001).max(1.0),
});

/**
 * calculateKirpichTc
 * Returns the time of concentration in hours.
 */
export const calculateKirpichTc = (input: KirpichInput): number => {
  const validated = KirpichInputSchema.parse(input);
  const { L, S } = validated;
  
  // Kirpich combined formula for Tc (hours)
  // Tc(min) = 0.0195 * (L_meters ^ 0.77) * (S ^ -0.385)
  // Tc(hours) = Tc(min) / 60
  
  const L_meters = L * 1000;
  const tcMinutes = 0.0195 * Math.pow(L_meters, 0.77) * Math.pow(S, -0.385);
  return tcMinutes / 60;
};
