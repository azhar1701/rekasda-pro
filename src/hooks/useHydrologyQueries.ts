import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/api/supabase';
import { addToQueue } from '@/lib/utils/offlineQueue';

// Example Static Dataset Shape
export interface SNICoefficients {
  version: string;
  rational_limits: { max_area_ha: number };
  nakayasu_alpha: number;
}

/**
 * Custom hook to fetch SNI constants.
 * Uses aggressive caching since engineering standards do not change often.
 */
export const useSNIConstants = () => {
  return useQuery<SNICoefficients, Error>({
    queryKey: ['sni_constants'],
    queryFn: async () => {
      // In a real app, this might come from a static JSON or Supabase table
      const response = await fetch('/data/sni_coefficients.json');
      if (!response.ok) {
        throw new Error('Failed to fetch SNI Constants');
      }
      return response.json();
    },
    // The critical performance settings: Cache indefinitely
    staleTime: Infinity,           // Data is never considered stale
    gcTime: Infinity,              // Don't garbage collect this memory
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

/**
 * Example Custom Hook demonstrating form submittal with Offline Queue fallback.
 * Uses TanStack's useMutation combined with `offlineQueue.ts`.
 */
export const useSubmitHydrologyData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      if (!navigator.onLine) {
        // Device is clearly offline, jump straight to IDB queueing
        await addToQueue('/api/v1/hydrology/sync', 'POST', payload);
        return { offline: true };
      }

      // Online: Attempt normal network request
      try {
        if (!supabase) throw new Error('Supabase not configured');
        
        // Example: posting to an Edge Function
        const { data, error } = await supabase.functions.invoke('hydro-sync', {
          body: payload
        });
        
        if (error) throw new Error(error.message);
        return data;
      } catch (e: any) {
        // If the request fails due to sudden network loss, enqueue it
        if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
          await addToQueue('/api/v1/hydrology/sync', 'POST', payload);
          return { offline: true };
        }
        throw e;
      }
    },
    onSuccess: (data) => {
      if (!data?.offline) {
        // Invalidate queries so tables refresh instantly with the newly synced record
        queryClient.invalidateQueries({ queryKey: ['hydrology_records'] });
      }
    }
  });
};
