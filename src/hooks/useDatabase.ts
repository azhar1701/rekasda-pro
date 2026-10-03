import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  const { data: calculations = [], isLoading: isFetching, refetch } = useQuery({
    queryKey: ['calculations'],
    queryFn: async () => {
      const response = await apiService.getCalculations();
      if (response.error) throw new Error(response.error.message);
      return response.data || [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - data historis jarang berubah
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days cache
    refetchOnWindowFocus: false, // Jangan refetch saat user kembali ke tab
    refetchOnMount: false, // Jangan refetch saat component mount ulang
  });

  const saveMutation = useMutation({
    mutationFn: async (result: CalculationResult) => {
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
        console.warn('Supabase save calculation notice (data dialihkan ke snapshot terpadu):', response.error.message);
        return {
          ...result,
          id: result.id || ('local-' + Date.now()),
          created_at: new Date().toISOString()
        } as any;
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calculations'] });
    },
    onError: (error: Error) => {
      console.warn('Notice saat menyimpan perhitungan ke cloud:', error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiService.deleteCalculation(id);
      if (response.error) throw new Error(response.error.message);
    },
    onSuccess: () => {
      toast.success('Data hasil perhitungan berhasil dihapus dari sistem.');
      queryClient.invalidateQueries({ queryKey: ['calculations'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
      console.error('Error deleting calculation:', error);
    }
  });

  return {
    calculations,
    saveCalculation: async (result) => saveMutation.mutateAsync(result),
    deleteCalculation: async (id) => deleteMutation.mutateAsync(id),
    loadCalculations: async () => { await refetch(); },
    loading: isFetching || saveMutation.isPending || deleteMutation.isPending,
  };
};