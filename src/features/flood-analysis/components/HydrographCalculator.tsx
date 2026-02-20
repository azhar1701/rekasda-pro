import React, { useState } from 'react';
import { Calculator, Activity, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calculateHSSNakayasu, calculateHSSGamma1, calculateHSSSnyder } from '@/lib/engine/flood';
import type { HSSNakayasuInput, HSSGamma1Input, HSSSnyderInput } from '@/types/hydrology';
import { LocationIdentity } from '@/components/common/LocationIdentity';
import { PilotDataLoader } from '@/components/common/PilotDataLoader';
import { PilotDataNakayasu, PilotDataGamma1, PilotDataSnyder } from '@/data/floodPilotData';
import { MethodSelector } from '@/components/ui/forms/MethodSelector';
import { ResultCard } from '@/components/ui/data-display/ResultCard';
import { SaveButton } from '@/components/ui/forms/SaveButton';
import { HSSFormulaDisplay } from '@/components/ui/data-display/HSSFormulaDisplay';

interface LocationData {
  channelName: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  coordinates?: { lat: number; lng: number };
  photoUrl?: string;
}

type HSSMethod = 'nakayasu' | 'gamma1' | 'snyder';

interface HydrographCalculatorProps {
  onConsultAI: () => void;
}

export const HydrographCalculator: React.FC<HydrographCalculatorProps> = ({ onConsultAI }) => {
  const [method, setMethod] = useState<HSSMethod>('nakayasu');
  const [_locationData, setLocationData] = useState<LocationData | null>(null);
  const [nakayasuInputs, setNakayasuInputs] = useState<HSSNakayasuInput>({
    Ro: 0, Tg: 0, Tr: 0, Alpha: 2, A: 0, L: 0
  });
  const [gamma1Inputs, setGamma1Inputs] = useState<HSSGamma1Input>({
    Ro: 0, A: 0, L: 0, SF: 1.0, Tc: undefined
  });
  const [snyderInputs, setSnyderInputs] = useState<HSSSnyderInput>({
    Ro: 0, A: 0, L: 0, Lc: 0, Ct: 0.6, Cp: 0.6
  });
  const [result, setResult] = useState<{ Qp: number; Tp: number; hydrograph: Array<{ time: number; discharge: number }> } | null>(null);

  const handleLoadPilot = (data: PilotDataNakayasu) => {
    if (method === 'nakayasu') {
      setNakayasuInputs({ A: data.inputs.A, L: data.inputs.L, Ro: data.inputs.Ro, Alpha: data.inputs.Alpha, Tg: 0, Tr: 0 });
    }
    if (data.location) setLocationData(data.location);
  };

  const handleLoadGamma1 = (data: PilotDataGamma1) => {
    setGamma1Inputs({ A: data.inputs.A, L: data.inputs.L, Ro: data.inputs.Ro, SF: data.inputs.SF, Tc: data.inputs.Tc });
    if (data.location) setLocationData(data.location);
  };

  const handleLoadSnyder = (data: PilotDataSnyder) => {
    setSnyderInputs({ A: data.inputs.A, L: data.inputs.L, Lc: data.inputs.Lc, Ro: data.inputs.Ro, Ct: data.inputs.Ct, Cp: data.inputs.Cp });
    if (data.location) setLocationData(data.location);
  };

  const methods = [
    { id: 'nakayasu', name: 'HSS Nakayasu', description: 'Standar Indonesia (SNI 2415:2016)', recommended: true },
    { id: 'gamma1', name: 'HSS Gamma I', description: 'DAS kecil-menengah (Sri Harto, 1993)', recommended: false },
    { id: 'snyder', name: 'HSS Snyder', description: 'DAS besar (Snyder, 1938)', recommended: false }
  ];

  const handleCalculate = () => {
    try {
      if (method === 'nakayasu') {
        const res = calculateHSSNakayasu(nakayasuInputs);
        setResult({ Qp: res.Qp, Tp: res.Tp, hydrograph: res.hydrograph });
      } else if (method === 'gamma1') {
        const res = calculateHSSGamma1(gamma1Inputs);
        setResult({ Qp: res.Qp, Tp: res.Tp, hydrograph: res.hydrograph });
      } else if (method === 'snyder') {
        const res = calculateHSSSnyder(snyderInputs);
        setResult({ Qp: res.Qp, Tp: res.Tp, hydrograph: res.hydrograph });
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Calculation error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
      
      {/* LEFT: Input Section */}
      <div className="lg:col-span-5 space-y-4">
        
        {/* Pilot Data Loader */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 sm:mb-4">Data Pilot</h2>
          <PilotDataLoader
            method={method === 'nakayasu' ? 'NAKAYASU' : method === 'gamma1' ? 'GAMMA1' : 'SNYDER'}
            onLoadRational={() => {}}
            onLoadModifiedRational={() => {}}
            onLoadNakayasu={handleLoadPilot}
            onLoadGamma1={handleLoadGamma1}
            onLoadSnyder={handleLoadSnyder}
          />
        </div>

        {/* Location Identity */}
        <LocationIdentity onLocationChange={setLocationData} />
        
        {/* Method Selector */}
        <MethodSelector
          methods={methods}
          selected={method}
          onChange={(id) => setMethod(id as HSSMethod)}
          title="Pilih Metode HSS"
          columns={1}
        />
        
        {/* Formula Display */}
        <HSSFormulaDisplay method={method} />
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800">
            <p className="font-semibold mb-1">Metode HSS:</p>
            <p>• <strong>Nakayasu:</strong> Standar Indonesia (SNI 2415:2016)</p>
            <p>• <strong>Gamma I:</strong> DAS kecil-menengah (Sri Harto, 1993)</p>
            <p>• <strong>Snyder:</strong> DAS besar (Snyder, 1938)</p>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 sm:mb-4">Parameter Input</h2>
          
          <div className="space-y-3">
            {method === 'nakayasu' && (
              <>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Luas DAS (km²)</label><input type="number" value={nakayasuInputs.A || ''} onChange={(e) => setNakayasuInputs({ ...nakayasuInputs, A: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Panjang Sungai (km)</label><input type="number" value={nakayasuInputs.L || ''} onChange={(e) => setNakayasuInputs({ ...nakayasuInputs, L: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Hujan Satuan (mm)</label><input type="number" value={nakayasuInputs.Ro || ''} onChange={(e) => setNakayasuInputs({ ...nakayasuInputs, Ro: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Time Lag (jam)</label><input type="number" step="0.1" value={nakayasuInputs.Tg || ''} onChange={(e) => setNakayasuInputs({ ...nakayasuInputs, Tg: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Unit Time (jam)</label><input type="number" step="0.1" value={nakayasuInputs.Tr || ''} onChange={(e) => setNakayasuInputs({ ...nakayasuInputs, Tr: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Koefisien α</label><input type="number" step="0.1" value={nakayasuInputs.Alpha || ''} onChange={(e) => setNakayasuInputs({ ...nakayasuInputs, Alpha: parseFloat(e.target.value) || 2 })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="2" /></div>
              </>
            )}
            {method === 'gamma1' && (
              <>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Luas DAS (km²)</label><input type="number" value={gamma1Inputs.A || ''} onChange={(e) => setGamma1Inputs({ ...gamma1Inputs, A: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Panjang Sungai (km)</label><input type="number" value={gamma1Inputs.L || ''} onChange={(e) => setGamma1Inputs({ ...gamma1Inputs, L: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Hujan Satuan (mm)</label><input type="number" value={gamma1Inputs.Ro || ''} onChange={(e) => setGamma1Inputs({ ...gamma1Inputs, Ro: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Source Factor (SF)</label><input type="number" step="0.1" value={gamma1Inputs.SF || ''} onChange={(e) => setGamma1Inputs({ ...gamma1Inputs, SF: parseFloat(e.target.value) || 1.0 })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="1.0" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Waktu Konsentrasi (jam) - Opsional</label><input type="number" step="0.1" value={gamma1Inputs.Tc || ''} onChange={(e) => setGamma1Inputs({ ...gamma1Inputs, Tc: parseFloat(e.target.value) || undefined })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Auto" /></div>
              </>
            )}
            {method === 'snyder' && (
              <>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Luas DAS (km²)</label><input type="number" value={snyderInputs.A || ''} onChange={(e) => setSnyderInputs({ ...snyderInputs, A: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Panjang Sungai (km)</label><input type="number" value={snyderInputs.L || ''} onChange={(e) => setSnyderInputs({ ...snyderInputs, L: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Jarak ke Centroid (km)</label><input type="number" value={snyderInputs.Lc || ''} onChange={(e) => setSnyderInputs({ ...snyderInputs, Lc: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Hujan Satuan (mm)</label><input type="number" value={snyderInputs.Ro || ''} onChange={(e) => setSnyderInputs({ ...snyderInputs, Ro: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Koefisien Ct</label><input type="number" step="0.1" value={snyderInputs.Ct || ''} onChange={(e) => setSnyderInputs({ ...snyderInputs, Ct: parseFloat(e.target.value) || 0.6 })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0.6" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Koefisien Cp</label><input type="number" step="0.1" value={snyderInputs.Cp || ''} onChange={(e) => setSnyderInputs({ ...snyderInputs, Cp: parseFloat(e.target.value) || 0.6 })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0.6" /></div>
              </>
            )}
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
              <ResultCard
                title="Debit Puncak (Qp)"
                value={result.Qp}
                unit="m³/s"
                gradient="from-blue-500 to-blue-600"
              />
              <ResultCard
                title="Waktu Puncak (Tp)"
                value={result.Tp}
                unit="jam"
                gradient="from-purple-500 to-purple-600"
              />
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
              <div className="flex gap-2">
                <SaveButton
                  onClick={() => alert('Save functionality')}
                  label="Simpan Hasil"
                />
                <button
                  onClick={onConsultAI}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg px-4 py-2.5 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Konsultasi AI
                </button>
              </div>
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
