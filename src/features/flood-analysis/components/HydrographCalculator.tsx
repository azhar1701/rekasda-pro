import React, { useState } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
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
    <div className="space-y-4">
      {/* Method Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <label className="block text-sm font-bold text-slate-700 mb-3">Pilih Metode HSS</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
              <div className="font-semibold text-slate-900">{m.name}</div>
              <div className="text-xs text-slate-500 mt-1">{m.desc}</div>
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
              value={inputs.A || ''}
              onChange={(e) => setInputs({ ...inputs, A: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Hujan Satuan (mm)</label>
            <input
              type="number"
              value={inputs.Ro || ''}
              onChange={(e) => setInputs({ ...inputs, Ro: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Time Lag (jam)</label>
            <input
              type="number"
              step="0.1"
              value={inputs.Tg || ''}
              onChange={(e) => setInputs({ ...inputs, Tg: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unit Time (jam)</label>
            <input
              type="number"
              step="0.1"
              value={inputs.Tr || ''}
              onChange={(e) => setInputs({ ...inputs, Tr: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Koefisien α</label>
            <input
              type="number"
              step="0.1"
              value={inputs.Alpha || ''}
              onChange={(e) => setInputs({ ...inputs, Alpha: parseFloat(e.target.value) || 2 })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleCalculate}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Calculator className="w-5 h-5" />
          Hitung Hidrograf
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-4">
              <div className="text-sm font-semibold text-blue-700 mb-1">Debit Puncak (Qp)</div>
              <div className="text-3xl font-black text-blue-600">{result.Qp.toFixed(2)}</div>
              <div className="text-sm font-semibold text-blue-600">m³/detik</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-4">
              <div className="text-sm font-semibold text-purple-700 mb-1">Waktu Puncak (Tp)</div>
              <div className="text-3xl font-black text-purple-600">{result.Tp.toFixed(2)}</div>
              <div className="text-sm font-semibold text-purple-600">jam</div>
            </div>
          </div>

          {/* Hydrograph Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900">Hidrograf Satuan Sintetis</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={result.hydrograph}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="time" 
                  label={{ value: 'Waktu (jam)', position: 'insideBottom', offset: -5 }}
                  stroke="#64748b"
                />
                <YAxis 
                  label={{ value: 'Debit (m³/s)', angle: -90, position: 'insideLeft' }}
                  stroke="#64748b"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
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

          <button
            onClick={onConsultAI}
            className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
          >
            Konsultasi AI
          </button>
        </div>
      )}
    </div>
  );
};
