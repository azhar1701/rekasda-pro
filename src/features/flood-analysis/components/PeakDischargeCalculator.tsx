import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, TrendingUp, Info, AlertTriangle } from 'lucide-react';
import { calculateRationalDischarge as calculateRationalMethod } from '@/lib/engine/rationalMethod';
import { calculateHaspersOsugi, calculateDerWeduwen, calculateMelchior } from '@/lib/engine/flood/modifiedRationalIndo';
import { useSNI2415Workflow } from '@/hooks/useSNI2415Workflow';
import { LocationIdentity } from '@/components/common/LocationIdentity';
import { PilotDataLoader } from '@/components/common/PilotDataLoader';
import { PilotDataRational, PilotDataModifiedRational } from '@/data/floodPilotData';
import { RunoffCoefficientInput } from '@/features/flood-analysis/components/RunoffCoefficientInput';
import { RainfallFrequencyAnalysis } from '@/features/flood-analysis/components/RainfallFrequencyAnalysis';
import { MethodSelector } from '@/components/ui/forms/MethodSelector';
import { SaveButton } from '@/components/ui/forms/SaveButton';
import { FormulaDisplay } from '@/components/ui/data-display/FormulaDisplay';
import { Collapsible } from '@/components/ui/Collapsible';
import { SlopeCalculator } from '@/features/channel-analysis/components/SlopeCalculator';

