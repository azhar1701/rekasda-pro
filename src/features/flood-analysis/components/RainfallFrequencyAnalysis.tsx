import React, { useState } from 'react';
import { TrendingUp, Plus, TriangleAlert } from 'lucide-react';
import { performFrequencyAnalysis, recommendDistribution, DistributionMethod } from '@/lib/engine/statistics/frequency';
import { validateDistributionFit, GoodnessOfFitResult } from '@/lib/engine/statistics/goodnessOfFit';
import { DistributionComparisonAnalysis } from './DistributionComparisonAnalysis';

interface RainfallFrequencyAnalysisProps {
  onSelectValue: (returnPeriod: number, value: number) => void;
}

export const RainfallFrequencyAnalysis: React.FC<RainfallFrequencyAnalysisProps> = ({ onSelectValue }) => {
  const [data, setData] = useState<Array<{ year: number; value: number }>>([]);
  const [method, setMethod] = useState<DistributionMethod>('gumbel');
  const [result, setResult] = useState<any>(null);
  const [goodnessOfFit, setGoodnessOfFit] = useState<GoodnessOfFitResult | null>(null);
  const [step, setStep] = useState<'input' | 'result'>('input');
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    const value = parseFloat(newValue);
    if (isNaN(value) || value <= 0) {
      alert('Masukkan nilai hujan yang valid');
      return;
    }
    if (data.some(d => d.year === newYear)) {
      alert('Tahun sudah ada');
      return;
    }
    setData([...data, { year: newYear, value }].sort((a, b) => a.year - b.year));
    setNewYear(newYear - 1);
    setNewValue('');
  };

  const handleDelete = (year: number) => {
    setData(data.filter(d => d.year !== year));
  };

  const handleAnalyze = () => {
    if (data.length < 10) {
      alert('Minimal 10 data tahunan diperlukan');
      return;
    }
    try {
      const values = data.map(d => d.value);
      const recommended = recommendDistribution(values);
      const analysisResult = performFrequencyAnalysis({
        data: values,
        returnPeriods: [2, 5, 10, 25, 50, 100]
      }, method);
      
      // Run Goodness of Fit validation
      const gofResult = validateDistributionFit(values, method);
      setGoodnessOfFit(gofResult);
      
      setResult({ ...analysisResult, recommended });
      setStep('result');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error analisis');
    }
  };

  const methods: { id: DistributionMethod; name: string }[] = [
    { id: 'gumbel', name: 'Gumbel' },
    { id: 'logpearson3', name: 'Log-Pearson III' },
    { id: 'normal', name: 'Normal' },
    { id: 'lognormal', name: 'Log-Normal' }
  ];

  return (
    <div className="space-y-4">
      
      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${
          step === 'input' ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-700'
        }`}>
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">1</span>
          Input Data
        </div>
        <div className="flex-1 h-0.5 bg-slate-200"></div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${
          step === 'result' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
        }`}>
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">2</span>
          Hasil Analisis
        </div>
      </div>

      {step === 'input' ? (
        /* INPUT STEP */
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <label className="block text-sm font-bold text-slate-800 mb-3">📊 Input Data Hujan Tahunan</label>
            
            {/* Input Form */}
            <div className="flex gap-2 mb-4">
              <div className="w-32">
                <input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-center transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Tahun"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  step="0.1"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Hujan maksimum (mm)"
                />
              </div>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>
            </div>

            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">Minimal 10 tahun, disarankan ≥ 20 tahun</p>
              {data.length > 0 && (
                <span className="text-xs font-bold text-emerald-600">{data.length} data ✓</span>
              )}
            </div>
          </div>

          {/* Data Table */}
          {data.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Data Tersimpan ({data.length} tahun)</span>
                <button
                  onClick={() => setData([])}  
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                >
                  Hapus Semua
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-bold text-slate-600">Tahun</th>
                      <th className="px-4 py-2 text-right text-xs font-bold text-slate-600">Hujan (mm)</th>
                      <th className="px-4 py-2 text-center text-xs font-bold text-slate-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item) => (
                      <tr key={item.year} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 text-sm font-semibold text-slate-700">{item.year}</td>
                        <td className="px-4 py-2 text-right text-sm font-bold text-blue-600 tabular-nums">{item.value.toFixed(1)}</td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => handleDelete(item.year)}
                            className="text-rose-600 hover:text-rose-700 text-xs font-medium"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.length > 0 && data.length < 20 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <TriangleAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-semibold">⚠️ Data kurang dari 20 tahun - hasil kurang reliable</p>
              </div>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={data.length < 10}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-3 transition-colors flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Analisis Frekuensi →
          </button>
        </div>
      ) : (
        /* RESULT STEP */
        <div className="space-y-4">
          
          {/* Method Selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <label className="block text-sm font-bold text-slate-800 mb-3">Metode Distribusi</label>
            <div className="grid grid-cols-2 gap-2">
              {methods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMethod(m.id); handleAnalyze(); }}
                  className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    method === m.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m.name}
                  {result?.recommended === m.id && <span className="ml-1">⭐</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-bold text-slate-800 mb-3">📈 Parameter Statistik</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'n', value: result.parameters.n, decimals: 0, unit: 'tahun' },
                { label: 'Mean', value: result.parameters.mean, decimals: 1, unit: 'mm' },
                { label: 'Std Dev', value: result.parameters.stdDev, decimals: 1, unit: 'mm' },
                { label: 'Cv', value: result.parameters.cv, decimals: 3, unit: '' },
                { label: 'Cs', value: result.parameters.cs, decimals: 3, unit: '' },
                { label: 'Ck', value: result.parameters.ck, decimals: 3, unit: '' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white rounded-lg border border-slate-200 px-3 py-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">{stat.label}</div>
                  <div className="text-base font-black text-slate-900 tabular-nums">
                    {stat.value.toFixed(stat.decimals)}
                    {stat.unit && <span className="text-xs font-medium text-slate-400 ml-1">{stat.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goodness of Fit Validation */}
          {goodnessOfFit && (
            <div className={`rounded-xl border-2 p-4 ${
              goodnessOfFit.isValid 
                ? 'bg-emerald-50 border-emerald-500' 
                : 'bg-amber-50 border-amber-500'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  goodnessOfFit.isValid ? 'bg-emerald-600' : 'bg-amber-600'
                }`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {goodnessOfFit.isValid ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    )}
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm font-bold mb-2 ${
                    goodnessOfFit.isValid ? 'text-emerald-900' : 'text-amber-900'
                  }`}>
                    {goodnessOfFit.isValid ? '✅ Uji Kecocokan Distribusi LULUS' : '⚠️ Uji Kecocokan Distribusi PERINGATAN'}
                  </h4>
                  <p className={`text-xs mb-3 ${
                    goodnessOfFit.isValid ? 'text-emerald-800' : 'text-amber-800'
                  }`}>
                    {goodnessOfFit.recommendation}
                  </p>
                  
                  {/* Test Results */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className={`rounded-lg p-2 ${
                      goodnessOfFit.chiSquare.isAccepted ? 'bg-emerald-100' : 'bg-rose-100'
                    }`}>
                      <div className={`text-[10px] font-bold uppercase mb-1 ${
                        goodnessOfFit.chiSquare.isAccepted ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        Chi-Square {goodnessOfFit.chiSquare.isAccepted ? '✓' : '✗'}
                      </div>
                      <div className={`text-xs font-mono tabular-nums ${
                        goodnessOfFit.chiSquare.isAccepted ? 'text-emerald-900' : 'text-rose-900'
                      }`}>
                        X² = {goodnessOfFit.chiSquare.calculatedValue} 
                        <span className="text-[10px]"> (kritis: {goodnessOfFit.chiSquare.criticalValue})</span>
                      </div>
                    </div>
                    <div className={`rounded-lg p-2 ${
                      goodnessOfFit.kolmogorovSmirnov.isAccepted ? 'bg-emerald-100' : 'bg-rose-100'
                    }`}>
                      <div className={`text-[10px] font-bold uppercase mb-1 ${
                        goodnessOfFit.kolmogorovSmirnov.isAccepted ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        Kolmogorov-Smirnov {goodnessOfFit.kolmogorovSmirnov.isAccepted ? '✓' : '✗'}
                      </div>
                      <div className={`text-xs font-mono tabular-nums ${
                        goodnessOfFit.kolmogorovSmirnov.isAccepted ? 'text-emerald-900' : 'text-rose-900'
                      }`}>
                        Δ = {goodnessOfFit.kolmogorovSmirnov.deltaMax}
                        <span className="text-[10px]"> (kritis: {goodnessOfFit.kolmogorovSmirnov.deltaCritical})</span>
                      </div>
                    </div>
                  </div>
                  
                  {goodnessOfFit.warnings.length > 0 && (
                    <div className="text-xs text-amber-700 space-y-1">
                      {goodnessOfFit.warnings.map((w, i) => (
                        <div key={i}>• {w}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Results Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
              <h3 className="text-sm font-bold text-white">🎯 Hujan Rencana</h3>
            </div>
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Kala Ulang</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-700">Hujan Rencana</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {result.designValues.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg w-fit">
                          <span className="text-xs font-bold text-slate-600">Q</span>
                          <span className="text-sm font-black text-slate-900">{item.returnPeriod}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 leading-tight">
                          {item.returnPeriod === 2 && 'Drainase lokal, saluran tersier'}
                          {item.returnPeriod === 5 && 'Drainase sekunder, jalan lokal'}
                          {item.returnPeriod === 10 && 'Drainase primer, jalan arteri'}
                          {item.returnPeriod === 25 && 'Jembatan kecil, gorong-gorong besar'}
                          {item.returnPeriod === 50 && 'Jembatan strategis, bendung'}
                          {item.returnPeriod === 100 && 'Bendungan, infrastruktur vital'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-lg font-black text-blue-600 tabular-nums">
                        {item.designValue.toFixed(2)}
                      </span>
                      <span className="text-xs font-medium text-slate-400 ml-1">mm</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onSelectValue(item.returnPeriod, item.designValue)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Gunakan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setStep('input'); setResult(null); }}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg px-4 py-2.5 transition-colors"
            >
              ← Input Ulang
            </button>
          </div>

          {/* Distribution Comparison */}
          <DistributionComparisonAnalysis 
            data={data.map(d => d.value)} 
            calculatedStats={result.parameters}
          />
        </div>
      )}
    </div>
  );
};
