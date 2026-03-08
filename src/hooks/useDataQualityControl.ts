import { useCallback } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { runFullQC, RainfallData, QCValidationError } from '@/lib/utils/qc/dataQualityMath';

export const useDataQualityControl = () => {
  const { setQCStatus, setError } = useHydrologyStore();

  const runQC = useCallback((data: RainfallData[]) => {
    try {
      const result = runFullQC(data);
      
      setQCStatus({
        '_default': {
          konsisten: result.isKonsisten,
          bebasOutlier: result.isBebasOutlier,
          homogen: result.isHomogen,
        }
      });

      // Log summary for debugging
      if (import.meta.env.DEV) {
        // Log removed
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof QCValidationError 
        ? error.message 
        : error instanceof Error 
        ? error.message 
        : 'Gagal menjalankan Quality Control';
      
      setError(errorMessage);
      
      // Reset QC status on error
      setQCStatus(null);
      
      throw error;
    }
  }, [setQCStatus, setError]);

  return { runQC };
};
