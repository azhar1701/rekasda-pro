import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProjectSlice, createProjectSlice } from './slices/projectSlice';
import { RainfallSlice, createRainfallSlice } from './slices/rainfallSlice';
import { AnalysisSlice, createAnalysisSlice } from './slices/analysisSlice';
import { toast } from '@/hooks/useToast';

// Re-export types for backward compatibility
export * from '@/types/hydrology.types';

export type HydrologyStore = ProjectSlice & RainfallSlice & AnalysisSlice & {
  // Add any legacy fields that were missed or are computed
  distribusiHujanJamJaman: number[];
  hujanEfektif: any;
  setEffectiveRainfall: (val: any) => void;
  setDistribusiHujanJamJaman: (val: number[] | null) => void;
  
  // Getters (Computed State)
  getTimeOfConcentration: () => number;
  getDesignRainfall: (tr: number) => number;
  getDesignDischarge: (type?: 'flood' | 'irrigation') => number;
  
  // Global Action
  resetAll: () => void;
  lastResetAt: number;
};

export const useHydrologyStore = create<HydrologyStore>()(
  persist(
    (...a) => {
      const [set, get] = a;
      return {
        ...createProjectSlice(...a),
        ...createRainfallSlice(...a),
        ...createAnalysisSlice(...a),
        
        // Extra state
        distribusiHujanJamJaman: [],
        hujanEfektif: null,
        setEffectiveRainfall: (hujanEfektif) => set({ hujanEfektif }),
        setDistribusiHujanJamJaman: (distribusiHujanJamJaman) => set({ distribusiHujanJamJaman: distribusiHujanJamJaman || [] }),
        
        // Getter implementations
        getTimeOfConcentration: () => {
          const { morfometriDAS } = get();
          const { panjangSungai, kemiringanSungai } = morfometriDAS;
          if (!panjangSungai || !kemiringanSungai) return 0;
          return 0.0195 * Math.pow(panjangSungai, 0.77) * Math.pow(kemiringanSungai, -0.385);
        },
        
        getDesignRainfall: (tr: number) => {
          const { analisisFrekuensi } = get();
          const match = analisisFrekuensi.hasilDistribusi?.[0]?.values.find(v => v.Tr === tr);
          return match?.R24 || 0;
        },
        
        getDesignDischarge: (type = 'flood') => {
          const { hasilBanjir, neracaFinal } = get();
          if (type === 'flood') return hasilBanjir?.debitPuncak || 0;
          return neracaFinal?.[0]?.ketersediaan || 0;
        },

        resetAll: () => {
          // 1. Reset project-specific parameters
          get().resetProject();
          get().resetAnalysis();
          
          // 2. Reset Project-specific Rainfall Config (Selection & Results)
          // BUT: Keep stasiunList and raw dataHujan (The Master Database)
          set({
            curahHujanWilayah: {
              metode: 'aljabar',
              stasiunConfigs: [],
              hujanRataRata: 0,
              hujanRataRataAMS: []
            },
            hasilThiessen: null,
            hasilARF: null,
            analisisFrekuensi: {
              parameterStatistik: null,
              hasilDistribusi: null,
              ujiKecocokan: null,
              metodeTerpilih: null,
              dataHujanInput: []
            },
            hasilAnalisisFrekuensi: null,
            curahHujanRencana: [],
            selectedKalaUlang: null,
            distribusiHujanJamJaman: [], 
            hujanEfektif: null,
            lastResetAt: Date.now() 
          });

          toast.success('Project Parameters Reset. Master Data Database Preserved.');
        },
        lastResetAt: 0
      };
    },
    {
      name: 'hydrology-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const { 
          isQCCalculating, 
          isBanjirDirty, 
          isNeracaDirty,
          ...persisted 
        } = state;
        return persisted;
      },
    }
  )
);
