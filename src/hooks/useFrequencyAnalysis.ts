import { useMemo } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';

export const useFrequencyAnalysis = () => {
  const { analisisFrekuensi } = useHydrologyStore();

  const selectedDistribution = useMemo(() => {
    if (!analisisFrekuensi?.metodeTerpilih || !analisisFrekuensi?.hasilDistribusi) {
      return null;
    }
    return analisisFrekuensi.hasilDistribusi.find(
      d => d.method === analisisFrekuensi.metodeTerpilih
    );
  }, [analisisFrekuensi]);

  const getR24 = (returnPeriod: number): number | null => {
    if (!selectedDistribution) return null;
    const value = selectedDistribution.values.find(v => v.Tr === returnPeriod);
    return value?.R24 || null;
  };

  const isComplete = !!analisisFrekuensi?.metodeTerpilih;

  const summary = useMemo(() => {
    if (!analisisFrekuensi) return null;
    
    const passedTests = analisisFrekuensi.ujiKecocokan?.filter(
      gof => gof.chiSquare.accepted && gof.kolmogorovSmirnov.accepted
    ).length || 0;

    return {
      method: analisisFrekuensi.metodeTerpilih,
      dataCount: analisisFrekuensi.dataHujanInput.length,
      passedTests,
      totalTests: analisisFrekuensi.ujiKecocokan?.length || 0,
    };
  }, [analisisFrekuensi]);

  return {
    analisisFrekuensi,
    selectedDistribution,
    getR24,
    isComplete,
    summary,
  };
};
