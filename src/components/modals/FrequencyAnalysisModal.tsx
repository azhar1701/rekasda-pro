import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { DataInputTable } from './FrequencyAnalysisModal/DataInputTable';
import { StatCard } from './FrequencyAnalysisModal/StatCard';
import { MethodSelector } from './FrequencyAnalysisModal/MethodSelector';
import { calculateStatistics, performFrequencyAnalysis, type DistributionMethod } from '@/lib/engine/statistics/frequency';
import { validateDistributionFit } from '@/lib/engine/statistics/goodnessOfFit';

export interface RainfallDataPoint {
  year: number;
  value: number;
}

export type { DistributionMethod };

interface FrequencyAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectValue?: (period: number, value: number) => void;
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
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (data.length >= 3) {
      try {
        const values = data.map(d => d.value);
        const stats = calculateStatistics(values);
        const fit = validateDistributionFit(values, method);
        const analysis = performFrequencyAnalysis({ data: values, returnPeriods: [2, 5, 10, 25, 50, 100] }, method);
        
        setStatistics(stats);
        setGoodnessOfFit(fit);
        setResults(analysis);
      } catch (error) {
        const values = data.map(d => d.value);
        const stats = calculateStatistics(values);
        setStatistics(stats);
        setGoodnessOfFit(null);
        setResults(null);
      }
    }
  }, [data, method]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto relative z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Analisis Frekuensi Hujan</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <DataInputTable data={data} onChange={setData} />
            </div>

            <div className="lg:col-span-3 space-y-4">
              <h3 className="text-sm font-bold text-slate-700">Parameter Statistik</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Jumlah Data" value={data.length.toString()} />
                <StatCard label="Rata-rata" value={statistics?.mean?.toFixed(2) || '0.00'} />
                <StatCard label="Std Deviasi" value={statistics?.stdDev?.toFixed(2) || '0.00'} />
                <StatCard label="Skewness (Cs)" value={statistics?.cs?.toFixed(3) || '0.000'} />
              </div>

              {data.length < 10 && (
                <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                  <div className="text-sm font-bold text-amber-900 mb-1">⚠️ Data Tidak Mencukupi</div>
                  <div className="text-xs text-amber-700">
                    Minimal 10 tahun data diperlukan untuk analisis frekuensi yang reliabel. Saat ini: {data.length} tahun.
                  </div>
                </div>
              )}

              {goodnessOfFit && (
                <div className={`border rounded-lg p-4 ${goodnessOfFit.isValid ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-start gap-3">
                    <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${goodnessOfFit.isValid ? 'text-emerald-600' : 'text-amber-600'}`} />
                    <div className="flex-1">
                      <div className={`text-sm font-bold mb-2 ${goodnessOfFit.isValid ? 'text-emerald-900' : 'text-amber-900'}`}>
                        Uji Kecocokan: {goodnessOfFit.isValid ? 'LULUS' : 'PERINGATAN'}
                      </div>
                      <div className={`text-xs space-y-1 ${goodnessOfFit.isValid ? 'text-emerald-700' : 'text-amber-700'}`}>
                        <div>Chi-Square: {goodnessOfFit.chiSquare.isAccepted ? '✓' : '✗'} ({goodnessOfFit.chiSquare.calculatedValue} vs {goodnessOfFit.chiSquare.criticalValue})</div>
                        <div>Smirnov-Kolmogorov: {goodnessOfFit.kolmogorovSmirnov.isAccepted ? '✓' : '✗'} ({goodnessOfFit.kolmogorovSmirnov.deltaMax} vs {goodnessOfFit.kolmogorovSmirnov.deltaCritical})</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <MethodSelector method={method} onChange={setMethod} />

              {results && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Hasil Analisis</h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Kala Ulang</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">Hujan (mm)</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {results.designValues.map((item: any) => (
                          <tr key={item.returnPeriod} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-sm font-semibold text-slate-700">Q{item.returnPeriod}</td>
                            <td className="px-3 py-2 text-right text-sm font-bold text-teal-600">{item.designValue.toFixed(2)}</td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => {
                                  onSelectValue?.(item.returnPeriod, item.designValue);
                                  onClose();
                                }}
                                className="px-3 py-1 text-xs font-semibold text-teal-600 hover:bg-teal-50 rounded transition-colors"
                              >
                                Gunakan
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
