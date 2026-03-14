import { useEffect } from 'react';
import { offlineStorage } from '@/services/offlineStorageService';
import { apiService } from '@/services/api.service';
import { toast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';

export const useOfflineSync = () => {
  const queryClient = useQueryClient();

  const syncData = async () => {
    try {
      const pending = await offlineStorage.getAllPending();
      if (pending.length === 0) return;

      console.log(`[OfflineSync] Attempting to sync ${pending.length} items...`);
      let successCount = 0;

      for (const item of pending) {
        // Prepare data for saveCalculation
        const response = await apiService.saveCalculation(item.data);
        
        if (response.status === 'success') {
          await offlineStorage.clearCalculation(item.id!);
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} data offline berhasil disinkronkan ke server.`);
        queryClient.invalidateQueries({ queryKey: ['calculations'] });
      }
    } catch (error) {
      console.error('[OfflineSync] Sync failed:', error);
    }
  };

  useEffect(() => {
    // Initial sync check on mount
    if (navigator.onLine) {
      syncData();
    }

    const handleOnline = () => {
      console.log('[OfflineSync] System online, triggering sync...');
      syncData();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return { syncData };
};
