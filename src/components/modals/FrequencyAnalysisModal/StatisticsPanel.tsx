import React from 'react';
import { RainfallDataPoint, DistributionMethod } from '../FrequencyAnalysisModal';
import { StatCard } from './StatCard';
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
 <StatCard label="Jumlah Data" value={data.length.toString()} />
 <StatCard label="Rata-rata" value={statistics?.mean?.toFixed(2) || '0.00'} />
 <StatCard label="Std Deviasi" value={statistics?.stdDev?.toFixed(2) || '0.00'} />
 <StatCard label="Skewness (Cs)" value={statistics?.skewness?.toFixed(3) || '0.000'} />
 </div>

 <ValidationStatusBox goodnessOfFit={goodnessOfFit} />

 <MethodSelector method={method} onChange={onMethodChange} />
 </div>
 );
};
