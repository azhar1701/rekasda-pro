import { useState, useCallback } from 'react';
import { ManningInputs, RationalInputs } from '@/types/types';
import { calculateManning, calculateRational } from '@/services/calculationService';

export const useHydraulicCalculations = () => {
  const [manningResults, setManningResults] = useState<any>(null);
  const [rationalResults, setRationalResults] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateManningChannel = useCallback((inputs: ManningInputs) => {
    try {
      setIsCalculating(true);
      setError(null);
      const results = calculateManning(inputs);
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

  const calculateRationalMethod = useCallback((inputs: RationalInputs) => {
    try {
      setIsCalculating(true);
      setError(null);
      const results = calculateRational(inputs);
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
