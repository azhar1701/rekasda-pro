import React from 'react';
import { RainfallDataPoint, DistributionMethod } from '../FrequencyAnalysisModal';
import { Metric } from '@/components/ui/Metric';
import { ValidationStatusBox } from './ValidationStatusBox';
import { MethodSelector } from './MethodSelector';

interface StatisticsPanelProps {
 data: RainfallDataPoint[];
 statistics: any;
 goodnessOfFit: any;
 method: DistributionMethod;
 onMethodChange: (method: DistributionMethod) => void;
 onSelectValue?: (period: string, value: number) => void;
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
 data,
 statistics,
 goodnessOfFit,
 method,
 onMethodChange
}) => {
 return (
 <div className="space-y-4">
 <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Parameter Statistik</h3>

  <div className="grid grid-cols-2 gap-3">
  <Metric label="Jumlah Data" value={data.length} density="compact" variant="slate" />
  <Metric label="Rata-rata" value={statistics?.mean || 0} density="compact" variant="slate" />
  <Metric label="Std Deviasi" value={statistics?.stdDev || 0} density="compact" variant="slate" />
  <Metric label="Skewness (Cs)" value={statistics?.skewness || 0} density="compact" variant="slate" />
  </div>


 <ValidationStatusBox goodnessOfFit={goodnessOfFit} />

 <MethodSelector method={method} onChange={onMethodChange} />
 </div>
 );
};
