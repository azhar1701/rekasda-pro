import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface KapasitasRequest {
  inflow: number[];
  outflow: number[];
}

interface MassCurvePoint {
  month: number;
  cumulativeInflow: number;
  cumulativeOutflow: number;
}

interface KapasitasResult {
  maxStorageRequired: number;
  massCurveData: MassCurvePoint[];
  warnings?: string[];
}

// ---

interface InflowPoint {
  time: number;      // seconds
  discharge: number; // m³/s
}

interface StageCurve {
  elevation: number[];
  storage: number[];
  area?: number[];
  discharge?: number[];
}

interface RoutingRequest {
  inflowHydrograph: InflowPoint[];
  stageStorageCurve: StageCurve;
  stageDischargeCurve: StageCurve;
  deltaT?: number;
  initialElevation?: number;
}

interface RoutingStep {
  time: number;
  inflowAvg: number;
  outflow: number;
  elevation: number;
}

interface RoutingResult {
  steps: RoutingStep[];
  peakInflow: number;
  peakOutflow: number;
  attenuationRatio: number;
}

// ---

interface ReservoirOperationRequest {
  initialStorage: number;
  inflows: number[];
  demands: number[];
  evaporation: number[];
  infiltration: number[];
  sMax: number;
  sMin: number;
}

interface ReservoirStep {
  finalStorage: number;
  deficitVolume: number;
  spillVolume: number;
  status: string;
}

interface ReservoirOperationResult {
  steps: ReservoirStep[];
  reliability: number;
}

// ---

interface SedimentationRequest {
  qData: number[];
  qsData: number[];
  luasDas: number;
  beratJenis: number;
  bedLoadPercentage: number;
  flowDurationDays: number[];
  flowDurationQ: number[];
}

interface SedimentationResult {
  totalVolumeM3: number;
  erosionRateMm: number;
  totalLoadTonnes: number;
  a: number;
  b: number;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** POST /api/v1/embung/kapasitas — Rippl/Sequent Peak */
export function useKapasitasMutation() {
  return useMutation({
    mutationKey: ['embung', 'kapasitas'],
    mutationFn: (payload: KapasitasRequest) =>
      apiClient.post<KapasitasResult>('/api/v1/embung/kapasitas', payload),
  });
}

/** POST /api/v1/embung/routing — Level-Pool Flood Routing */
export function useRoutingMutation() {
  return useMutation({
    mutationKey: ['embung', 'routing'],
    mutationFn: (payload: RoutingRequest) =>
      apiClient.post<RoutingResult>('/api/v1/embung/routing', payload),
  });
}

/** POST /api/v1/embung/neraca-air — Water Balance / Reservoir Operation */
export function useNeracaAirEmbungMutation() {
  return useMutation({
    mutationKey: ['embung', 'neraca-air'],
    mutationFn: (payload: ReservoirOperationRequest) =>
      apiClient.post<ReservoirOperationResult>('/api/v1/embung/neraca-air', payload),
  });
}

/** POST /api/v1/embung/sedimen — Sediment Yield */
export function useSedimenMutation() {
  return useMutation({
    mutationKey: ['embung', 'sedimen'],
    mutationFn: (payload: SedimentationRequest) =>
      apiClient.post<SedimentationResult>('/api/v1/embung/sedimen', payload),
  });
}
