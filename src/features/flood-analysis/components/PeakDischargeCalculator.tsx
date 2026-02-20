import React, { useState } from 'react';
import { Calculator, CheckCircle2, Info } from 'lucide-react';
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
          A: inputs.area * 100 // Convert km² to Ha
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
    <div className="space-y-4">
      {/* Method Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <label className="block text-sm font-bold text-slate-700 mb-3">Pilih Metode Empiris</label>
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
                  <div className="font-semibold text-slate-900">{m.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{m.range}</div>
                </div>
                {inputs.area > 0 && isRecommended(m.id, inputs.area) && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
        <h3 className="font-bold text-slate-900">Parameter Input</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Luas DAS (km²)</label>
            <input
              type="number"
              value={inputs.area || ''}
              onChange={(e) => setInputs({ ...inputs, area: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Koefisien Limpasan (C)</label>
            <input
              type="number"
              step="0.01"
              value={inputs.C || ''}
              onChange={(e) => setInputs({ ...inputs, C: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Intensitas Hujan (mm/jam)</label>
            <input
              type="number"
              value={inputs.I || ''}
              onChange={(e) => setInputs({ ...inputs, I: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {method !== 'rational' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Panjang Sungai (km)</label>
                <input
                  type="number"
                  value={inputs.L || ''}
                  onChange={(e) => setInputs({ ...inputs, L: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kemiringan (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.S || ''}
                  onChange={(e) => setInputs({ ...inputs, S: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>

        <button
          onClick={handleCalculate}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Calculator className="w-5 h-5" />
          Hitung Debit Puncak
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-blue-900">Hasil Perhitungan</h3>
          </div>
          
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="text-sm font-semibold text-slate-600 mb-2">Debit Puncak (Qp)</div>
            <div className="text-5xl font-black text-blue-600">{result.Qp.toFixed(2)}</div>
            <div className="text-lg font-semibold text-slate-500 mt-1">m³/detik</div>
          </div>

          {result.params && (
            <div className="mt-4 bg-white rounded-lg p-4 space-y-2 text-sm">
              <div className="font-semibold text-slate-700 mb-2">Parameter Perhitungan:</div>
              {result.params.t && <div className="flex justify-between"><span className="text-slate-600">Waktu Konsentrasi (t):</span><span className="font-semibold">{result.params.t.toFixed(2)} jam</span></div>}
              {result.params.alpha !== undefined && <div className="flex justify-between"><span className="text-slate-600">Koefisien α:</span><span className="font-semibold">{result.params.alpha.toFixed(3)}</span></div>}
              {result.params.beta !== undefined && <div className="flex justify-between"><span className="text-slate-600">Koefisien β:</span><span className="font-semibold">{result.params.beta.toFixed(3)}</span></div>}
            </div>
          )}

          <button
            onClick={onConsultAI}
            className="w-full mt-4 bg-amber-500 text-white py-2 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
          >
            Konsultasi AI
          </button>
        </div>
      )}
    </div>
  );
};
