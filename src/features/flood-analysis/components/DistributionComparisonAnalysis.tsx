import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BrainCircuit, TrendingUp } from 'lucide-react';
import { performFrequencyAnalysis, StatisticalParameters } from '@/lib/engine/statistics/frequency';

interface DistributionComparisonAnalysisProps {
  data: number[];
  calculatedStats: StatisticalParameters;
}

export const DistributionComparisonAnalysis: React.FC<DistributionComparisonAnalysisProps> = ({ 
  data, 
  calculatedStats 
}) => {
  const returnPeriods = [2, 5, 10, 25, 50, 100];

  const comparisonData = useMemo(() => {
    const methods = ['gumbel', 'logpearson3', 'normal', 'lognormal'] as const;
    const results = methods.map(method => 
      performFrequencyAnalysis({ data, returnPeriods }, method)
    );

    return returnPeriods.map((T, idx) => ({
      T,
      Gumbel: results[0].designValues[idx].designValue,
      LogPearson3: results[1].designValues[idx].designValue,
      Normal: results[2].designValues[idx].designValue,
      LogNormal: results[3].designValues[idx].designValue,
    }));
  }, [data, returnPeriods]);

  const insights = useMemo(() => {
    const { cs, ck } = calculatedStats;
    const messages: string[] = [];

    if (Math.abs(cs) < 0.1 && Math.abs(ck - 3) < 0.5) {
      messages.push(`Nilai Skewness (Cs ≈ ${cs.toFixed(2)}) menunjukkan data simetris. Distribusi Normal dan Gumbel cenderung memberikan hasil yang berdekatan.`);
    }

    if (cs > 1.0) {
      messages.push(`Distribusi Log-Pearson III lebih sensitif terhadap nilai ekstrim (Skewness tinggi = ${cs.toFixed(2)}). Terlihat grafik Log-Pearson III melesat lebih tinggi pada Kala Ulang > 50 tahun dibandingkan metode lain.`);
    } else if (cs < -1.0) {
      messages.push(`Skewness negatif (Cs = ${cs.toFixed(2)}) menunjukkan data condong ke kiri. Log-Normal cenderung memberikan nilai lebih konservatif.`);
    }

    if (cs > 0.5 && cs < 1.0) {
      messages.push(`Skewness positif moderat (Cs = ${cs.toFixed(2)}) mengindikasikan Log-Normal atau Log-Pearson III lebih sesuai untuk data ini.`);
    }

    if (ck > 5) {
      messages.push(`Kurtosis tinggi (Ck = ${ck.toFixed(2)}) menunjukkan data memiliki nilai ekstrim. Gumbel (Ck teoritis ≈ 5.4) cocok untuk analisis banjir.`);
    }

    return messages.length > 0 ? messages : ['Data memiliki karakteristik statistik yang baik untuk analisis frekuensi. Semua metode dapat digunakan dengan tingkat kepercayaan yang memadai.'];
  }, [calculatedStats]);

  const q50q100Comparison = useMemo(() => {
    const q50 = comparisonData.find(d => d.T === 50);
    const q100 = comparisonData.find(d => d.T === 100);
    
    if (!q50 || !q100) return [];

    const methods = [
      { name: 'Gumbel', q50: q50.Gumbel, q100: q100.Gumbel },
      { name: 'Log-Pearson III', q50: q50.LogPearson3, q100: q100.LogPearson3 },
      { name: 'Normal', q50: q50.Normal, q100: q100.Normal },
      { name: 'Log-Normal', q50: q50.LogNormal, q100: q100.LogNormal },
    ];

    const q50Values = methods.map(m => m.q50);
    const q100Values = methods.map(m => m.q100);
    const maxQ50 = Math.max(...q50Values);
    const minQ50 = Math.min(...q50Values);
    const maxQ100 = Math.max(...q100Values);
    const minQ100 = Math.min(...q100Values);

    return methods.map(m => ({
      ...m,
      isMaxQ50: m.q50 === maxQ50,
      isMinQ50: m.q50 === minQ50,
      isMaxQ100: m.q100 === maxQ100,
      isMinQ100: m.q100 === minQ100,
    }));
  }, [comparisonData]);

  return (
    <div className="space-y-6">
      
      {/* Frequency Curve Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-800">Kurva Frekuensi - Perbandingan Distribusi</h3>
        </div>
        
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="T" 
              label={{ value: 'Kala Ulang (Tahun)', position: 'insideBottom', offset: -5 }}
              stroke="#64748b"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              label={{ value: 'Debit/Hujan Rencana (mm)', angle: -90, position: 'insideLeft' }}
              stroke="#64748b"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                fontSize: '12px' 
              }}
              formatter={(value: number) => value.toFixed(2)}
              labelFormatter={(label) => `T = ${label} tahun`}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="line"
            />
            <Line 
              type="monotone" 
              dataKey="Gumbel" 
              stroke="#14b8a6" 
              strokeWidth={2.5}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Gumbel"
            />
            <Line 
              type="monotone" 
              dataKey="LogPearson3" 
              stroke="#6366f1" 
              strokeWidth={2.5}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Log-Pearson III"
            />
            <Line 
              type="monotone" 
              dataKey="Normal" 
              stroke="#64748b" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name="Normal"
            />
            <Line 
              type="monotone" 
              dataKey="LogNormal" 
              stroke="#f59e0b" 
              strokeWidth={2.5}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Log-Normal"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Parameter Insights */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-blue-900 mb-2">Analisis Parameter Statistik</h4>
            <div className="space-y-2">
              {insights.map((insight, idx) => (
                <p key={idx} className="text-xs text-blue-800 leading-relaxed">
                  • {insight}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Q50 & Q100 Comparison Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-100 px-5 py-3 border-b border-slate-200">
          <h4 className="text-sm font-bold text-slate-800">Perbandingan Q₅₀ dan Q₁₀₀</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-slate-700">Metode Distribusi</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700">Q₅₀ (mm)</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700">Q₁₀₀ (mm)</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700">Selisih (%)</th>
              </tr>
            </thead>
            <tbody>
              {q50q100Comparison.map((method, idx) => {
                const diff = ((method.q100 - method.q50) / method.q50) * 100;
                return (
                  <tr key={idx} className="border-t border-slate-200 even:bg-slate-50 hover:bg-blue-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{method.name}</td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${
                      method.isMaxQ50 ? 'text-red-600 bg-red-50' : 
                      method.isMinQ50 ? 'text-green-600 bg-green-50' : 
                      'text-slate-900'
                    }`}>
                      {method.q50.toFixed(2)}
                      {method.isMaxQ50 && <span className="ml-1 text-[10px]">MAX</span>}
                      {method.isMinQ50 && <span className="ml-1 text-[10px]">MIN</span>}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${
                      method.isMaxQ100 ? 'text-red-600 bg-red-50' : 
                      method.isMinQ100 ? 'text-green-600 bg-green-50' : 
                      'text-slate-900'
                    }`}>
                      {method.q100.toFixed(2)}
                      {method.isMaxQ100 && <span className="ml-1 text-[10px]">MAX</span>}
                      {method.isMinQ100 && <span className="ml-1 text-[10px]">MIN</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-600 tabular-nums">
                      +{diff.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200">
          <p className="text-xs text-slate-600">
            <span className="font-semibold">Catatan:</span> Nilai MAX (merah) = paling konservatif, MIN (hijau) = paling agresif
          </p>
        </div>
      </div>
    </div>
  );
};
