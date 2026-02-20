import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp, Info } from 'lucide-react';
import { calculateRationalDischarge as calculateRationalMethod } from '@/lib/engine/rationalMethod';
import { calculateHaspersOsugi, calculateDerWeduwen, calculateMelchior } from '@/lib/engine/flood/modifiedRationalIndo';
import { useSNI2415Workflow } from '@/lib/engine/flood/sni2415';
import { LocationIdentity } from '@/components/common/LocationIdentity';
import { PilotDataLoader } from '@/components/common/PilotDataLoader';
import { PilotDataRational, PilotDataModifiedRational } from '@/data/floodPilotData';
import { RunoffCoefficientInput } from '@/features/flood-analysis/components/RunoffCoefficientInput';
import { MethodSelector } from '@/components/ui/forms/MethodSelector';
import { ResultCard } from '@/components/ui/data-display/ResultCard';
import { SaveButton } from '@/components/ui/forms/SaveButton';
import { SNIWarning } from '@/components/ui/feedback/SNIWarning';
import { FormulaDisplay } from '@/components/ui/data-display/FormulaDisplay';

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
  const [inputs, setInputs] = useState<Inputs>({
    area: 0,
    C: 0,
    I: 0,
    L: 0,
    S: 0
  });
  const [result, setResult] = useState<{ Qp: number; params?: any } | null>(null);
  const [useManualC, setUseManualC] = useState(false);

  // SNI 2415:2016 Workflow Validation
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
            method={method === 'rational' ? 'RATIONAL' : method === 'haspers' ? 'HASPERS' : method === 'weduwen' ? 'WEDUWEN' : 'MELCHIOR'}
            onLoadRational={handleLoadPilot}
            onLoadModifiedRational={handleLoadModifiedPilot}
            onLoadNakayasu={() => {}}
          />
        </div>

        {/* Location Identity */}
        <LocationIdentity onLocationChange={setLocationData} />
        
        {/* SNI Compliance Warning */}
        {inputs.area > 0 && (
          <SNIWarning
            isCompliant={sniWorkflow.isValid}
            warnings={sniWorkflow.warnings}
            sniReference={sniWorkflow.compliance.sniReference}
          />
        )}
        
        {/* Method Selector */}
        <MethodSelector
          methods={methods}
          selected={method}
          onChange={(id) => setMethod(id as EmpiricalMethod)}
          title="Pilih Metode Empiris"
          columns={2}
        />
        
        {/* Formula Display */}
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
            <ResultCard
              title="Debit Puncak (Qp)"
              value={result.Qp}
              unit="m³/detik"
              icon={<TrendingUp className="w-5 h-5" />}
              gradient="from-blue-500 to-blue-600"
            />

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
            <p className="text-slate-600 text-sm">Masukkan parameter dan klik "Hitung Debit Puncak"</p>
          </div>
        )}
      </div>
    </div>
  );
};
