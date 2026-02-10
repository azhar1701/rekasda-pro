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

// 3. Kalkulator Analisis Frekuensi (Gumbel)
const GUMBEL_K = {
  2: -0.164,
  5: 0.719,
  10: 1.305,
  25: 2.044,
  50: 2.592,
  100: 3.137
};

export const FrequencyAnalysisCalculator: React.FC<{ onApply: (rainfalls: number[]) => void; onClose: () => void }> = ({ onApply, onClose }) => {
  const [mean, setMean] = useState(100);
  const [stdDev, setStdDev] = useState(20);
  
  const calculateRainfall = (period: keyof typeof GUMBEL_K) => {
    const K = GUMBEL_K[period];
    return mean + (K * stdDev);
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900">Analisis Frekuensi Gumbel</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
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
        </div>
        
        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <div className="text-xs font-bold text-slate-600 mb-2">Hasil Perhitungan (XT = X̄ + K×S)</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-xs font-bold text-slate-600">Periode</th>
                <th className="text-center py-2 text-xs font-bold text-slate-600">K</th>
                <th className="text-right py-2 text-xs font-bold text-slate-600">Hujan (mm)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(GUMBEL_K).map(([period, k], idx) => (
                <tr key={period} className="border-b border-slate-100">
                  <td className="py-2 font-bold text-slate-900">Q{period}</td>
                  <td className="py-2 text-center text-slate-600">{k.toFixed(3)}</td>
                  <td className="py-2 text-right font-bold text-emerald-600">{results[idx].toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <button
          onClick={() => {
            onApply(results);
            onClose();
          }}
          className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-bold"
        >
          Terapkan Semua ke Tabel
        </button>
      </div>
    </div>
  );
};

// 4. Kalkulator Hujan Efektif
export const EffectiveRainfallCalculator: React.FC<{ onApply: (Ro: number) => void; onClose: () => void }> = ({ onApply, onClose }) => {
  const [Rplan, setRplan] = useState(100);
  const [C, setC] = useState(0.7);
  
  const Reff = Rplan * C;
  
  return (
    <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
      <div className="text-xs font-bold text-purple-900 mb-2">Hujan Efektif: Reff = C × Rplan</div>
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
      <div>
        <label className="text-xs font-semibold text-slate-600 block mb-1">Koefisien Limpasan (C)</label>
        <input
          type="number"
          step="0.01"
          value={C}
          onChange={e => setC(parseFloat(e.target.value) || 0)}
          className="w-full bg-white border border-purple-300 text-sm font-bold rounded-lg p-3"
        />
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
