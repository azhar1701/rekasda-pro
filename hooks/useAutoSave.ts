import { useEffect, useRef, useCallback, useMemo } from 'react';
import { OfflineStorage } from '../services/offlineStorage';

interface UseAutoSaveOptions {
  key: string;
  data: any;
  delay?: number;
  enabled?: boolean;
  onSave?: (data: any) => void;
  onRestore?: (data: any) => void;
}

export const useAutoSave = ({
  key,
  data,
  delay = 2000,
  enabled = true,
  onSave,
  onRestore
}: UseAutoSaveOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  const isRestoringRef = useRef(false);

  // Memoize serialized data to prevent unnecessary re-renders
  const serializedData = useMemo(() => {
    try {
      return JSON.stringify(data);
    } catch {
      return '';
    }
  }, [data]);

  const saveDraft = useCallback(() => {
    if (!enabled || isRestoringRef.current || serializedData === lastSavedRef.current) return;

    try {
      OfflineStorage.saveDraft(key, data);
      lastSavedRef.current = serializedData;
      onSave?.(data);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [key, serializedData, enabled]); // Remove data and onSave from deps

  const restoreDraft = useCallback(() => {
    if (!enabled) return null;

    try {
      const draft = OfflineStorage.getDraft(key);
      if (draft) {
        isRestoringRef.current = true;
        onRestore?.(draft);
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
      }
      return draft;
    } catch (error) {
      console.error('Failed to restore draft:', error);
      return null;
    }
  }, [key, enabled]); // Remove onRestore from deps

  const clearDraft = useCallback(() => {
    try {
      OfflineStorage.clearDraft(key);
      lastSavedRef.current = '';
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [key]);

  const hasDraft = useCallback(() => {
    try {
      return OfflineStorage.getDraft(key) !== null;
    } catch (error) {
      return false;
    }
  }, [key]);

  useEffect(() => {
    if (!enabled || isRestoringRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(saveDraft, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [serializedData, delay, enabled, saveDraft]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveDraft,
    restoreDraft,
    clearDraft,
    hasDraft
  };
};