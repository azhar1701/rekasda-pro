import React, { useState } from 'react';

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
const GUMBEL_K = {
  2: -0.164,
  5: 0.719,
  10: 1.305,
  25: 2.044,
  50: 2.592,
  100: 3.137
};

const NORMAL_K = {
  2: 0.000,
  5: 0.842,
  10: 1.282,
  25: 1.751,
  50: 2.054,
  100: 2.326
};

const LOG_PEARSON_K = {
  2: -0.033,
  5: 0.842,
  10: 1.282,
  25: 1.751,
  50: 2.054,
  100: 2.326
};

type MethodType = 'gumbel' | 'normal' | 'logpearson';

export const FrequencyAnalysisCalculator: React.FC<{ onApply: (rainfalls: number[]) => void; onClose: () => void }> = ({ onApply, onClose }) => {
  const [method, setMethod] = useState<MethodType>('gumbel');
  const [inputMode, setInputMode] = useState<'stats' | 'data'>('data');
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
  const [mean, setMean] = useState(100);
  const [stdDev, setStdDev] = useState(20);
  const [skewness, setSkewness] = useState(0.5);
  
  const calculateStats = (data: number[]) => {
    const n = data.length;
    const avg = data.reduce((a, b) => a + b, 0) / n;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / (n - 1);
    const std = Math.sqrt(variance);
    const skew = data.reduce((sum, val) => sum + Math.pow((val - avg) / std, 3), 0) * n / ((n - 1) * (n - 2));
    return { mean: avg, stdDev: std, skewness: skew };
  };
  
  const parsedData = rainfallData.map(d => parseFloat(d.rainfall)).filter(v => !isNaN(v) && v > 0);
  const autoStats = parsedData.length >= 3 ? calculateStats(parsedData) : { mean: 0, stdDev: 0, skewness: 0 };
  
  const activeMean = inputMode === 'data' ? autoStats.mean : mean;
  const activeStdDev = inputMode === 'data' ? autoStats.stdDev : stdDev;
  const activeSkewness = inputMode === 'data' ? autoStats.skewness : skewness;
  
  const calculateRainfall = (period: 2 | 5 | 10 | 25 | 50 | 100) => {
    if (method === 'gumbel') {
      const K = GUMBEL_K[period];
      return activeMean + (K * activeStdDev);
    } else if (method === 'normal') {
      const K = NORMAL_K[period];
      return activeMean + (K * activeStdDev);
    } else {
      let K = LOG_PEARSON_K[period];
      const Cs = activeSkewness;
      K = K + (Cs / 6) * (K * K - 1);
      return activeMean + (K * activeStdDev);
    }
  };
  
  const results = [
    calculateRainfall(2),
    calculateRainfall(5),
    calculateRainfall(10),
    calculateRainfall(25),
    calculateRainfall(50),
    calculateRainfall(100)
  ];
  
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900">Analisis Frekuensi Hujan</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-600 block mb-2">Input Data</label>
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setInputMode('data')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                inputMode === 'data' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              Data Hujan
            </button>
            <button
              onClick={() => setInputMode('stats')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                inputMode === 'stats' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              Statistik Manual
            </button>
          </div>
        </div>
        
        {inputMode === 'data' ? (
          <div className="space-y-4 mb-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-600">Data Hujan Harian Maksimum (mm)</label>
                <button
                  onClick={() => setRainfallData([...rainfallData, {year: '', rainfall: ''}])}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700"
                >
                  + Tambah Baris
                </button>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left py-2 px-3 text-xs font-bold text-slate-600 w-24">Tahun</th>
                      <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Hujan (mm)</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="max-h-48 overflow-y-auto block">
                    {rainfallData.map((row, idx) => (
                      <tr key={idx} className="border-t border-slate-100 table table-fixed w-full">
                        <td className="py-2 px-3 w-24">
                          <input
                            type="text"
                            value={row.year}
                            onChange={e => {
                              const updated = [...rainfallData];
                              updated[idx].year = e.target.value;
                              setRainfallData(updated);
                            }}
                            placeholder="2024"
                            className="w-full bg-white border border-slate-200 text-xs rounded px-2 py-1 outline-none focus:border-teal-600"
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
                            className="w-full bg-white border border-slate-200 text-xs rounded px-2 py-1 outline-none focus:border-teal-600"
                          />
                        </td>
                        <td className="py-2 px-2 w-10">
                          <button
                            onClick={() => setRainfallData(rainfallData.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700"
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
              <p className="text-xs text-slate-500 mt-1">Minimal 3 data untuk analisis</p>
            </div>
            {parsedData.length >= 3 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="text-xs font-bold text-emerald-900 mb-2">Statistik Otomatis (n={parsedData.length})</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-600">Rata-rata:</span>
                    <div className="font-bold text-slate-900">{autoStats.mean.toFixed(2)} mm</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Std Dev:</span>
                    <div className="font-bold text-slate-900">{autoStats.stdDev.toFixed(2)} mm</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Skewness:</span>
                    <div className="font-bold text-slate-900">{autoStats.skewness.toFixed(3)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Rata-rata Hujan (X̄)</label>
              <div className="relative">
                <input
                  type="number"
                  value={mean}
                  onChange={e => setMean(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 text-sm font-bold rounded-lg p-3 pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">mm</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Standar Deviasi (S)</label>
              <div className="relative">
                <input
                  type="number"
                  value={stdDev}
                  onChange={e => setStdDev(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 text-sm font-bold rounded-lg p-3 pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">mm</span>
              </div>
            </div>
            {method === 'logpearson' && (
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Koefisien Skewness (Cs)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={skewness}
                    onChange={e => setSkewness(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 text-sm font-bold rounded-lg p-3"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Nilai tipikal: -0.5 hingga 1.5</p>
              </div>
            )}
          </div>
        )}
        
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-600 block mb-2">Metode Analisis</label>
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setMethod('gumbel')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                method === 'gumbel' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Gumbel
            </button>
            <button
              onClick={() => setMethod('normal')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                method === 'normal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setMethod('logpearson')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                method === 'logpearson' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Log Pearson III
            </button>
          </div>
        </div>
        
        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <div className="text-xs font-bold text-slate-600 mb-2">
            Hasil Perhitungan {method === 'gumbel' ? '(Gumbel)' : method === 'normal' ? '(Normal)' : '(Log Pearson III)'}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-xs font-bold text-slate-600">Periode</th>
                <th className="text-center py-2 text-xs font-bold text-slate-600">K</th>
                <th className="text-right py-2 text-xs font-bold text-slate-600">Hujan (mm)</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(GUMBEL_K).map((period, idx) => {
                const K = method === 'gumbel' ? GUMBEL_K[period as keyof typeof GUMBEL_K] : 
                         method === 'normal' ? NORMAL_K[period as keyof typeof NORMAL_K] :
                         LOG_PEARSON_K[period as keyof typeof LOG_PEARSON_K];
                return (
                  <tr key={period} className="border-b border-slate-100">
                    <td className="py-2 font-bold text-slate-900">Q{period}</td>
                    <td className="py-2 text-center text-slate-600">{K.toFixed(3)}</td>
                    <td className="py-2 text-right font-bold text-emerald-600">{results[idx].toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <button
          onClick={() => {
            onApply(results);
            onClose();
          }}
          disabled={inputMode === 'data' && parsedData.length < 3}
          className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Terapkan Semua ke Tabel
        </button>
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