interface LocationData {
  channelName: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  coordinates?: { lat: number; lng: number };
  photoUrl?: string;
}

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
  const [_locationData, setLocationData] = useState<LocationData | null>(null);
  const [leftWidth, setLeftWidth] = useState(() => {
    const saved = localStorage.getItem('flood-sidebar-width');
    return saved ? parseFloat(saved) : 35;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [inputs, setInputs] = useState<Inputs>({
    area: 0,
    C: 0,
    I: 0,
    L: 0,
    S: 0
  });
  const [result, setResult] = useState<{ Qp: number; params?: any } | null>(null);
  const [useManualC, setUseManualC] = useState(false);
  const [showSlopeCalculator, setShowSlopeCalculator] = useState(false);

  const sniWorkflow = useMemo(() => {
    return useSNI2415Workflow(inputs.area);
  }, [inputs.area]);

  useEffect(() => {
    localStorage.setItem('flood-sidebar-width', leftWidth.toString());
  }, [leftWidth]);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = (e.clientX / window.innerWidth) * 100;
      const clampedWidth = Math.min(Math.max(newWidth, 25), 50);
      setLeftWidth(clampedWidth);
    };
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleLoadPilot = (data: PilotDataRational) => {
    setInputs({
      area: data.inputs.A,
      C: data.inputs.C,
      I: data.inputs.I,
      L: 0,
      S: 0
    });
    if (data.location) {
      setLocationData(data.location);
    }
  };

  const handleLoadModifiedPilot = (data: PilotDataModifiedRational) => {
    setInputs({
      area: data.inputs.A,
      C: data.inputs.C || 0,
      I: data.inputs.I,
      L: data.inputs.L,
      S: data.inputs.S
    });
    if (data.location) {
      setLocationData(data.location);
    }
  };

  const methods = [
    { id: 'rational', name: 'Rasional Standar', description: 'A ≤ 3 km²', recommended: inputs.area > 0 && inputs.area <= 3 },
    { id: 'haspers', name: 'Haspers & Osugi', description: '3-100 km²', recommended: inputs.area > 3 && inputs.area <= 100 },
    { id: 'weduwen', name: 'der Weduwen', description: '3-100 km²', recommended: false },
    { id: 'melchior', name: 'Melchior', description: 'A > 100 km²', recommended: inputs.area > 100 }
  ];

  const handleCalculate = () => {
    try {
      if (method === 'rational') {
        const res = calculateRationalMethod({
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
      setResult(null);
    }
  };

  useEffect(() => {
    handleCalculate();
  }, [inputs, method]);

  return (
    <div>
      <div className="max-w-[1600px] mx-auto">

      <div className="lg:flex lg:gap-0">
      
      {/* LEFT: Input Section */}
      <div className="lg:block" style={{ width: window.innerWidth >= 1024 ? `${leftWidth}%` : '100%' }}>
        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-100px)] lg:overflow-y-auto lg:pr-2 space-y-4">
        
        {/* Collapsible: Data Pilot & Location */}
        <Collapsible title="Data Pilot & Identitas Lokasi" defaultOpen={false}>
          <div className="space-y-4">
            <PilotDataLoader
              method={method === 'rational' ? 'RATIONAL' : method === 'haspers' ? 'HASPERS' : method === 'weduwen' ? 'WEDUWEN' : 'MELCHIOR'}
              onLoadRational={handleLoadPilot}
              onLoadModifiedRational={handleLoadModifiedPilot}
              onLoadNakayasu={() => {}}
            />
            <div className="border-t border-white/20 pt-4">
              <LocationIdentity onLocationChange={setLocationData} />
            </div>
          </div>
        </Collapsible>
        
        {/* Collapsible: Rainfall Frequency Analysis */}
        <Collapsible 
          title="Analisis Frekuensi Hujan" 
          defaultOpen={false}
          badge={inputs.I > 0 ? '✓ Terisi' : undefined}
        >
          <RainfallFrequencyAnalysis
            onSelectValue={(_, value) => {
              setInputs({ ...inputs, I: value });
            }}
          />
        </Collapsible>
        
        {/* Collapsible: Method Selection */}
        <Collapsible title="Pilih Metode" defaultOpen={true}>
          <div className="space-y-4">
            {inputs.area > 0 && sniWorkflow.warning && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-800">
                  <p className="font-semibold mb-1">Peringatan SNI 2415:2016 Pasal 5.2</p>
                  <p>{sniWorkflow.warning}</p>
                </div>
              </div>
            )}
            
            <MethodSelector
              methods={methods}
              selected={method}
              onChange={(id) => setMethod(id as EmpiricalMethod)}
              title="Pilih Metode Empiris"
              columns={2}
            />
            
            <FormulaDisplay method={method} />
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-semibold mb-1">Panduan Pemilihan:</p>
                <p>• <strong>Rasional:</strong> DAS ≤ 3 km²</p>
                <p>• <strong>Haspers/Weduwen:</strong> 3-100 km²</p>
                <p>• <strong>Melchior:</strong> &gt; 100 km²</p>
              </div>
            </div>
          </div>
        </Collapsible>
        
        {/* Collapsible: Parameter Input */}
        <Collapsible title="Parameter Input" defaultOpen={true}>
          <div className="space-y-4">
            {inputs.area > 0 && sniWorkflow.warning && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-800">
                  <p className="font-semibold mb-1">Peringatan SNI 2415:2016 Pasal 5.2</p>
                  <p>{sniWorkflow.warning}</p>
                </div>
              </div>
            )}
            
            <MethodSelector
              methods={methods}
              selected={method}
              onChange={(id) => setMethod(id as EmpiricalMethod)}
              title="Pilih Metode Empiris"
              columns={2}
            />
            
            <FormulaDisplay method={method} />
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-semibold mb-1">Panduan Pemilihan:</p>
                <p>• <strong>Rasional:</strong> DAS ≤ 3 km²</p>
                <p>• <strong>Haspers/Weduwen:</strong> 3-100 km²</p>
                <p>• <strong>Melchior:</strong> &gt; 100 km²</p>
              </div>
            </div>

            {/* Input Form */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wide border-b border-blue-200 pb-1.5">Geometri DAS</h3>
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
                    <button
                      onClick={() => setShowSlopeCalculator(!showSlopeCalculator)}
                      className="mt-2 w-full px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 text-xs font-bold"
                    >
                      Kalkulator Kemiringan
                    </button>
                    {showSlopeCalculator && (
                      <div className="mt-3">
                        <SlopeCalculator
                          onSlopeCalculated={(slope) => {
                            setInputs({ ...inputs, S: slope * 100 });
                            setShowSlopeCalculator(false);
                          }}
                          onClose={() => setShowSlopeCalculator(false)}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-green-600 uppercase tracking-wide border-b border-green-200 pb-1.5">Parameter Hidrologi</h3>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">Koefisien Limpasan (C)</label>
                  <button
                    type="button"
                    onClick={() => setUseManualC(!useManualC)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {useManualC ? '📋 Gunakan Tabel SNI' : '✏️ Input Manual'}
                  </button>
                </div>
                {useManualC ? (
                  <input
                    type="number"
                    step="0.01"
                    value={inputs.C || ''}
                    onChange={(e) => setInputs({ ...inputs, C: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="0.75"
                  />
                ) : (
                  <RunoffCoefficientInput
                    value={inputs.C}
                    onChange={(value) => setInputs({ ...inputs, C: value || 0 })}
                  />
                )}
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
                <p className="text-xs text-slate-500 mt-1">💡 Gunakan Analisis Frekuensi Hujan untuk menghitung nilai ini</p>
              </div>
            </div>
          </div>
        </Collapsible>
        </div>
      </div>

      {/* Resizer */}
      <div
        onMouseDown={() => setIsResizing(true)}
        className={`hidden lg:block w-1 cursor-col-resize hover:bg-blue-500 transition-colors flex-shrink-0 relative ${isResizing ? 'bg-blue-500' : 'bg-transparent'}`}
        style={{ userSelect: 'none' }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-20 bg-slate-300 rounded-full hover:bg-blue-500 transition-colors"></div>
      </div>

      {/* RIGHT: Result Section */}
      <div className="mt-4 lg:mt-0" style={{ width: window.innerWidth >= 1024 ? `${100 - leftWidth}%` : '100%' }}>
        {result ? (
          <div className="space-y-4">
            {/* Main Result Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider opacity-90 mb-1">Debit Puncak Banjir Rencana</div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-4xl font-black">{result.Qp.toFixed(2)}</div>
                    <div className="text-lg font-bold opacity-80">m³/s</div>
                  </div>
                </div>
                <TrendingUp className="w-12 h-12 opacity-20" />
              </div>
              <div className="pt-4 border-t border-white/20">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="opacity-70 mb-1">Metode</div>
                    <div className="font-bold">{method.toUpperCase()}</div>
                  </div>
                  <div>
                    <div className="opacity-70 mb-1">Luas DAS</div>
                    <div className="font-bold">{inputs.area} km²</div>
                  </div>
                  <div>
                    <div className="opacity-70 mb-1">Koef. C</div>
                    <div className="font-bold">{inputs.C.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Engineering Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card A: Breakdown Variabel */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3">🔢 Breakdown Perhitungan</h3>
                <div className="space-y-2">
                  {method === 'rational' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Faktor Konversi</span>
                        <span className="font-bold text-slate-900">0.00278</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">C × I × A (Ha)</span>
                        <span className="font-bold text-slate-900">{(inputs.C * inputs.I * inputs.area * 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                        <span className="text-slate-600">Q = 0.00278 × C × I × A</span>
                        <span className="font-bold text-blue-600">{result.Qp.toFixed(2)} m³/s</span>
                      </div>
                    </>
                  )}
                  {method !== 'rational' && result.params?.t && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Waktu Konsentrasi (Tc)</span>
                        <span className="font-bold text-slate-900">{result.params.t.toFixed(2)} jam</span>
                      </div>
                      {result.params?.alpha !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Koefisien α</span>
                          <span className="font-bold text-slate-900">{result.params.alpha.toFixed(3)}</span>
                        </div>
                      )}
                      {result.params?.beta !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Koefisien β</span>
                          <span className="font-bold text-slate-900">{result.params.beta.toFixed(3)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Card B: Intensitas Hujan Info */}
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-sm p-4 text-white">
                <h3 className="text-xs font-bold uppercase tracking-wider opacity-90 mb-2">🌧️ Data Intensitas Hujan</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="opacity-80">Intensitas (I)</span>
                    <span className="font-bold">{inputs.I.toFixed(1)} mm/jam</span>
                  </div>
                  {result.params?.t && (
                    <div className="flex justify-between text-sm">
                      <span className="opacity-80">Waktu Konsentrasi (Tc)</span>
                      <span className="font-bold">{result.params.t.toFixed(2)} jam</span>
                    </div>
                  )}
                  <p className="text-xs opacity-75 mt-2">Dari analisis frekuensi hujan</p>
                </div>
              </div>
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
              <Calculator className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 text-sm">Masukkan parameter untuk melihat hasil perhitungan</p>
          </div>
        )}
      </div>
      </div>
      </div>
    </div>
  );
};
