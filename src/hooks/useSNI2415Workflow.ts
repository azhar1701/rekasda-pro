/**
 * Professional Decision Tree Hook - SNI 2415:2016 Workflow
 * Recommends the correct hydrological method based on Area and Project Objective.
 */

import { useMemo } from 'react';
import { 
  getEngineeringRecommendation, 
  type ProjectObjective, 
  type DecisionResult 
} from '@/utils/engineeringDecisionTree';

/**
 * Professional Engineering Hook for Method Selection
 * 
 * This hook acts as the "Decision Brain" for the UI. It ensures that 
 * the application follows SNI 2415:2016 standards and Indonesian 
 * engineering practices (PUPR).
 * 
 * @param areaKm2 - The catchment area (Luas DAS) in km²
 * @param objective - 'peak_only' (Drainage/Bridges) or 'hydrograph_routing' (Dams/Reservoirs)
 * @returns DecisionResult containing Primary and Alternative methods
 */
export const useEngineeringDecision = (
  areaKm2: number | undefined | null,
  objective: ProjectObjective = 'peak_only'
): DecisionResult | null => {
  return useMemo(() => {
    if (areaKm2 === undefined || areaKm2 === null || isNaN(areaKm2) || areaKm2 <= 0) {
      return null;
    }
    
    return getEngineeringRecommendation(areaKm2, objective);
  }, [areaKm2, objective]);
};

/**
 * Legacy Wrapper for backward compatibility
 * @deprecated Use useEngineeringDecision instead for professional method selection.
 */
export const useSNI2415Workflow = (areaKm2: number) => {
  const decision = useEngineeringDecision(areaKm2, 'peak_only');
  return {
    recommendedMethod: decision?.primaryMethod.id === 'RATIONAL' ? 'rational' : 'hss',
    isRationalValid: areaKm2 <= 3.0,
    warning: decision?.primaryMethod.id !== 'RATIONAL' && areaKm2 > 3.0 
      ? `Luas DAS (${areaKm2.toFixed(2)} km²) melebihi batas Metode Rasional (3 km²).` 
      : undefined,
    areaKm2,
  };
};
