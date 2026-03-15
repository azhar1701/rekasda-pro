import { useState, useCallback } from 'react';
import { ManningInputs, RationalInputs } from '@/types/types';
import { calculateManning, calculateRational } from '@/services/calculationService';
import { apiService } from '@/services/api.service';
import { isSupabaseEnabled } from '@/lib/api/supabase';

export const useHydraulicCalculations = () => {
  const [manningResults, setManningResults] = useState<any>(null);
  const [rationalResults, setRationalResults] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateManningChannel = useCallback(async (inputs: ManningInputs, useEdgeFunction = false) => {
    try {
      setIsCalculating(true);
      setError(null);
      
      let results;
      if (useEdgeFunction && isSupabaseEnabled()) {
        const response = await apiService.invokeFunction<any>('hydrology-calculations', {
          type: 'manning',
          inputs
        });
        if (response.error) throw new Error(response.error.message);
        results = response.data;
      } else {
        results = calculateManning(inputs);
      }
      
      setManningResults(results);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Calculation failed';
      setError(errorMessage);
      setManningResults(null);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  const calculateRationalMethod = useCallback(async (inputs: RationalInputs, useEdgeFunction = true) => {
    try {
      setIsCalculating(true);
      setError(null);
      
      let results;
      if (useEdgeFunction && isSupabaseEnabled()) {
        const response = await apiService.invokeFunction<any>('hydro-calc', {
          method: 'rational',
          basin_parameters: {
             catchment_area_km2: inputs.area,
             runoff_coefficient_c: inputs.runoffCoefficient,
             rainfall_intensity_mm: inputs.rainfallDesign
          }
        });
        if (response.error) throw new Error(response.error.message);
        
        // Map the Edge Function response back to frontend expected shapes
        const fallbackResults = calculateRational(inputs);
        results = { 
           ...fallbackResults, // Use fallback for other strings like Intensity/Tc string values
           Discharge: response.data?.summary?.peak_discharge_m3s 
             ? response.data.summary.peak_discharge_m3s.toString()
             : fallbackResults.Discharge
        };
      } else {
        results = calculateRational(inputs);
      }
      
      setRationalResults(results);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Calculation failed';
      setError(errorMessage);
      setRationalResults(null);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setManningResults(null);
    setRationalResults(null);
    setError(null);
  }, []);

  return {
    manningResults,
    rationalResults,
    isCalculating,
    error,
    calculateManningChannel,
    calculateRationalMethod,
    clearResults,
  };
};
