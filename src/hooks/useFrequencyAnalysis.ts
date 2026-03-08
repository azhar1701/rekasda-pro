import { useMemo } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';

export const useFrequencyAnalysis = () => {
  // Use selectors for full reactivity
  const analisisFrekuensi = useHydrologyStore(state => state.analisisFrekuensi);
  const hasilAnalisisFrekuensi = useHydrologyStore(state => state.hasilAnalisisFrekuensi);
  const selectedKalaUlangStore = useHydrologyStore(state => state.selectedKalaUlang);

  // Normalization helper for method names
  const normalizeMethod = (method: string) => {
    if (!method) return '';
    const m = method.toLowerCase().replace(/\s/g, '');
    if (m.includes('pearson')) return 'logpearson3';
    if (m.includes('lognormal')) return 'lognormal';
    if (m.includes('gumbel')) return 'gumbel';
    if (m.includes('normal')) return 'normal';
    return m;
  };

  const selectedDistribution = useMemo(() => {
    // 1. Try to get from active session (analisisFrekuensi)
    if (analisisFrekuensi?.metodeTerpilih && analisisFrekuensi?.hasilDistribusi) {
      const normalizedSelected = normalizeMethod(analisisFrekuensi.metodeTerpilih);
      return analisisFrekuensi.hasilDistribusi.find(
        d => normalizeMethod(d.method) === normalizedSelected
      );
    }
    
    // 2. Fallback to saved results (hasilAnalisisFrekuensi)
    if (hasilAnalisisFrekuensi?.metodeTerpilih && hasilAnalisisFrekuensi?.curahHujanRencana) {
      return {
        method: hasilAnalisisFrekuensi.metodeTerpilih,
        values: hasilAnalisisFrekuensi.curahHujanRencana
      };
    }

    return null;
  }, [analisisFrekuensi, hasilAnalisisFrekuensi]);

  const getR24 = (returnPeriod: number): number | null => {
    if (!selectedDistribution) return null;
    const value = selectedDistribution.values.find(v => v.Tr === returnPeriod);
    return value?.R24 ?? value?.curahHujan ?? null;
  };

  const isComplete = !!(analisisFrekuensi?.metodeTerpilih || hasilAnalisisFrekuensi?.metodeTerpilih);

  const summary = useMemo(() => {
    const method = analisisFrekuensi?.metodeTerpilih || hasilAnalisisFrekuensi?.metodeTerpilih;
    if (!method) return null;
    
    return {
      method,
      dataCount: analisisFrekuensi?.dataHujanInput?.length || 0,
      isLulusUji: hasilAnalisisFrekuensi?.lulusUjiKecocokan || false
    };
  }, [analisisFrekuensi, hasilAnalisisFrekuensi]);

  return {
    analisisFrekuensi,
    hasilAnalisisFrekuensi,
    selectedDistribution,
    selectedKalaUlang: selectedKalaUlangStore,
    getR24,
    isComplete,
    summary,
  };
};
