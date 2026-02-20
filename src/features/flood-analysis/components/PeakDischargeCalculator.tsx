import React, { useState } from 'react';
import { Calculator, CheckCircle2, TrendingUp } from 'lucide-react';
import { calculateRationalDischarge } from '@/lib/engine/rationalMethod';
import { calculateHaspersOsugi, calculateDerWeduwen, calculateMelchior } from '@/lib/engine/flood/modifiedRationalIndo';

type EmpiricalMethod = 'rational' | 'haspers' | 'weduwen' | 'melchior';

interface PeakDischargeCalculatorProps {
  onConsultAI: () => void;
}

interface Inputs {
  area: number;
  C: number;
  I: number;
  L: number;
  S: number;
}

export const PeakDischargeCalculator: React.FC<PeakDischargeCalculatorProps> = ({ onConsultAI }) => {
  const [method, setMethod] = useState<EmpiricalMethod>('rational');
  const [inputs, setInputs] = useState<Inputs>({
    area: 0,
    C: 0,
    I: 0,
    L: 0,
    S: 0
  });
  const [result, setResult] = useState<{ Qp: number; params?: any } | null>(null);

  const methods = [
    { id: 'rational' as const, name: 'Rasional Standar', range: 'A ≤ 3 km²' },
    { id: 'haspers' as const, name: 'Haspers & Osugi', range: '3-100 km²' },
    { id: 'weduwen' as const, name: 'der Weduwen', range: '3-100 km²' },
    { id: 'melchior' as const, name: 'Melchior', range: 'A > 100 km²' }
  ];

  const isRecommended = (methodId: EmpiricalMethod, area: number) => {
    if (methodId === 'rational') return area <= 3;
    if (methodId === 'haspers' || methodId === 'weduwen') return area > 3 && area <= 100;
    if (methodId === 'melchior') return area > 100;
    return false;
  };

  const handleCalculate = () => {
    try {
      if (method === 'rational') {
        const res = calculateRationalDischarge({
          C: inputs.C,
          I: inputs.I,
          A: inputs.area * 100
        });
        setResult({ Qp: res.Q });
      } else if (method === 'haspers') {
        const res = calculateHaspersOsugi(inputs.area, inputs.L, inputs.S / 100, inputs.I);
        setResult({ Qp: res.qPeak, params: res });
      } else if (method === 'weduwen') {
        const res = calculateDerWeduwen(inputs.area, inputs.L, inputs.S / 100, inputs.I);
        setResult({ Qp: res.qPeak, params: res });
      } else if (method === 'melchior') {
        const res = calculateMelchior(inputs.area, inputs.L, inputs.S / 100, inputs.I, inputs.C);
        setResult({ Qp: res.qPeak, params: res });
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Calculation error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
      
      {/* LEFT: Input Section */}
      <div className="lg:col-span-5 space-y-4">
        
        {/* Method Selector */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 sm:mb-4">Pilih Metode Empiris</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`relative p-3 rounded-lg border-2 text-left transition-all ${
                  method === m.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{m.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{m.range}</div>
                  </div>
                  {inputs.area > 0 && isRecommended(m.id, inputs.area) && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 sm:mb-4">Parameter Input</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Luas DAS (km²)</label>
              <input
                type="number"
                value={inputs.area || ''}
                onChange={(e) => setInputs({ ...inputs, area: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Koefisien Limpasan (C)</label>
              <input
                type="number"
                step="0.01"
                value={inputs.C || ''}
                onChange={(e) => setInputs({ ...inputs, C: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="0.75"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Intensitas Hujan (mm/jam)</label>
              <input
                type="number"
                value={inputs.I || ''}
                onChange={(e) => setInputs({ ...inputs, I: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="100"
              />
            </div>
            {method !== 'rational' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Panjang Sungai (km)</label>
                  <input
                    type="number"
                    value={inputs.L || ''}
                    onChange={(e) => setInputs({ ...inputs, L: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Kemiringan (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputs.S || ''}
                    onChange={(e) => setInputs({ ...inputs, S: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="0.5"
                  />
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleCalculate}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2.5 transition-colors flex items-center justify-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Hitung Debit Puncak
          </button>
        </div>
      </div>

      {/* RIGHT: Result Section */}
      <div className="lg:col-span-7">
        {result ? (
          <div className="space-y-4">
            {/* Main Result Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wide opacity-90">Debit Puncak (Qp)</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-5xl font-black">{result.Qp.toFixed(2)}</div>
                <div className="text-lg font-bold opacity-80">m³/detik</div>
              </div>
            </div>

            {/* Parameters */}
            {result.params && (
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">Parameter Perhitungan</h3>
                <div className="grid grid-cols-2 gap-3">
                  {result.params.t && (
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <span className="text-xs font-bold text-slate-600 uppercase block mb-1">Waktu Konsentrasi</span>
                      <span className="text-lg font-bold text-slate-900">{result.params.t.toFixed(2)} <span className="text-xs text-slate-400">jam</span></span>
                    </div>
                  )}
                  {result.params.alpha !== undefined && (
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <span className="text-xs font-bold text-slate-600 uppercase block mb-1">Koefisien α</span>
                      <span className="text-lg font-bold text-slate-900">{result.params.alpha.toFixed(3)}</span>
                    </div>
                  )}
                  {result.params.beta !== undefined && (
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <span className="text-xs font-bold text-slate-600 uppercase block mb-1">Koefisien β</span>
                      <span className="text-lg font-bold text-slate-900">{result.params.beta.toFixed(3)}</span>
                    </div>
                  )}
                  {result.params.intensity && (
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <span className="text-xs font-bold text-slate-600 uppercase block mb-1">Intensitas</span>
                      <span className="text-lg font-bold text-slate-900">{result.params.intensity.toFixed(2)} <span className="text-xs text-slate-400">mm/jam</span></span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
              <button
                onClick={onConsultAI}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg px-4 py-2.5 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Konsultasi AI
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 text-sm">Masukkan parameter dan klik "Hitung Debit Puncak"</p>
          </div>
        )}
      </div>
    </div>
  );
};
