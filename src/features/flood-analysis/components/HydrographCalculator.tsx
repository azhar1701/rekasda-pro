import React, { useState } from 'react';
import { Calculator, Activity, Info, Copy, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calculateHSSNakayasu, calculateHSSGamma1, calculateHSSSnyder } from '@/lib/engine/flood';
import type { HSSNakayasuInput, HSSGamma1Input, HSSSnyderInput } from '@/types/hydrology';
import { LocationIdentity } from '@/components/common/LocationIdentity';
import { PilotDataLoader } from '@/components/common/PilotDataLoader';
import { PilotDataNakayasu, PilotDataGamma1, PilotDataSnyder } from '@/data/floodPilotData';
import { SaveButton } from '@/components/ui/forms/SaveButton';
import { HSSFormulaDisplay } from '@/components/ui/data-display/HSSFormulaDisplay';
import { RainfallFrequencyAnalysis } from '@/features/flood-analysis/components/RainfallFrequencyAnalysis';
import { Collapsible } from '@/components/ui/Collapsible';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Tabs } from '@/components/ui/tabs';
import { getCurrentLocation } from '@/lib/utils/geolocation';
import { CalculationType } from '@/types/types';

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
  onSave: (type: CalculationType, inputs: any, outputs: any) => void;
  onConsultAI: () => void;
}

