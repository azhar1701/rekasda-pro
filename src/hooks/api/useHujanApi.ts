import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AbmRequest {
  R24: number;
  method?: 'mononobe' | 'van_breen' | 'haspers';
  n?: number;
}

interface AbmResult {
  [key: string]: number | string | number[];
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Mutation hook for Alternating Block Method (ABM) hyetograph generation.
 * Endpoint: POST /api/v1/hujan/abm
 */
export function useAbmMutation() {
  return useMutation({
    mutationKey: ['hujan', 'abm'],
    mutationFn: (payload: AbmRequest) =>
      apiClient.post<AbmResult>('/api/v1/hujan/abm', payload),
  });
}
