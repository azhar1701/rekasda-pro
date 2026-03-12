import { useMemo } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { determineFloodMethod, MethodRecommendation } from '@/utils/floodMethodSelector';

interface FloodMethodHookResult {
  recommendation: MethodRecommendation;
  isDataReady: boolean;
  luasDasNumeric: number;
  hujanRencanaValue: number | null;
}

/**
 * Hook khusus untuk sinkronisasi otomatis antara Parameter Spasial (A)
 * dan Rekomendasi Metode Perhitungan Banjir.
 */
export function useFloodMethod(): FloodMethodHookResult {
  const { luasDas, hasilAnalisisFrekuensi } = useHydrologyStore();

  const luasDasNumeric = useMemo(() => {
    if (!luasDas) return 0;
    const val = parseFloat(luasDas);
    return isNaN(val) ? 0 : val;
  }, [luasDas]);

  const recommendation = useMemo(() => {
    return determineFloodMethod(luasDasNumeric);
  }, [luasDasNumeric]);

  const hujanRencanaValue = useMemo(() => {
    if (!hasilAnalisisFrekuensi || !hasilAnalisisFrekuensi.selectedKalaUlang) {
      return null;
    }
    const match = hasilAnalisisFrekuensi.curahHujanRencana.find(
      (v: any) => v.Tr === hasilAnalisisFrekuensi.selectedKalaUlang
    );
    return match ? match.R24 : null;
  }, [hasilAnalisisFrekuensi]);

  // Data dianggap ready jika Luas DAS valid dan Analisis Frekuensi sudah dipilih
  const isDataReady = recommendation.status === 'ready' && hujanRencanaValue !== null;

  return {
    recommendation,
    isDataReady,
    luasDasNumeric,
    hujanRencanaValue
  };
}
