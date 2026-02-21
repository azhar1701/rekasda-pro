import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { DataInputTable } from './FrequencyAnalysisModal/DataInputTable';
import { StatisticsPanel } from './FrequencyAnalysisModal/StatisticsPanel';
import { calculateStatistics, performGoodnessOfFit } from '@/lib/engine/statistics/frequency';

export interface RainfallDataPoint {
  year: number;
  value: number;
}

export type DistributionMethod = 'gumbel' | 'normal' | 'log-pearson-iii' | 'log-normal';

interface FrequencyAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectValue?: (period: string, value: number) => void;
}

export const FrequencyAnalysisModal: React.FC<FrequencyAnalysisModalProps> = ({
  isOpen,
  onClose,
  onSelectValue
}) => {
  const [data, setData] = useState<RainfallDataPoint[]>([
    { year: 2014, value: 80 },
    { year: 2015, value: 95 },
    { year: 2016, value: 110 },
    { year: 2017, value: 125 },
    { year: 2018, value: 140 },
    { year: 2019, value: 155 },
    { year: 2020, value: 170 },
    { year: 2021, value: 185 }
  ]);
  const [method, setMethod] = useState<DistributionMethod>('gumbel');
  const [statistics, setStatistics] = useState<any>(null);
  const [goodnessOfFit, setGoodnessOfFit] = useState<any>(null);

  useEffect(() => {
    if (data.length >= 3) {
      const values = data.map(d => d.value);
      const stats = calculateStatistics(values);
      const fit = performGoodnessOfFit(values, method);
      setStatistics(stats);
      setGoodnessOfFit(fit);
    }
  }, [data, method]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Analisis Frekuensi Hujan</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <DataInputTable data={data} onChange={setData} />
            </div>

            <div className="lg:col-span-3">
              <StatisticsPanel
                data={data}
                statistics={statistics}
                goodnessOfFit={goodnessOfFit}
                method={method}
                onMethodChange={setMethod}
                onSelectValue={onSelectValue}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
