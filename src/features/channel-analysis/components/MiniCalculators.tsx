import React, { useState, useMemo } from 'react';
import { performFrequencyAnalysis, recommendDistribution, validateFrequencyInput, validateDistributionFit, type DistributionMethod } from '@/lib/engine/statistics';

// 1. Kalkulator Waktu Konsentrasi (Kirpich)
export const TcCalculator: React.FC<{ onApply: (tc: number) => void; onClose: () => void }> = ({ onApply, onClose }) => {
  const [L, setL] = useState(0.8);
  const [S, setS] = useState(0.01);
  
  const calculateTc = () => {
    if (L <= 0 || S <= 0) return 0;
    const Lm = L * 1000;
    return 0.0195 * Math.pow(Lm, 0.77) * Math.pow(S, -0.385);
  };
  
  const tc = calculateTc();
  
  return (
    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
      <div className="text-xs font-bold text-blue-900 mb-2">Rumus Kirpich: tc = 0.0195 × L^0.77 × S^-0.385</div>
      <div>
        <label className="text-xs font-semibold text-slate-600 block mb-1">Panjang Alur (L)</label>
        <div className="relative">
          <input
            type="number"
            step="0.1"
            value={L}
            onChange={e => setL(parseFloat(e.target.value) || 0)}
            className="w-full bg-white border border-blue-300 text-sm font-bold rounded-lg p-3 pr-12"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">km</span>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600 block mb-1">Kemiringan (S)</label>
        <div className="relative">
          <input
            type="number"
            step="0.001"
            value={S}
            onChange={e => setS(parseFloat(e.target.value) || 0)}
            className="w-full bg-white border border-blue-300 text-sm font-bold rounded-lg p-3 pr-16"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">m/m</span>
        </div>
      </div>
      <button
        onClick={() => {
          onApply(parseFloat(tc.toFixed(1)));
          onClose();
        }}
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-bold"
      >
        Gunakan tc = {tc.toFixed(1)} menit
      </button>
    </div>
  );
};

// 2. Kalkulator Intensitas (Mononobe)
export const IntensityCalculator: React.FC<{ tc: number; onApply: (I: number) => void; onClose: () => void }> = ({ tc, onApply, onClose }) => {
  const [R24, setR24] = useState(100);
  
  const calculateI = () => {
    if (R24 <= 0 || tc <= 0) return 0;
    const tcHours = tc / 60;
    return (R24 / 24) * Math.pow(24 / tcHours, 2/3);
  };
  
  const I = calculateI();
  
  return (
    <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3">
      <div className="text-xs font-bold text-emerald-900 mb-2">Rumus Mononobe: I = (R₂₄/24) × (24/tc)^(2/3)</div>
      <div>
        <label className="text-xs font-semibold text-slate-600 block mb-1">Hujan Harian (R₂₄)</label>
        <div className="relative">
          <input
            type="number"
            value={R24}
            onChange={e => setR24(parseFloat(e.target.value) || 0)}
            className="w-full bg-white border border-emerald-300 text-sm font-bold rounded-lg p-3 pr-12"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">mm</span>
        </div>
      </div>
      <div className="text-xs text-slate-600">tc yang digunakan: {tc} menit</div>
      <button
        onClick={() => {
          onApply(parseFloat(I.toFixed(2)));
          onClose();
        }}
        className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs font-bold"
      >
        Gunakan I = {I.toFixed(2)} mm/jam
      </button>
    </div>
  );
};

// 3. Kalkulator Analisis Frekuensi (Multi-Method)
type MethodType = 'gumbel' | 'normal' | 'logpearson3' | 'lognormal';

