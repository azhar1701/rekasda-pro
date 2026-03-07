import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FjMockRequest {
  m: number;         // Monthly water storage coefficient
  i: number;         // Infiltration coefficient
  area: number;      // DAS area (km²)
  El: number;        // Evapotranspiration limited estimate (mm)
  temperature: number[];
  rainfall: number[];
  daysInMonth?: number[];
}

interface FjMockMonthlyResult {
  month: number;
  rainfall: number;
  evapotranspiration: number;
  soilStorage: number;
  baseflow: number;
  directRunoff: number;
  totalRunoff: number;
  discharge: number;
}

interface FjMockResult {
  monthlyResults: FjMockMonthlyResult[];
  annualTotalDischarge: number;
  dependableFlowQ80: number;
}

// ---

interface IrigasiRequest {
  cropPattern: string;
  area: number;         // Luas area irigasi (ha)
  efficiency?: number;  // Efisiensi irigasi (0–1)
}

interface IrigasiMonthResult {
  month: string;
  nfr: number;
  dr: number;
}

interface IrigasiResult {
  monthlyDemand: IrigasiMonthResult[];
  peakDemand: number;
  annualDemand: number;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** POST /api/v1/neraca-air/fj-mock — F.J. Mock monthly water balance */
export function useFjMockMutation() {
  return useMutation({
    mutationKey: ['neraca-air', 'fj-mock'],
    mutationFn: (payload: FjMockRequest) =>
      apiClient.post<FjMockResult>('/api/v1/neraca-air/fj-mock', payload),
  });
}

/** POST /api/v1/neraca-air/kebutuhan-irigasi — Irrigation Demand (NFR/DR) */
export function useKebutuhanIrigasiMutation() {
  return useMutation({
    mutationKey: ['neraca-air', 'kebutuhan-irigasi'],
    mutationFn: (payload: IrigasiRequest) =>
      apiClient.post<IrigasiResult>('/api/v1/neraca-air/kebutuhan-irigasi', payload),
  });
}
