import { StateCreator } from 'zustand';

export interface SpatialSlice {
  dasFeature: any | null;
  riverFeature: any | null;
  chirpsData: any[];
  biasResult: any | null;
  dmcResult: any | null;
  slopeResult: { upstream: number; downstream: number; slope: number } | null;
  
  // Actions
  setDasFeature: (feature: any | null) => void;
  setRiverFeature: (feature: any | null) => void;
  setChirpsData: (data: any[]) => void;
  setBiasResult: (result: any | null) => void;
  setDmcResult: (result: any | null) => void;
  setSlopeResult: (result: { upstream: number; downstream: number; slope: number } | null) => void;
  resetSpatial: () => void;
}

export const createSpatialSlice: StateCreator<SpatialSlice> = (set) => ({
  dasFeature: null,
  riverFeature: null,
  chirpsData: [],
  biasResult: null,
  dmcResult: null,
  slopeResult: null,

  setDasFeature: (dasFeature) => set({ dasFeature }),
  setRiverFeature: (riverFeature) => set({ riverFeature }),
  setChirpsData: (chirpsData) => set({ chirpsData }),
  setBiasResult: (biasResult) => set({ biasResult }),
  setDmcResult: (dmcResult) => set({ dmcResult }),
  setSlopeResult: (slopeResult) => set({ slopeResult }),
  
  resetSpatial: () => set({
    dasFeature: null,
    riverFeature: null,
    chirpsData: [],
    biasResult: null,
    dmcResult: null,
    slopeResult: null
  }),
});
