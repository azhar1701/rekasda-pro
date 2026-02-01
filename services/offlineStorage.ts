import { CalculationResult } from '../types';

const STORAGE_KEYS = {
  CALCULATIONS: 'hydrofield_calculations',
  DRAFTS: 'hydrofield_drafts',
  SYNC_QUEUE: 'hydrofield_sync_queue'
};

export class OfflineStorage {
  static saveCalculation(calculation: CalculationResult): void {
    try {
      const stored = this.getCalculations();
      const updated = [calculation, ...stored.filter(c => c.id !== calculation.id)];
      localStorage.setItem(STORAGE_KEYS.CALCULATIONS, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save calculation offline:', error);
    }
  }

  static getCalculations(): CalculationResult[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CALCULATIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load offline calculations:', error);
      return [];
    }
  }

  static saveDraft(key: string, data: any): void {
    try {
      const drafts = this.getDrafts();
      drafts[key] = { data, timestamp: Date.now() };
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }

  static getDraft(key: string): any {
    try {
      const drafts = this.getDrafts();
      return drafts[key]?.data;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }

  static clearDraft(key: string): void {
    try {
      const drafts = this.getDrafts();
      delete drafts[key];
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }

  private static getDrafts(): Record<string, any> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DRAFTS);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  }

  static addToSyncQueue(calculation: CalculationResult): void {
    try {
      const queue = this.getSyncQueue();
      
      // Check for duplicates
      const exists = queue.find(item => item.id === calculation.id);
      if (exists) return;
      
      // Limit queue size to prevent memory issues
      const MAX_QUEUE_SIZE = 50;
      if (queue.length >= MAX_QUEUE_SIZE) {
        queue.shift(); // Remove oldest item
      }
      
      queue.push({ ...calculation, needsSync: true });
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
    }
  }

  static getSyncQueue(): CalculationResult[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  static clearSyncQueue(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
    }
  }

  static getStorageUsage(): { used: number; available: number } {
    try {
      let used = 0;
      const appKeys = Object.values(STORAGE_KEYS);
      
      // Only count app-specific storage
      for (const key of appKeys) {
        const item = localStorage.getItem(key);
        if (item) {
          used += item.length;
        }
      }
      
      // Use Storage API if available, fallback to 5MB estimate
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
          const quota = estimate.quota || 5 * 1024 * 1024;
          return { used, available: quota - used };
        }).catch(() => ({ used, available: 5 * 1024 * 1024 - used }));
      }
      
      return { used, available: 5 * 1024 * 1024 - used };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return { used: 0, available: 0 };
    }
  }
}