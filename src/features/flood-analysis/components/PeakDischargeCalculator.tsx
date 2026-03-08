import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, TrendingUp, Info, AlertTriangle } from 'lucide-react';
// import { calculateRationalDischarge as calculateRationalMethod } from '@/lib/engine/rationalMethod';
// import { calculateHaspersOsugi, calculateDerWeduwen, calculateMelchior } from '@/lib/engine/flood/modifiedRationalIndo';
import { useSNI2415Workflow } from '@/hooks/useSNI2415Workflow';
import { LocationIdentity } from '@/components/common/LocationIdentity';
import { PilotDataLoader } from '@/components/common/PilotDataLoader';
import { PilotDataRational, PilotDataModifiedRational } from '@/data/floodPilotData';
import RunoffCoefficientInput from '@/features/flood-analysis/components/RunoffCoefficientInput';
import { RainfallFrequencyAnalysis } from '@/features/flood-analysis/components/RainfallFrequencyAnalysis';
import { SaveButton } from '@/components/ui/forms/SaveButton';
import { FormulaDisplay } from '@/components/ui/data-display/FormulaDisplay';
import { Collapsible } from '@/components/ui/Collapsible';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Tabs } from "@/components/ui/tabs";
import { SlopeCalculator } from '@/features/channel-analysis/components/SlopeCalculator';
import { getCurrentLocation } from '@/lib/utils/geolocation';
import { CalculationType } from '@/types/types';
import { useRasionalModifikasiMutation } from '@/hooks/api/useBanjirApi';

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
  onSave: (type: CalculationType, inputs: any, outputs: any) => void;
  onConsultAI: () => void;
}

interface Inputs {
  area: number;
  C: number;
  I: number;
  L: number;
  S: number;
}