export const HydrographCalculator: React.FC<HydrographCalculatorProps> = ({ onSave, onConsultAI }) => {
  const [method, setMethod] = useState<HSSMethod>('nakayasu');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [nakayasuInputs, setNakayasuInputs] = useState<HSSNakayasuInput>({
    Ro: 0, Tg: 0, Tr: 0, Alpha: 2, A: 0, L: 0
  });
  const [gamma1Inputs, setGamma1Inputs] = useState<HSSGamma1Input>({
    Ro: 0, A: 0, L: 0, SF: 1.0, Tc: undefined
  });
  const [snyderInputs, setSnyderInputs] = useState<HSSSnyderInput>({
    Ro: 0, A: 0, L: 0, Lc: 0, Ct: 0.6, Cp: 0.6
  });
  const [result, setResult] = useState<{ Qp: number; Tp: number; Tb?: number; Tg?: number; Tr?: number; Alpha?: number; T03?: number; hydrograph: Array<{ time: number; discharge: number }> } | null>(null);



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
        setResult({ Qp: res.Qp, Tp: res.Tp, Tb: res.Tb, Tg: nakayasuInputs.Tg, Tr: nakayasuInputs.Tr, Alpha: nakayasuInputs.Alpha, hydrograph: res.hydrograph });
      } else if (method === 'gamma1') {
        const res = calculateHSSGamma1(gamma1Inputs);
        setResult({ Qp: res.Qp, Tp: res.Tp, Tb: res.Tb, hydrograph: res.hydrograph });
      } else if (method === 'snyder') {
        const res = calculateHSSSnyder(snyderInputs);
        setResult({ Qp: res.Qp, Tp: res.Tp, Tb: res.Tb, hydrograph: res.hydrograph });
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Calculation error');
    }
  };

  const handleSave = async () => {
    if (!result) return;

    setIsSaving(true);
    try {
      let currentLoc = locationData?.coordinates ? {
        latitude: locationData.coordinates.lat,
        longitude: locationData.coordinates.lng,
        accuracy: 10,
        timestamp: Date.now()
      } : null;

      if (!currentLoc) {
        try {
          currentLoc = await getCurrentLocation();
        } catch (e) {
          console.warn('Geolocation failed', e);
        }
      }

      const activeInputs = method === 'nakayasu' ? nakayasuInputs :
        method === 'gamma1' ? gamma1Inputs : snyderInputs;

      const saveInputs = {
        ...activeInputs,
        site: {
          channelName: locationData?.channelName || 'HSS ' + method,
          regency: locationData?.kabupaten || '',
          district: locationData?.kecamatan || '',
          village: locationData?.desa || '',
          location: currentLoc
        }
      };

      const saveOutputs = {
        ...result,
        method
      };

      onSave(CalculationType.RATIONAL, saveInputs, saveOutputs);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateVolume = () => {
    if (!result) return 0;
    const dt = result.hydrograph[1]?.time - result.hydrograph[0]?.time || 0.1;
    return result.hydrograph.reduce((sum, point) => sum + point.discharge * dt * 3600, 0);
  };

  const copyToClipboard = () => {
    if (!result) return;
    const csv = 'Waktu (jam),Debit (m³/s)\n' + result.hydrograph.map(p => `${p.time},${p.discharge}`).join('\n');
    navigator.clipboard.writeText(csv);
    alert('Data disalin ke clipboard!');
  };

  const downloadCSV = () => {
    if (!result) return;
    const csv = 'Waktu (jam),Debit (m³/s)\n' + result.hydrograph.map(p => `${p.time},${p.discharge}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hidrograf_${method}_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="h-full relative grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* LEFT: Input Section */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="lg:sticky lg:top-0 lg:h-full lg:overflow-y-auto lg:pr-2 space-y-4 pb-4">

          {/* Collapsible: Data Pilot & Location */}
          <Collapsible title="Data Pilot & Identitas Lokasi" defaultOpen={false}>
            <div className="space-y-4">
              <PilotDataLoader
                method={method === 'nakayasu' ? 'NAKAYASU' : method === 'gamma1' ? 'GAMMA1' : 'SNYDER'}
                onLoadRational={() => { }}
                onLoadModifiedRational={() => { }}
                onLoadNakayasu={handleLoadPilot}
                onLoadGamma1={handleLoadGamma1}
                onLoadSnyder={handleLoadSnyder}
              />
              <LocationIdentity onLocationChange={setLocationData} />
            </div>
          </Collapsible>

          {/* Collapsible: Rainfall Frequency Analysis */}
          <Collapsible
            title="Analisis Frekuensi Hujan"
            defaultOpen={false}
            badge={(method === 'nakayasu' && nakayasuInputs.Ro > 0) || (method === 'gamma1' && gamma1Inputs.Ro > 0) || (method === 'snyder' && snyderInputs.Ro > 0) ? '✓ Terisi' : undefined}
          >
            <RainfallFrequencyAnalysis
              onSelectValue={(_, value) => {
                if (method === 'nakayasu') setNakayasuInputs({ ...nakayasuInputs, Ro: value });
                else if (method === 'gamma1') setGamma1Inputs({ ...gamma1Inputs, Ro: value });
                else if (method === 'snyder') setSnyderInputs({ ...snyderInputs, Ro: value });
              }}
              onModalStateChange={() => { }}
            />
          </Collapsible>

          {/* Collapsible: Method Selection */}
          <Collapsible title="Pilih Metode HSS" defaultOpen={true}>
            <div className="space-y-4">
              <div className="bg-slate-50/50 p-3 rounded-md border border-slate-200">
                <Tabs defaultValue="nakayasu" value={method} onValueChange={(v) => setMethod(v as HSSMethod)}>
                  <SegmentedControl
                    items={methods.map(m => ({
                      value: m.id,
                      label: m.name
                    }))}
                    className="mb-2"
                  />
                </Tabs>
              </div>

              <HSSFormulaDisplay method={method} />

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-pupr-blue flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <p className="font-semibold mb-1">Metode HSS:</p>
                  <p>• <strong>Nakayasu:</strong> Standar Indonesia (SNI 2415:2016)</p>
                  <p>• <strong>Gamma I:</strong> DAS kecil-menengah (Sri Harto, 1993)</p>
                  <p>• <strong>Snyder:</strong> DAS besar (Snyder, 1938)</p>
                </div>
              </div>
            </div>
          </Collapsible>

          {/* Collapsible: Parameter Input */}
          <Collapsible title="Parameter Input" defaultOpen={true}>
            {/* Section A: Geometri DAS */}
            <div className="space-y-3 mb-5">
              <h3 className="text-xs font-bold text-pupr-blue uppercase tracking-wide border-b border-blue-200 pb-1.5">Geometri DAS</h3>
              {method === 'nakayasu' && (
                <>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Luas DAS (km²)</label><input type="number" value={nakayasuInputs.A || ''} onChange={(e) => setNakayasuInputs({ ...nakayasuInputs, A: parseFloat(e.target.value) || 0 })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Panjang Sungai (km)</label><input type="number" value={nakayasuInputs.L || ''} onChange={(e) => setNakayasuInputs({ ...nakayasuInputs, L: parseFloat(e.target.value) || 0 })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                </>
              )}
              {method === 'gamma1' && (
                <>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Luas DAS (km²)</label><input type="number" value={gamma1Inputs.A || ''} onChange={(e) => setGamma1Inputs({ ...gamma1Inputs, A: parseFloat(e.target.value) || 0 })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Panjang Sungai (km)</label><input type="number" value={gamma1Inputs.L || ''} onChange={(e) => setGamma1Inputs({ ...gamma1Inputs, L: parseFloat(e.target.value) || 0 })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                </>
              )}
              {method === 'snyder' && (
                <>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Luas DAS (km²)</label><input type="number" value={snyderInputs.A || ''} onChange={(e) => setSnyderInputs({ ...snyderInputs, A: parseFloat(e.target.value) || 0 })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Panjang Sungai (km)</label><input type="number" value={snyderInputs.L || ''} onChange={(e) => setSnyderInputs({ ...snyderInputs, L: parseFloat(e.target.value) || 0 })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Jarak ke Centroid (km)</label><input type="number" value={snyderInputs.Lc || ''} onChange={(e) => setSnyderInputs({ ...snyderInputs, Lc: parseFloat(e.target.value) || 0 })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                </>
              )}
            </div>

            {/* Section B: Parameter Hidrologi */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-green-600 uppercase tracking-wide border-b border-green-200 pb-1.5">Parameter Hidrologi</h3>
              {method === 'nakayasu' && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-slate-700">Hujan Satuan (mm)</label>
                      {nakayasuInputs.Ro > 0 && <span className="text-xs font-bold text-pupr-blue">✓ Terisi</span>}
                    </div>
                    <input type="number" value={nakayasuInputs.Ro || ''} onChange={(e) => setNakayasuInputs({ ...nakayasuInputs, Ro: parseFloat(e.target.value) || 0 })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" />
                    <p className="text-xs text-slate-500 mt-1">💡 Gunakan Analisis Frekuensi Hujan di atas</p>
                  </div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Time Lag (jam)</label><input type="number" step="0.1" value={nakayasuInputs.Tg || ''} onChange={(e) => setNakayasuInputs({ ...nakayasuInputs, Tg: parseFloat(e.target.value) || 0 })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Unit Time (jam)</label><input type="number" step="0.1" value={nakayasuInputs.Tr || ''} onChange={(e) => setNakayasuInputs({ ...nakayasuInputs, Tr: parseFloat(e.target.value) || 0 })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Koefisien α</label><input type="number" step="0.1" value={nakayasuInputs.Alpha || ''} onChange={(e) => setNakayasuInputs({ ...nakayasuInputs, Alpha: parseFloat(e.target.value) || 2 })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="2" /></div>
                </>
              )}
              {method === 'gamma1' && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-slate-700">Hujan Satuan (mm)</label>
                      {gamma1Inputs.Ro > 0 && <span className="text-xs font-bold text-pupr-blue">✓ Terisi</span>}
                    </div>
                    <input type="number" value={gamma1Inputs.Ro || ''} onChange={(e) => setGamma1Inputs({ ...gamma1Inputs, Ro: parseFloat(e.target.value) || 0 })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" />
                    <p className="text-xs text-slate-500 mt-1">💡 Gunakan Analisis Frekuensi Hujan di atas</p>
                  </div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Source Factor (SF)</label><input type="number" step="0.1" value={gamma1Inputs.SF || ''} onChange={(e) => setGamma1Inputs({ ...gamma1Inputs, SF: parseFloat(e.target.value) || 1.0 })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="1.0" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Waktu Konsentrasi (jam) - Opsional</label><input type="number" step="0.1" value={gamma1Inputs.Tc || ''} onChange={(e) => setGamma1Inputs({ ...gamma1Inputs, Tc: parseFloat(e.target.value) || undefined })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Auto" /></div>
                </>
              )}
              {method === 'snyder' && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-slate-700">Hujan Satuan (mm)</label>
                      {snyderInputs.Ro > 0 && <span className="text-xs font-bold text-pupr-blue">✓ Terisi</span>}
                    </div>
                    <input type="number" value={snyderInputs.Ro || ''} onChange={(e) => setSnyderInputs({ ...snyderInputs, Ro: parseFloat(e.target.value) || 0 })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" />
                    <p className="text-xs text-slate-500 mt-1">💡 Gunakan Analisis Frekuensi Hujan di atas</p>
                  </div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Koefisien Ct</label><input type="number" step="0.1" value={snyderInputs.Ct || ''} onChange={(e) => setSnyderInputs({ ...snyderInputs, Ct: parseFloat(e.target.value) || 0.6 })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0.6" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Koefisien Cp</label><input type="number" step="0.1" value={snyderInputs.Cp || ''} onChange={(e) => setSnyderInputs({ ...snyderInputs, Cp: parseFloat(e.target.value) || 0.6 })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0.6" /></div>
                </>
              )}
            </div>
          </Collapsible>

          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            className="w-full bg-pupr-blue hover:bg-blue-700 text-white font-medium rounded-md px-4 py-2.5 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Calculator className="w-4 h-4" />
            Hitung Hidrograf
          </button>
        </div>
      </div>

      {/* RIGHT: Result Section */}
      <div className="lg:col-span-7 flex flex-col gap-6 min-h-0">
        {result ? (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white rounded-md shadow-sm border border-slate-200 p-4 border-l-4 border-l-blue-500">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Debit Puncak (Qp)</div>
                <div className="flex items-baseline gap-2"><div className="text-3xl font-black text-slate-900">{result.Qp.toFixed(2)}</div><div className="text-sm font-bold text-slate-500">m³/s</div></div>
              </div>
              <div className="bg-white rounded-md shadow-sm border border-slate-200 p-4 border-l-4 border-l-amber-500">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Waktu Puncak (Tp)</div>
                <div className="flex items-baseline gap-2"><div className="text-3xl font-black text-slate-900">{result.Tp.toFixed(2)}</div><div className="text-sm font-bold text-slate-500">jam</div></div>
              </div>
            </div>

            {/* Hydrograph Chart */}
            <div className="bg-white rounded-md sm:rounded-md shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-pupr-blue" />
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

            {/* Engineering Data Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* Card A: Parameter Breakdown */}
              {method === 'nakayasu' && result.Tg !== undefined && (
                <div className="bg-white rounded-md shadow-sm border border-slate-200 p-4">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">📐 Verifikasi Parameter</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Time Lag (Tg)</span>
                      <span className="font-bold text-slate-900">{result.Tg?.toFixed(2)} jam</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Unit Time (Tr)</span>
                      <span className="font-bold text-slate-900">{result.Tr?.toFixed(2)} jam</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Time to Peak (Tp)</span>
                      <span className="font-bold text-slate-900">{result.Tp.toFixed(2)} jam</span>
                    </div>
                    {result.Tb && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Base Time (Tb)</span>
                        <span className="font-bold text-slate-900">{result.Tb.toFixed(2)} jam</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Koefisien α</span>
                      <span className="font-bold text-slate-900">{result.Alpha?.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Card B: Total Volume */}
              <div className="bg-white border border-slate-200 rounded-md shadow-sm p-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">💧 Total Volume Banjir</h3>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-black text-slate-900">{(calculateVolume() / 1000000).toFixed(2)}</div>
                  <div className="text-sm font-bold text-slate-500">× 10⁶ m³</div>
                </div>
                <p className="text-xs text-slate-400 mt-2">Untuk desain kolam retensi</p>
              </div>
            </div>

            {/* Card C: Data Table */}
            <div className="bg-white rounded-md shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800">📊 Ordinat Hidrograf</h3>
                <div className="flex gap-2">
                  <button onClick={copyToClipboard} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                  <button onClick={downloadCSV} className="text-xs bg-pupr-blue hover:bg-blue-700 text-white px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors">
                    <Download className="w-3 h-3" /> CSV
                  </button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-md">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-bold text-slate-700">Waktu (jam)</th>
                      <th className="text-right p-2 font-bold text-slate-700">Debit (m³/s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.hydrograph.map((point, idx) => (
                      <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="p-2 text-slate-600 tabular-nums tracking-tight">{point.time.toFixed(2)}</td>
                        <td className="p-2 text-right font-mono text-slate-900 tabular-nums tracking-tight">{point.discharge.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-md sm:rounded-md shadow-sm border border-slate-200 p-4 sm:p-5">
              <div className="flex gap-2">
                <SaveButton
                  onClick={handleSave}
                  label={isSaving ? "Menyiapkan..." : "Simpan Hasil"}
                  disabled={isSaving}
                />
                <button
                  onClick={onConsultAI}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-md px-4 py-2.5 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Konsultasi AI
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-md sm:rounded-md shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-md flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 text-sm">Masukkan parameter dan klik "Hitung Hidrograf"</p>
          </div>
        )}
      </div>
    </div >
  );
};
