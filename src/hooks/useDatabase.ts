import { useState, useEffect } from 'react';
import { apiService } from '@/services/api.service';
import type { CalculationRecord } from '@/types/database.types';
import { CalculationResult, CalculationType } from '@/types';
import { toast } from './useToast';

interface UseDatabaseReturn {
  calculations: CalculationRecord[];
  saveCalculation: (result: CalculationResult) => Promise<CalculationRecord | null>;
  deleteCalculation: (id: string) => Promise<void>;
  loadCalculations: () => Promise<void>;
  loading: boolean;
}

export const useDatabase = (): UseDatabaseReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [calculations, setCalculations] = useState<CalculationRecord[]>([]);

  const saveCalculation = async (result: CalculationResult): Promise<CalculationRecord | null> => {
    setLoading(true);
    try {
      const siteName = typeof result.inputs === 'object' && result.inputs !== null && 'site' in result.inputs
        ? (result.inputs.site as { channelName?: string })?.channelName || 'Unknown Site'
        : 'Unknown Site';

      const response = await apiService.saveCalculation({
        site_name: siteName,
        calculation_type: result.type === CalculationType.MANNING ? 'manning' : 'rational',
        input_data: result.inputs,
        result_data: result.outputs,
        location: result.location || null,
        photo_url: result.photoUrl || null,
        notes: result.notes || null,
      });
      
      if (response.error) {
        toast.error(response.error.message);
        throw new Error(response.error.message);
      }
      
      toast.success('Data berhasil disimpan');
      if (response.data) {
        setCalculations(prev => [response.data!, ...prev]);
      }
      return response.data;
    } catch (error) {
      console.error('Error saving calculation:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadCalculations = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await apiService.getCalculations();
      if (response.error) {
        console.error('Error loading calculations:', response.error);
        setCalculations([]);
        return;
      }
      setCalculations(response.data || []);
    } catch (error) {
      console.error('Error loading calculations:', error);
      setCalculations([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteCalculation = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await apiService.deleteCalculation(id);
      
      if (response.error) {
        toast.error(response.error.message);
        throw new Error(response.error.message);
      }
      
      toast.success('Data berhasil dihapus');
      setCalculations(prev => prev.filter(calc => calc.id !== id));
    } catch (error) {
      console.error('Error deleting calculation:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCalculations();
  }, []);

  return {
    calculations,
    saveCalculation,
    deleteCalculation,
    loadCalculations,
    loading,
  };
};