export const FrequencyAnalysisCalculator: React.FC<{ onApply: (rainfalls: number[]) => void; onClose: () => void }> = ({ onApply, onClose }) => {
  const [method, setMethod] = useState<MethodType>('gumbel');
  const [rainfallData, setRainfallData] = useState<Array<{year: string, rainfall: string}>>([
    {year: '2014', rainfall: '80'},
    {year: '2015', rainfall: '95'},
    {year: '2016', rainfall: '110'},
    {year: '2017', rainfall: '125'},
    {year: '2018', rainfall: '140'},
    {year: '2019', rainfall: '155'},
    {year: '2020', rainfall: '170'},
    {year: '2021', rainfall: '185'},
    {year: '2022', rainfall: '200'},
    {year: '2023', rainfall: '215'},
  ]);
  
  const parsedData = rainfallData.map(d => parseFloat(d.rainfall)).filter(v => !isNaN(v) && v > 0);
  
  // Use production engine
  const analysisResult = useMemo(() => {
    if (parsedData.length >= 10) {
      try {
        return performFrequencyAnalysis(
          { data: parsedData, returnPeriods: [2, 5, 10, 25, 50, 100] },
          method as DistributionMethod
        );
      } catch {
        return null;
      }
    }
    return null;
  }, [parsedData, method]);
  
  const validation = useMemo(() => {
    if (parsedData.length >= 3) {
      return validateFrequencyInput({ data: parsedData, returnPeriods: [2, 5, 10, 25, 50, 100] });
    }
    return { valid: false, errors: [], warnings: [] };
  }, [parsedData]);
  
  const recommendedMethod = useMemo(() => {
    if (parsedData.length >= 10) {
      return recommendDistribution(parsedData);
    }
    return null;
  }, [parsedData]);
  
  // Goodness of Fit Test
  const goodnessOfFit = useMemo(() => {
    if (parsedData.length >= 10) {
      try {
        return validateDistributionFit(parsedData, method as DistributionMethod);
      } catch {
        return null;
      }
    }
    return null;
  }, [parsedData, method]);
  
  const results = analysisResult?.designValues.map(dv => dv.designValue) || [0, 0, 0, 0, 0, 0];
  
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Analisis Frekuensi Hujan</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Main Content - Two Column Layout */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            
            {/* LEFT COLUMN - Data Input */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-700">Data Hujan Harian Maksimum</label>
                  <button
                    onClick={() => setRainfallData([...rainfallData, {year: '', rainfall: ''}])}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    + Tambah Baris
                  </button>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left py-2.5 px-3 text-xs font-bold text-slate-600 w-28">Tahun</th>
                        <th className="text-left py-2.5 px-3 text-xs font-bold text-slate-600">Hujan (mm)</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rainfallData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.year}
                              onChange={e => {
                                const updated = [...rainfallData];
                                updated[idx].year = e.target.value;
                                setRainfallData(updated);
                              }}
                              placeholder="2024"
                              className="w-full bg-white border border-slate-200 text-xs rounded px-2 py-1.5 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 tabular-nums"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={row.rainfall}
                              onChange={e => {
                                const updated = [...rainfallData];
                                updated[idx].rainfall = e.target.value;
                                setRainfallData(updated);
                              }}
                              placeholder="100"
                              className="w-full bg-white border border-slate-200 text-xs rounded px-2 py-1.5 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 tabular-nums"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <button
                              onClick={() => setRainfallData(rainfallData.filter((_, i) => i !== idx))}
                              className="text-red-400 hover:text-red-600 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-500 mt-2">Minimal 10 data untuk analisis engine</p>
              </div>
              
              {/* Warnings */}
              {validation.warnings.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-amber-900 mb-1">Peringatan</div>
                      <ul className="space-y-1">
                        {validation.warnings.map((w, i) => (
                          <li key={i} className="text-xs text-amber-800">{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* RIGHT COLUMN - Statistics & Results */}
            <div className="space-y-4">
              
              {/* Statistics Cards */}
              {analysisResult && (
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-3">Parameter Statistik</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">Jumlah Data</div>
                      <div className="text-lg font-bold text-slate-900 tabular-nums">{analysisResult.parameters.n}</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">Rata-rata</div>
                      <div className="text-lg font-bold text-slate-900 tabular-nums">{analysisResult.parameters.mean.toFixed(2)}</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">Std Deviasi</div>
                      <div className="text-lg font-bold text-slate-900 tabular-nums">{analysisResult.parameters.stdDev.toFixed(2)}</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">Skewness (Cs)</div>
                      <div className="text-lg font-bold text-slate-900 tabular-nums">{analysisResult.parameters.cs.toFixed(3)}</div>
                    </div>
                  </div>
                  {recommendedMethod && recommendedMethod !== method && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-xs text-blue-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Rekomendasi: <strong className="uppercase">{recommendedMethod}</strong></span>
                      </div>
                    </div>
                  )}
                  {goodnessOfFit && (
                    <div className={`mt-3 p-3 border rounded-lg ${
                      goodnessOfFit.isValid 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-start gap-2">
                        <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          goodnessOfFit.isValid ? 'text-emerald-600' : 'text-red-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {goodnessOfFit.isValid ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          )}
                        </svg>
                        <div className="flex-1">
                          <div className={`text-xs font-semibold mb-1 ${
                            goodnessOfFit.isValid ? 'text-emerald-900' : 'text-red-900'
                          }`}>
                            Uji Kecocokan: {goodnessOfFit.isValid ? 'LULUS' : 'GAGAL'}
                          </div>
                          <div className={`text-xs space-y-0.5 ${
                            goodnessOfFit.isValid ? 'text-emerald-700' : 'text-red-700'
                          }`}>
                            <div>Chi-Square: {goodnessOfFit.chiSquare.isAccepted ? '✓' : '✗'} ({goodnessOfFit.chiSquare.calculatedValue} vs {goodnessOfFit.chiSquare.criticalValue})</div>
                            <div>Kolmogorov-Smirnov: {goodnessOfFit.kolmogorovSmirnov.isAccepted ? '✓' : '✗'} ({goodnessOfFit.kolmogorovSmirnov.deltaMax} vs {goodnessOfFit.kolmogorovSmirnov.deltaCritical})</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Method Selection */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">Metode Distribusi</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMethod('gumbel')}
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all border-2 ${
                      method === 'gumbel' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Gumbel
                  </button>
                  <button
                    onClick={() => setMethod('normal')}
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all border-2 ${
                      method === 'normal' 
                        ? 'bg-blue-50 border-blue-500 text-blue-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setMethod('logpearson3')}
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all border-2 ${
                      method === 'logpearson3' 
                        ? 'bg-purple-50 border-purple-500 text-purple-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Log Pearson III
                  </button>
                  <button
                    onClick={() => setMethod('lognormal')}
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all border-2 ${
                      method === 'lognormal' 
                        ? 'bg-orange-50 border-orange-500 text-orange-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Log-Normal
                  </button>
                </div>
              </div>
              
              {/* Results Table */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">Hasil Analisis</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left py-2.5 px-3 text-xs font-bold text-slate-600">Kala Ulang</th>
                        <th className="text-center py-2.5 px-3 text-xs font-bold text-slate-600">K</th>
                        <th className="text-right py-2.5 px-3 text-xs font-bold text-slate-600">Hujan (mm)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analysisResult?.designValues.map((dv, idx) => (
                        <tr key={idx} className="even:bg-slate-50 hover:bg-slate-100 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">Q{dv.returnPeriod}</td>
                          <td className="py-2.5 px-3 text-center text-slate-600 tabular-nums">{dv.frequency.toFixed(3)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-teal-600 tabular-nums">{dv.designValue.toFixed(1)}</td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-sm text-slate-400">
                            Masukkan minimal 10 data untuk analisis
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sticky Footer */}
        <div className="border-t border-slate-200 p-6 bg-slate-50">
          <button
            onClick={() => {
              onApply(results);
              onClose();
            }}
            disabled={parsedData.length < 10}
            className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 active:bg-teal-800 transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Terapkan Semua ke Tabel
          </button>
        </div>
      </div>
    </div>
  );
};

// 4. Kalkulator Hujan Efektif
export const EffectiveRainfallCalculator: React.FC<{ C: number; onApply: (Ro: number) => void; onClose: () => void }> = ({ C, onApply, onClose }) => {
  const [Rplan, setRplan] = useState(100);
  
  const Reff = Rplan * C;
  
  return (
    <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
      <div className="text-xs font-bold text-purple-900 mb-2">Hujan Efektif: Reff = C × Rplan</div>
      <div className="p-2 bg-purple-100 rounded-lg mb-2">
        <p className="text-xs text-purple-800">Koefisien C = <span className="font-bold">{C.toFixed(2)}</span> (dari input utama)</p>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600 block mb-1">Hujan Rencana (Rplan)</label>
        <div className="relative">
          <input
            type="number"
            value={Rplan}
            onChange={e => setRplan(parseFloat(e.target.value) || 0)}
            className="w-full bg-white border border-purple-300 text-sm font-bold rounded-lg p-3 pr-12"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">mm</span>
        </div>
      </div>
      <button
        onClick={() => {
          onApply(parseFloat(Reff.toFixed(2)));
          onClose();
        }}
        className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-bold"
      >
        Gunakan Reff = {Reff.toFixed(2)} mm
      </button>
    </div>
  );
};
