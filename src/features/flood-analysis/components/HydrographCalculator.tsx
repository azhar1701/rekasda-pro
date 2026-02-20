import React, { useState } from 'react';
import { Calculator, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calculateHSSNakayasu } from '@/lib/engine/flood';
import type { HSSNakayasuInput } from '@/types/hydrology';

type HSSMethod = 'nakayasu' | 'gamma1' | 'snyder';

interface HydrographCalculatorProps {
  onConsultAI: () => void;
}

export const HydrographCalculator: React.FC<HydrographCalculatorProps> = ({ onConsultAI }) => {
  const [method, setMethod] = useState<HSSMethod>('nakayasu');
  const [inputs, setInputs] = useState<HSSNakayasuInput>({
    Ro: 0,
    Tg: 0,
    Tr: 0,
    Alpha: 2,
    A: 0,
    L: 0
  });
  const [result, setResult] = useState<{ Qp: number; Tp: number; hydrograph: Array<{ time: number; discharge: number }> } | null>(null);

  const methods = [
    { id: 'nakayasu' as const, name: 'HSS Nakayasu', desc: 'Standar Indonesia' },
    { id: 'gamma1' as const, name: 'HSS Gamma I', desc: 'DAS kecil-menengah' },
    { id: 'snyder' as const, name: 'HSS Snyder', desc: 'DAS besar' }
  ];

  const handleCalculate = () => {
    try {
      if (method === 'nakayasu') {
        const res = calculateHSSNakayasu(inputs);
        setResult({
          Qp: res.Qp,
          Tp: res.Tp,
          hydrograph: res.hydrograph
        });
      } else {
        alert(`${method} belum diimplementasikan`);
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
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 sm:mb-4">Pilih Metode HSS</h2>
          <div className="grid grid-cols-1 gap-2">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  method === m.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-semibold text-slate-900">{m.name}</div>
                <div className="text-xs text-slate-500 mt-1">{m.desc}</div>
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
                value={inputs.A || ''}
                onChange={(e) => setInputs({ ...inputs, A: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Panjang Sungai (km)</label>
              <input
                type="number"
                value={inputs.L || ''}
                onChange={(e) => setInputs({ ...inputs, L: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Hujan Satuan (mm)</label>
              <input
                type="number"
                value={inputs.Ro || ''}
                onChange={(e) => setInputs({ ...inputs, Ro: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Time Lag (jam)</label>
              <input
                type="number"
                step="0.1"
                value={inputs.Tg || ''}
                onChange={(e) => setInputs({ ...inputs, Tg: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Unit Time (jam)</label>
              <input
                type="number"
                step="0.1"
                value={inputs.Tr || ''}
                onChange={(e) => setInputs({ ...inputs, Tr: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Koefisien α</label>
              <input
                type="number"
                step="0.1"
                value={inputs.Alpha || ''}
                onChange={(e) => setInputs({ ...inputs, Alpha: parseFloat(e.target.value) || 2 })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="2"
              />
            </div>
          </div>

          <button
            onClick={handleCalculate}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2.5 transition-colors flex items-center justify-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Hitung Hidrograf
          </button>
        </div>
      </div>

      {/* RIGHT: Result Section */}
      <div className="lg:col-span-7">
        {result ? (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-md">
                <div className="text-xs font-bold uppercase tracking-wider opacity-90 mb-2">Debit Puncak (Qp)</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-black">{result.Qp.toFixed(2)}</div>
                  <div className="text-sm font-bold opacity-80">m³/s</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-md">
                <div className="text-xs font-bold uppercase tracking-wider opacity-90 mb-2">Waktu Puncak (Tp)</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-black">{result.Tp.toFixed(2)}</div>
                  <div className="text-sm font-bold opacity-80">jam</div>
                </div>
              </div>
            </div>

            {/* Hydrograph Chart */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="text-base sm:text-lg font-bold text-slate-800">Hidrograf Satuan Sintetis</h3>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={result.hydrograph}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="time" 
                    label={{ value: 'Waktu (jam)', position: 'insideBottom', offset: -5 }}
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'Debit (m³/s)', angle: -90, position: 'insideLeft' }}
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number) => [`${value.toFixed(2)} m³/s`, 'Debit']}
                    labelFormatter={(label) => `Waktu: ${label} jam`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="discharge" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

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
              <Activity className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 text-sm">Masukkan parameter dan klik "Hitung Hidrograf"</p>
          </div>
        )}
      </div>
    </div>
  );
};
