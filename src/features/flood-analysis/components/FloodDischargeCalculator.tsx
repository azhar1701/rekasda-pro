import React, { useState, useEffect } from 'react';

import RunoffCoefficientInput from './RunoffCoefficientInput';
import AlphaParameterInput from './AlphaParameterInput';
import { FloodHydrographChart } from './FloodHydrographChart';
import { TcCalculator, IntensityCalculator, FrequencyAnalysisCalculator, EffectiveRainfallCalculator } from '@/features/channel-analysis/components/MiniCalculators';
import { saveFloodCalculation } from '@/services/calculationService';
import { calculateTg, calculateTp, calculateT03, calculateQp, generateHydrograph } from '@/lib/utils/calculations/nakayasu';
import { LocationIdentity } from '@/components/common/LocationIdentity';
import { PilotDataLoader } from '@/components/common/PilotDataLoader';
import { PilotDataRational, PilotDataNakayasu } from '@/data/floodPilotData';
import { SNILabel, ComplianceBadge } from '@/components/ui/data-display/ComplianceComponents';
import { Info, AlertTriangle } from 'lucide-react';
import { RETURN_PERIOD_GUIDANCE } from '@/constants/returnPeriodGuidance';

type MethodType = 'RATIONAL' | 'NAKAYASU';

interface LocationData {
  channelName: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  coordinates?: { lat: number; lng: number };
  photoUrl?: string;
}

interface RationalInputs {
  C: number;
  A: number;
  tc: number;
  I: number;
  R24?: number;
}

interface NakayasuInputs {
  A: number;
  L: number;
  Ro: number;
  Alpha: number;
  C?: number; // Koefisien limpasan untuk menghitung Ro
}

interface ReturnPeriod {
  period: string;
  rainfall: number;
  qPeak: number;
}

const TOOLTIPS = {
  A: 'Luas daerah tangkapan air hulu hingga titik tinjau (km²)',
  L: 'Panjang sungai utama dari hulu hingga outlet (km)',
  C: 'Rasio antara limpasan permukaan dengan curah hujan total (0-1)',
  tc: 'Waktu yang diperlukan air dari titik terjauh mencapai outlet (menit)',
  I: 'Intensitas curah hujan rata-rata selama waktu konsentrasi (mm/jam)',
  Ro: 'Tinggi hujan efektif (Ro = C × R) yang menjadi limpasan permukaan (mm)',
  Alpha: 'Koefisien karakteristik DAS, tergantung kondisi topografi (1.5-3.0)'
};

interface Props {
  onConsultAI?: () => void;
}

