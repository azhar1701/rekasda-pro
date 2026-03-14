import { useMemo } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';

/**
 * Custom hook for accessing derived state and integrated parameters
 * Provides computed values from Single Source of Truth
 */
export const useIntegratedParameters = () => {
 const store = useHydrologyStore();

 // Master Data (SSOT)
 const masterData = useMemo(() => ({
 luasDAS: store.morfometriDAS?.luasDAS || 0,
 panjangSungai: store.morfometriDAS?.panjangSungai || 0,
 kemiringanSungai: store.morfometriDAS?.kemiringanSungai || 0,
 elevasi: store.morfometriDAS?.elevasi || 0,
 koefisienC: store.tutupanLahan?.koefisienPengaliranGabungan || 0,
 curveNumber: store.tutupanLahan?.curveNumberGabungan || 0,
 }), [store.morfometriDAS, store.tutupanLahan]);

 // Derived State (Auto-computed)
 const derived = useMemo(() => ({
 timeOfConcentration: store.getTimeOfConcentration(),
 designRainfall: (tr: number) => store.getDesignRainfall(tr),
 designDischarge: (type: 'flood' | 'irrigation') => store.getDesignDischarge(type),
 }), [store]);

 // Analysis Results
 const results = useMemo(() => ({
 frequencyComplete: !!store.analisisFrekuensi?.metodeTerpilih,
 floodComplete: !!store.hasilBanjir?.debitPuncak,
 waterBalanceComplete: !!store.hasilMock?.qAndalan,
 }), [store.analisisFrekuensi, store.hasilBanjir, store.hasilMock]);

 // Integration Status
 const status = useMemo(() => ({
 hasMasterData: !!store.morfometriDAS && !!store.tutupanLahan,
 hasFrequencyAnalysis: !!store.analisisFrekuensi,
 hasFloodAnalysis: !!store.hasilBanjir,
 hasWaterBalance: !!store.hasilMock,
 }), [store.morfometriDAS, store.tutupanLahan, store.analisisFrekuensi, store.hasilBanjir, store.hasilMock]);

 return {
 masterData,
 derived,
 results,
 status,
 // Direct store access for updates
 updateMorfometriDAS: store.updateMorfometriDAS,
 setAnalisisFrekuensi: store.setAnalisisFrekuensi,
 };
};
