import { useState, useCallback } from 'react';
import type { ManningInputs, RationalInputs, ManningOutputs, RationalOutputs } from '../types';

export const useHydraulicCalculations = (): {
  manningResults: ManningOutputs | null;
  rationalResults: RationalOutputs | null;
  isCalculating: boolean;
  error: string | null;
  calculateManningChannel: (inputs: ManningInputs) => ManningOutputs | null;
  calculateRationalMethod: (inputs: RationalInputs) => RationalOutputs | null;
  clearResults: () => void;
} => {
  const [manningResults, setManningResults] = useState<ManningOutputs | null>(null);
  const [rationalResults, setRationalResults] = useState<RationalOutputs | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const calculateManningChannel = useCallback((_inputs: ManningInputs): ManningOutputs | null => {
    try {
      setIsCalculating(true);
      setError(null);
      // Placeholder calculation - replace with actual logic
      const results: ManningOutputs = {
        velocity: 0,
        discharge: 0,
        area: 0,
        wettedPerimeter: 0,
        hydraulicRadius: 0,
        froudeNumber: 0,
      };
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

  const calculateRationalMethod = useCallback((_inputs: RationalInputs): RationalOutputs | null => {
    try {
      setIsCalculating(true);
      setError(null);
      // Placeholder calculation - replace with actual logic
      const results: RationalOutputs = {
        discharge: 0,
        concentrationTime: 0,
        intensity: 0,
      };
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

  const clearResults = useCallback((): void => {
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