export const FloodDischargeCalculator: React.FC<Props> = ({ onConsultAI }) => {
  const [method, setMethod] = useState<MethodType>('RATIONAL');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [rationalInputs, setRationalInputs] = useState<RationalInputs>({
    C: 0.7,
    A: 0.5,
    tc: 30,
    I: 100,
    R24: 100
  });
  const [nakayasuInputs, setNakayasuInputs] = useState<NakayasuInputs>({
    A: 50,
    L: 15,
    Ro: 10,  // Hujan satuan 10 mm (bukan 100 mm)
    Alpha: 2,
    C: 0.7,  // Koefisien limpasan default
  });
  const [returnPeriods, setReturnPeriods] = useState<ReturnPeriod[]>([
    { period: 'Q2', rainfall: 80, qPeak: 0 },
    { period: 'Q5', rainfall: 100, qPeak: 0 },
    { period: 'Q10', rainfall: 120, qPeak: 0 },
    { period: 'Q25', rainfall: 140, qPeak: 0 },
    { period: 'Q50', rainfall: 160, qPeak: 0 },
    { period: 'Q100', rainfall: 180, qPeak: 0 }
  ]);
  const [hydrographData, setHydrographData] = useState<any[]>([]);
  const [qPeak, setQPeak] = useState<number>(0);
  const [tPeak, setTPeak] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);
  const [showTcCalc, setShowTcCalc] = useState(false);
  const [showIntensityCalc, setShowIntensityCalc] = useState(false);
  const [showFreqAnalysis, setShowFreqAnalysis] = useState(false);
  const [showEffRainCalc, setShowEffRainCalc] = useState(false);
  const [rainfallDataSource, setRainfallDataSource] = useState<'manual' | 'frequency'>('manual');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(35);
  const [isResizing, setIsResizing] = useState(false);

  const calculateRationalDischarge = (C: number, I: number, A: number): number => {
    // Menggunakan formula SNI 2415:2016
    return 0.278 * C * I * A;
  };

  useEffect(() => {
    const saved = localStorage.getItem('flood-sidebar-width');
    if (saved) setSidebarWidth(parseFloat(saved));
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = (e.clientX / window.innerWidth) * 100;
      const clampedWidth = Math.min(Math.max(newWidth, 25), 50);
      setSidebarWidth(clampedWidth);
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem('flood-sidebar-width', sidebarWidth.toString());
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, sidebarWidth]);

  const generateRationalHydrograph = (Q: number, tc: number) => {
    const data = [];
    const totalTime = tc * 3;
    const timeStep = totalTime / 20;
    
    for (let t = 0; t <= totalTime; t += timeStep) {
      let discharge = 0;
      if (t <= tc) {
        discharge = Q * (t / tc);
      } else if (t <= tc * 2) {
        discharge = Q * (2 - t / tc);
      }
      data.push({ time: parseFloat(t.toFixed(1)), discharge: parseFloat(discharge.toFixed(2)) });
    }
    return data;
  };

  const generateNakayasuHydrograph = (Qp: number, Tp: number, Tg: number, Alpha: number) => {
    const T03 = Alpha * Tg;
    return generateHydrograph(Qp, Tp, T03, 0.1);
  };

  useEffect(() => {
    if (method === 'RATIONAL') {
      const Q = calculateRationalDischarge(rationalInputs.C, rationalInputs.I, rationalInputs.A);
      const tcHours = rationalInputs.tc / 60;
      const vol = Q * tcHours * 3600;
      setQPeak(Q);
      setTPeak(tcHours);
      setVolume(vol);
      setHydrographData(generateRationalHydrograph(Q, rationalInputs.tc));
    } else {
      // HSS Nakayasu - SNI 2415:2016 Pasal 6.3
      const Tg = calculateTg(nakayasuInputs.L);
      const Tp = calculateTp(Tg);
      const T03 = calculateT03(nakayasuInputs.Alpha, Tg);
      const Q = calculateQp(nakayasuInputs.A, nakayasuInputs.Ro, Tp, T03);
      const vol = Q * Tp * 3600;
      setQPeak(Q);
      setTPeak(Tp);
      setVolume(vol);
      setHydrographData(generateNakayasuHydrograph(Q, Tp, Tg, nakayasuInputs.Alpha));
    }
  }, [method, rationalInputs, nakayasuInputs]);

  useEffect(() => {
    if (method === 'RATIONAL') {
      const updated = returnPeriods.map(rp => {
        const tcHours = rationalInputs.tc / 60;
        const I = (rp.rainfall / 24) * Math.pow(24 / tcHours, 2/3);
        return {
          ...rp,
          qPeak: calculateRationalDischarge(rationalInputs.C, I, rationalInputs.A)
        };
      });
      setReturnPeriods(updated);
    } else {
      // HSS Nakayasu untuk berbagai kala ulang
      const Tg = calculateTg(nakayasuInputs.L);
      const Tp = calculateTp(Tg);
      const T03 = calculateT03(nakayasuInputs.Alpha, Tg);
      const updated = returnPeriods.map(rp => ({
        ...rp,
        qPeak: calculateQp(nakayasuInputs.A, rp.rainfall, Tp, T03)
      }));
      setReturnPeriods(updated);
    }
  }, [returnPeriods.map(r => r.rainfall).join(',')]);

  const handleSaveToDB = async () => {
    const projectName = locationData?.channelName;
    if (!projectName) {
      setSaveMessage({ type: 'error', text: 'Mohon isi Nama Saluran di Identitas Lokasi terlebih dahulu' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    try {
      const inputs = method === 'RATIONAL' ? { ...rationalInputs, location: locationData } : { ...nakayasuInputs, location: locationData };
      const results = { qPeak, tPeak, volume, returnPeriods, hydrographData };

      const { error } = await saveFloodCalculation({ method, projectName, inputs, results });

      if (error) {
        setSaveMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message });
      } else {
        setSaveMessage({ type: 'success', text: '✓ Berhasil menyimpan perhitungan!' });
      }
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui';
      setSaveMessage({ type: 'error', text: 'Error: ' + errorMessage });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadRationalPilot = (data: PilotDataRational) => {
    setRationalInputs(data.inputs);
    setLocationData(data.location);
    const updated = returnPeriods.map((rp, idx) => ({
      ...rp,
      rainfall: data.returnPeriods[idx]?.rainfall || rp.rainfall
    }));
    setReturnPeriods(updated);
    setLoadMessage(`✓ Data pilot "${data.name}" berhasil dimuat`);
    setTimeout(() => setLoadMessage(null), 3000);
  };

  const handleLoadNakayasuPilot = (data: PilotDataNakayasu) => {
    setNakayasuInputs(data.inputs);
    setLocationData(data.location);
    const updated = returnPeriods.map((rp, idx) => ({
      ...rp,
      rainfall: data.returnPeriods[idx]?.rainfall || rp.rainfall
    }));
    setReturnPeriods(updated);
    setLoadMessage(`✓ Data pilot "${data.name}" berhasil dimuat`);
    setTimeout(() => setLoadMessage(null), 3000);
  };

  const TooltipIcon = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-1">
      <svg className="w-4 h-4 text-slate-400 hover:text-emerald-600 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-64 z-50">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-5">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="mb-2 md:mb-3">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Analisis Banjir & Hidrologi</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">Perhitungan debit puncak • Metode Rasional & Nakayasu</p>
        </div>

      {/* Messages Toast */}
      {loadMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-2xl shadow-lg border border-slate-200 bg-purple-50 text-purple-800 flex items-center gap-3 animate-fade-in max-w-md">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          <span className="font-medium text-sm">{loadMessage}</span>
        </div>
      )}
      {saveMessage && (
        <div className={`fixed top-24 right-6 z-[110] px-6 py-3 rounded-2xl shadow-lg border flex items-center gap-3 animate-fade-in max-w-md ${
          saveMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {saveMessage.type === 'success' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            )}
          </svg>
          <span className="font-medium text-sm">{saveMessage.text}</span>
        </div>
      )}

        <div className="flex flex-col lg:flex-row gap-6 relative z-0">
          
          {/* LEFT SIDEBAR */}
          <div className="w-full lg:w-auto" style={{ width: window.innerWidth >= 1024 ? `${sidebarWidth}%` : '100%', position: 'relative' }}>
            <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-100px)] lg:overflow-y-auto lg:pr-2 space-y-3 md:space-y-4">
              {/* Pilot Data Loader */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Data Pilot</h2>
                <PilotDataLoader
                method={method}
                onLoadRational={handleLoadRationalPilot}
                onLoadNakayasu={handleLoadNakayasuPilot}
              />
              </div>

              {/* Location Identity */}
              <LocationIdentity onLocationChange={setLocationData} />

              {/* Method Selector */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Metode Perhitungan</h2>
                  <ComplianceBadge sniCode="SNI 2415:2016" />
                </div>
                <div className="flex gap-2 p-2 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setMethod('RATIONAL')}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    method === 'RATIONAL' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Rasional
                </button>
                <button
                  onClick={() => setMethod('NAKAYASU')}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    method === 'NAKAYASU' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Nakayasu
                </button>
                </div>
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <p className="font-semibold mb-1">Panduan Pemilihan Metode:</p>
                    <p>• <strong>Rasional:</strong> DAS &lt; 5000 Ha (Pasal 3.1)</p>
                    <p>• <strong>HSS Nakayasu:</strong> DAS &gt; 5000 Ha atau data hujan jam-jaman tersedia</p>
                  </div>
                </div>
              </div>

            {/* Input Sections */}
            {method === 'RATIONAL' ? (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Geometri DAS</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                          Luas DAS (A)
                          <TooltipIcon text={TOOLTIPS.A} />
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={rationalInputs.A}
                            onChange={e => setRationalInputs({...rationalInputs, A: parseFloat(e.target.value) || 0})}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg p-3 pr-16 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">km²</span>
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                          Waktu Konsentrasi (tc)
                          <TooltipIcon text={TOOLTIPS.tc} />
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              value={rationalInputs.tc}
                              onChange={e => setRationalInputs({...rationalInputs, tc: parseFloat(e.target.value) || 0})}
                              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg p-3 pr-16 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">menit</span>
                          </div>
                          <button
                            onClick={() => setShowTcCalc(!showTcCalc)}
                            className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 text-xs font-bold whitespace-nowrap"
                          >
                            Hitung tc
                          </button>
                        </div>
                        {showTcCalc && (
                          <TcCalculator
                            onApply={(tc) => setRationalInputs({...rationalInputs, tc})}
                            onClose={() => setShowTcCalc(false)}
                          />
                        )}
                      </div>
                    </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Data Curah Hujan</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-2">Sumber Data</label>
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                      <button
                        onClick={() => setRainfallDataSource('manual')}
                        className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                          rainfallDataSource === 'manual' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
                        }`}
                      >
                        Input Manual
                      </button>
                      <button
                        onClick={() => setRainfallDataSource('frequency')}
                        className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                          rainfallDataSource === 'frequency' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
                        }`}
                      >
                        Analisis Frekuensi
                      </button>
                    </div>
                  </div>
                  
                  {rainfallDataSource === 'manual' ? (
                    <div>
                      <label className="flex items-center text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Curah Hujan Harian (R₂₄)
                        <TooltipIcon text="Curah hujan maksimum harian untuk kala ulang tertentu" />
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={rationalInputs.R24 || 100}
                          onChange={e => {
                            const R24 = parseFloat(e.target.value) || 0;
                            const tcHours = rationalInputs.tc / 60;
                            const I = (R24 / 24) * Math.pow(24 / tcHours, 2/3);
                            setRationalInputs({...rationalInputs, R24, I});
                          }}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg p-3 pr-16 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">mm</span>
                      </div>
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                          <span className="font-semibold">Auto-calculate:</span> I = {rationalInputs.I.toFixed(2)} mm/jam (Mononobe)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-lg">
                      <p className="text-xs text-slate-700 mb-3">Gunakan analisis frekuensi untuk menghitung hujan rencana berbagai kala ulang</p>
                      <button
                        onClick={() => setShowFreqAnalysis(true)}
                        className="w-full px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-xs font-bold flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Buka Analisis Frekuensi
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Parameter Hidrologi</h2>
                    <div className="space-y-4">
                      <div>
                        <div className="mb-2">
                          <SNILabel
                            label="Koefisien Pengaliran (C)"
                            tooltip="Koefisien pengaliran berdasarkan karakteristik tata guna lahan DAS"
                            sniCode="SNI 2415:2016 (Lampiran A) & Permen PU 12/2014"
                          />
                        </div>
                        <RunoffCoefficientInput
                          value={rationalInputs.C}
                          onChange={(v) => setRationalInputs({ ...rationalInputs, C: v || 0 })}
                          required={true}
                        />
                      </div>
                      <div>
                        <SNILabel
                          label="Intensitas Hujan (I)"
                          tooltip="Intensitas hujan dihitung otomatis dari R₂₄ menggunakan rumus Mononobe"
                          sniCode="SNI 2415:2016 Pasal 4"
                        />
                        <div className="relative">
                          <input
                            type="number"
                            value={rationalInputs.I}
                            readOnly
                            className="w-full bg-slate-100 border border-slate-300 text-slate-700 text-sm font-bold rounded-lg p-3 pr-20 outline-none cursor-not-allowed"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">mm/jam</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Dihitung otomatis: I = (R₂₄/24) × (24/tc)^(2/3)</p>
                      </div>
                    </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Geometri DAS</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                          Luas DAS (A)
                          <TooltipIcon text={TOOLTIPS.A} />
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={nakayasuInputs.A}
                            onChange={e => setNakayasuInputs({...nakayasuInputs, A: parseFloat(e.target.value) || 0})}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg p-3 pr-16 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">km²</span>
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                          Panjang Sungai (L)
                          <TooltipIcon text={TOOLTIPS.L} />
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={nakayasuInputs.L}
                            onChange={e => setNakayasuInputs({...nakayasuInputs, L: parseFloat(e.target.value) || 0})}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg p-3 pr-16 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">km</span>
                        </div>
                      </div>
                    </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Data Curah Hujan</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-2">Sumber Data</label>
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                      <button
                        onClick={() => setRainfallDataSource('manual')}
                        className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                          rainfallDataSource === 'manual' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
                        }`}
                      >
                        Input Manual
                      </button>
                      <button
                        onClick={() => setRainfallDataSource('frequency')}
                        className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                          rainfallDataSource === 'frequency' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
                        }`}
                      >
                        Analisis Frekuensi
                      </button>
                    </div>
                  </div>
                  
                  {rainfallDataSource === 'manual' ? (
                    <div>
                      <label className="flex items-center text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Curah Hujan Rencana (R)
                        <TooltipIcon text="Curah hujan untuk kala ulang tertentu yang akan dikonversi menjadi hujan efektif" />
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={nakayasuInputs.Ro / (nakayasuInputs.C || 0.7)}
                          onChange={e => {
                            const R = parseFloat(e.target.value) || 0;
                            const Ro = R * (nakayasuInputs.C || 0.7);
                            setNakayasuInputs({...nakayasuInputs, Ro});
                          }}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg p-3 pr-16 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">mm</span>
                      </div>
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                          <span className="font-semibold">Auto-calculate:</span> Ro = {nakayasuInputs.Ro.toFixed(2)} mm (C × R)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-lg">
                      <p className="text-xs text-slate-700 mb-3">Gunakan analisis frekuensi untuk menghitung hujan rencana berbagai kala ulang</p>
                      <button
                        onClick={() => setShowFreqAnalysis(true)}
                        className="w-full px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-xs font-bold flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Buka Analisis Frekuensi
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Parameter Hidrologi</h2>
                    <div className="space-y-4">
                      <div>
                        <SNILabel
                          label="Koefisien Limpasan (C)"
                          tooltip="Koefisien untuk mengubah curah hujan total menjadi hujan efektif (Ro = C × R). Nilai tergantung tata guna lahan."
                          sniCode="Permen PU 12/2014"
                        />
                        <RunoffCoefficientInput
                          value={nakayasuInputs.C || 0.7}
                          onChange={(v) => {
                            const R = nakayasuInputs.Ro / (nakayasuInputs.C || 0.7);
                            const newRo = R * (v || 0.7);
                            setNakayasuInputs({...nakayasuInputs, C: v || 0.7, Ro: newRo});
                          }}
                          required={true}
                        />
                      </div>
                      <div>
                        <label className="flex items-center text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                          Hujan Efektif (Ro)
                          <TooltipIcon text={TOOLTIPS.Ro} />
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={nakayasuInputs.Ro}
                            readOnly
                            className="w-full bg-slate-100 border border-slate-300 text-slate-700 text-sm font-bold rounded-lg p-3 pr-16 outline-none cursor-not-allowed"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">mm</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Dihitung otomatis: Ro = C × R</p>
                      </div>
                      <div>
                        <SNILabel
                          label="Koefisien Alpha (α)"
                          tooltip="Parameter karakteristik DAS yang mempengaruhi bentuk hidrograf. Kisaran normal 1.5 - 3.0 tergantung kondisi topografi dan tata guna lahan"
                          sniCode="SNI 2415:2016"
                        />
                        <AlphaParameterInput
                          value={nakayasuInputs.Alpha}
                          onChange={(v) => setNakayasuInputs({ ...nakayasuInputs, Alpha: v || 2.0 })}
                          required={true}
                        />
                      </div>
                    </div>
              </div>
            </>
          )}
            </div>
          </div>
          <div
            onMouseDown={() => setIsResizing(true)}
            className={`hidden lg:block w-1 cursor-col-resize hover:bg-teal-500 transition-colors flex-shrink-0 relative ${isResizing ? 'bg-teal-500' : 'bg-transparent'}`}
            style={{ userSelect: 'none' }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-20 bg-slate-300 rounded-full hover:bg-teal-500 transition-colors"></div>
          </div>

          {/* MAIN CONTENT */}
          <div className="w-full lg:w-auto space-y-3 md:space-y-4" style={{ width: window.innerWidth >= 1024 ? `${100 - sidebarWidth}%` : '100%' }}>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-3 relative z-0">
                {method === 'RATIONAL' ? (
                  <>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 group relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                          Koefisien Limpasan
                          <svg className="w-3 h-3 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                            Rasio antara limpasan permukaan dengan curah hujan total
                          </div>
                        </span>
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-emerald-600 font-mono">{rationalInputs.C.toFixed(2)}</div>
                      <div className="text-xs text-slate-500 font-medium mt-1">Koefisien C</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 group relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                          Intensitas Hujan
                          <svg className="w-3 h-3 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                            Intensitas curah hujan rata-rata selama waktu konsentrasi
                          </div>
                        </span>
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-blue-600 font-mono">{rationalInputs.I.toFixed(1)}</div>
                      <div className="text-xs text-slate-500 font-medium mt-1">mm/jam</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 group relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                          Luas DAS
                          <svg className="w-3 h-3 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                            Luas daerah tangkapan air hulu hingga titik tinjau
                          </div>
                        </span>
                        <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-teal-600 font-mono">{rationalInputs.A.toFixed(2)}</div>
                      <div className="text-xs text-slate-500 font-medium mt-1">km²</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 group relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                          Waktu Konsentrasi
                          <svg className="w-3 h-3 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                            Waktu yang diperlukan air dari titik terjauh mencapai outlet
                          </div>
                        </span>
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-slate-600 font-mono">{rationalInputs.tc.toFixed(0)}</div>
                      <div className="text-xs text-slate-500 font-medium mt-1">menit</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 group relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                          Luas DAS
                          <svg className="w-3 h-3 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                            Luas daerah tangkapan air hulu hingga titik tinjau
                          </div>
                        </span>
                        <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-teal-600 font-mono">{nakayasuInputs.A.toFixed(1)}</div>
                      <div className="text-xs text-slate-500 font-medium mt-1">km²</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 group relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                          Panjang Sungai
                          <svg className="w-3 h-3 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                            Panjang sungai utama dari hulu hingga outlet
                          </div>
                        </span>
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-blue-600 font-mono">{nakayasuInputs.L.toFixed(1)}</div>
                      <div className="text-xs text-slate-500 font-medium mt-1">km</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 group relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                          Hujan Efektif
                          <svg className="w-3 h-3 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                            Tinggi hujan efektif yang menjadi limpasan permukaan
                          </div>
                        </span>
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-purple-600 font-mono">{nakayasuInputs.Ro.toFixed(1)}</div>
                      <div className="text-xs text-slate-500 font-medium mt-1">mm</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 group relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                          Koefisien Alpha
                          <svg className="w-3 h-3 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                            Koefisien karakteristik DAS, tergantung kondisi topografi
                          </div>
                        </span>
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-slate-600 font-mono">{nakayasuInputs.Alpha.toFixed(1)}</div>
                      <div className="text-xs text-slate-500 font-medium mt-1">α</div>
                    </div>
                  </>
                )}
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Hidrograf Banjir Rencana</h2>
                  <p className="text-xs text-slate-500 mt-1">Debit Puncak: <span className="font-bold text-teal-600">{qPeak.toFixed(2)} m³/s</span></p>
                </div>
                <ComplianceBadge sniCode="SNI 2415:2016" />
              </div>
              {qPeak > 500 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <p className="font-semibold">Peringatan: Debit sangat tinggi ({qPeak.toFixed(0)} m³/s)</p>
                    <p className="mt-1">Pastikan satuan input sudah benar:</p>
                    <ul className="list-disc ml-4 mt-1">
                      <li>Luas DAS (A) dalam km²</li>
                      <li>Hujan satuan (Ro) dalam mm (biasanya 10-20 mm, bukan 100 mm)</li>
                      <li>Panjang sungai (L) dalam km</li>
                    </ul>
                  </div>
                </div>
              )}
              <FloodHydrographChart
                    data={hydrographData}
                    qPeak={qPeak}
                    tPeak={tPeak}
                    volume={volume}
                    title="Hidrograf Banjir Rencana"
                    primaryColor="#0d9488"
                    height={window.innerWidth < 768 ? 250 : 350}
              />
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-600">
                  <span className="font-semibold">Catatan:</span> Perhitungan debit banjir rencana ini mengacu pada tata cara <span className="font-semibold text-teal-600">SNI 2415:2016</span>. Pastikan parameter hujan rencana telah melalui analisis frekuensi (Log Pearson III/Gumbel) sesuai standar.
                </p>
              </div>
            </div>

            {/* Return Period Analysis */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Analisis Kala Ulang</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-slate-600">Hasil perhitungan debit untuk berbagai kala ulang</p>
                      {rainfallDataSource === 'manual' && (
                        <button
                          onClick={() => setShowFreqAnalysis(true)}
                          className="px-3 py-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors border border-teal-200 text-xs font-bold"
                        >
                          Analisis Frekuensi
                        </button>
                      )}
                    </div>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="text-left py-2.5 px-3 font-bold text-slate-700 text-xs uppercase">Kala Ulang</th>
                            <th className="text-right py-2.5 px-3 font-bold text-slate-700 text-xs uppercase">Hujan (mm)</th>
                            <th className="text-right py-2.5 px-3 font-bold text-slate-700 text-xs uppercase">Qpeak (m³/s)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {returnPeriods.map((rp, idx) => {
                            const guidance = RETURN_PERIOD_GUIDANCE[rp.period];
                            return (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">{rp.period}</div>
                                <div className={`text-[10px] ${guidance?.color || 'text-slate-500'} font-medium mt-0.5`}>{guidance?.infrastructure}</div>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <input
                                  type="number"
                                  value={rp.rainfall}
                                  onChange={e => {
                                    const updated = [...returnPeriods];
                                    updated[idx].rainfall = parseFloat(e.target.value) || 0;
                                    setReturnPeriods(updated);
                                  }}
                                  className="w-20 text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-bold focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-teal-600">{rp.qPeak.toFixed(2)}</td>
                            </tr>
                          );})}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {returnPeriods.map((rp, idx) => {
                        const guidance = RETURN_PERIOD_GUIDANCE[rp.period];
                        return (
                        <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="text-base font-bold text-slate-900">{rp.period}</span>
                              <div className={`text-xs ${guidance?.color || 'text-slate-500'} font-medium mt-0.5`}>{guidance?.infrastructure}</div>
                            </div>
                            <span className="text-lg font-bold text-teal-600">{rp.qPeak.toFixed(2)} m³/s</span>
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 font-medium mb-1 block">Hujan (mm)</label>
                            <input
                              type="number"
                              value={rp.rainfall}
                              onChange={e => {
                                const updated = [...returnPeriods];
                                updated[idx].rainfall = parseFloat(e.target.value) || 0;
                                setReturnPeriods(updated);
                              }}
                              className="w-full text-base bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none"
                            />
                          </div>
                        </div>
                      );})}
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 pt-2">
                      <button
                        onClick={handleSaveToDB}
                        disabled={isSaving}
                        className="flex-1 min-h-[44px] px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        {isSaving ? 'Menyimpan...' : 'Simpan Hasil'}
                      </button>
                      {onConsultAI && (
                        <button
                          onClick={onConsultAI}
                          className="w-full md:w-auto min-h-[44px] px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 active:bg-slate-900 transition-colors font-bold text-sm flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Analisis AI
                        </button>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-600">
                          Perhitungan ini mengacu pada standar <span className="font-semibold text-slate-700">SNI 2415:2016</span> tentang Tata Cara Perhitungan Debit Banjir Rencana. Pastikan parameter hujan rencana telah melalui analisis frekuensi (Log Pearson III/Gumbel) sesuai standar.
                        </p>
                      </div>
                    </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Frequency Analysis Modal */}
      {showFreqAnalysis && (
        <FrequencyAnalysisCalculator
          onApply={(rainfalls) => {
            const updated = returnPeriods.map((rp, idx) => ({
              ...rp,
              rainfall: parseFloat(rainfalls[idx].toFixed(1))
            }));
            setReturnPeriods(updated);
          }}
          onClose={() => setShowFreqAnalysis(false)}
        />
      )}
    </div>
  );
};