export const PeakDischargeCalculator: React.FC<PeakDischargeCalculatorProps> = ({ onSave, onConsultAI }) => {
  const [method, setMethod] = useState<EmpiricalMethod>('rational');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [inputs, setInputs] = useState<Inputs>({
    area: 0,
    C: 0,
    I: 0,
    L: 0,
    S: 0
  });
  const [result, setResult] = useState<{ Qp: number; params?: any; t?: number; alpha?: number; beta?: number; method?: string } | null>(null);
  const [useManualC, setUseManualC] = useState(false);
  const [showSlopeCalculator, setShowSlopeCalculator] = useState(false);

  const sniWorkflow = useMemo(() => {
    return useSNI2415Workflow(inputs.area);
  }, [inputs.area]);



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

  const rasionalMutation = useRasionalModifikasiMutation();

  const handleCalculate = async () => {
    try {
      if (method === 'rational') {
        const A_ha = inputs.area * 100;
        const Q = 0.002777777777777778 * inputs.C * inputs.I * A_ha;
        setResult({ Qp: Q });
      } else {
        const res = await rasionalMutation.mutateAsync({
          method: method === 'weduwen' ? 'der_weduwen' : method as any,
          A: inputs.area,
          L: inputs.L,
          S: inputs.S / 100,
          I: inputs.I,
          C: method === 'melchior' ? inputs.C : undefined
        });
        setResult({ Qp: res.qPeak, ...res });
      }
    } catch (error: any) {
      setResult(null);
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

      const saveInputs = {
        ...inputs,
        site: {
          channelName: locationData?.channelName || 'Analisis Banjir ' + method,
          regency: locationData?.kabupaten || '',
          district: locationData?.kecamatan || '',
          village: locationData?.desa || '',
          location: currentLoc
        }
      };

      const saveOutputs = {
        ...result,
        method,
      };

      onSave(CalculationType.RATIONAL, saveInputs, saveOutputs);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    handleCalculate();
  }, [inputs, method]);

  return (
    <div className="h-full relative grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* LEFT: Input Section */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="lg:sticky lg:top-0 lg:h-full lg:overflow-y-auto lg:pr-2 space-y-4 pb-4">

          {/* Collapsible: Data Pilot & Location */}
          <Collapsible title="Data Pilot & Identitas Lokasi" defaultOpen={false}>
            <div className="space-y-4">
              <PilotDataLoader
                method={method === 'rational' ? 'RATIONAL' : method === 'haspers' ? 'HASPERS' : method === 'weduwen' ? 'WEDUWEN' : 'MELCHIOR'}
                onLoadRational={handleLoadPilot}
                onLoadModifiedRational={handleLoadModifiedPilot}
                onLoadNakayasu={() => { }}
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
              onModalStateChange={() => { }}
            />
          </Collapsible>

          {/* Collapsible: Method Selection */}
          <Collapsible title="Pilih Metode" defaultOpen={true}>
            <div className="space-y-4">
              {inputs.area > 0 && sniWorkflow.warning && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-red-800">
                    <p className="font-semibold mb-1">Peringatan SNI 2415:2016 Pasal 5.2</p>
                    <p>{sniWorkflow.warning}</p>
                  </div>
                </div>
              )}

              <div className="bg-slate-50/50 p-3 rounded-md border border-slate-200">
                <Tabs defaultValue="rational" value={method} onValueChange={(v) => setMethod(v as EmpiricalMethod)}>
                  <SegmentedControl
                    items={methods.map(m => ({
                      value: m.id,
                      label: m.name
                    }))}
                    className="mb-2"
                  />
                </Tabs>
              </div>

              <FormulaDisplay method={method} />

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2">
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
              {/* Input Form */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-pupr-blue uppercase tracking-wide border-b border-blue-200 pb-1.5">Geometri DAS</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Luas DAS (km²)</label>
                  <input
                    type="number"
                    value={inputs.area || ''}
                    onChange={(e) => setInputs({ ...inputs, area: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="0.5"
                      />
                      <button
                        onClick={() => setShowSlopeCalculator(!showSlopeCalculator)}
                        className="mt-2 w-full px-3 py-2 text-pupr-blue bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-200 text-xs font-bold"
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
                      className="text-xs text-pupr-blue hover:text-blue-700 font-medium"
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
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="0.75"
                    />
                  ) : (
                    <RunoffCoefficientInput
                      value={inputs.C}
                      onChange={(value: number | null) => setInputs({ ...inputs, C: value || 0 })}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Intensitas Hujan (mm/jam)</label>
                  <input
                    type="number"
                    value={inputs.I || ''}
                    onChange={(e) => setInputs({ ...inputs, I: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="100"
                  />
                  <p className="text-xs text-slate-500 mt-1">💡 Gunakan Analisis Frekuensi Hujan untuk menghitung nilai ini</p>
                </div>
              </div>
            </div>
          </Collapsible>
        </div>
      </div>

      {/* RIGHT: Result Section */}
      <div className="lg:col-span-7 flex flex-col gap-6 min-h-0">
        {result ? (
          <div className="space-y-4">
            {/* Main Result Card */}
            <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">Debit Puncak Banjir Rencana</div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-4xl font-extrabold text-slate-900">{result.Qp.toFixed(2)}</div>
                    <div className="text-lg font-bold text-slate-500">m³/s</div>
                  </div>
                </div>
                <TrendingUp className="w-12 h-12 text-slate-100" />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-slate-500 mb-1">Metode</div>
                    <div className="font-bold text-slate-900">{method.toUpperCase()}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Luas DAS</div>
                    <div className="font-bold text-slate-900">{inputs.area} km²</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Koef. C</div>
                    <div className="font-bold text-slate-900">{inputs.C.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Engineering Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card A: Breakdown Variabel */}
              <div className="bg-white rounded-md shadow-sm border border-slate-200 p-4">
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
                        <span className="font-bold text-pupr-blue">{result.Qp.toFixed(2)} m³/s</span>
                      </div>
                    </>
                  )}
                  {method !== 'rational' && result.t !== undefined && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Waktu Konsentrasi (Tc)</span>
                        <span className="font-bold text-slate-900">{result.t.toFixed(2)} jam</span>
                      </div>
                      {result.alpha !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Koefisien α</span>
                          <span className="font-bold text-slate-900">{result.alpha.toFixed(3)}</span>
                        </div>
                      )}
                      {result.beta !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Koefisien β</span>
                          <span className="font-bold text-slate-900">{result.beta.toFixed(3)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Card B: Intensitas Hujan Info */}
              <div className="bg-white border border-slate-200 rounded-md shadow-sm p-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">🌧️ Data Intensitas Hujan</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Intensitas (I)</span>
                    <span className="font-bold text-slate-900">{inputs.I.toFixed(1)} mm/jam</span>
                  </div>
                  {result.t !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Waktu Konsentrasi (Tc)</span>
                      <span className="font-bold text-slate-900">{result.t.toFixed(2)} jam</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-2">Dari analisis frekuensi hujan</p>
                </div>
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
              <Calculator className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 text-sm">Masukkan parameter untuk melihat hasil perhitungan</p>
          </div>
        )}
      </div>
    </div>
  );
};
