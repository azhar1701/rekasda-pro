import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from './ui/Card';
import { TcCalculator, IntensityCalculator, FrequencyAnalysisCalculator, EffectiveRainfallCalculator } from './MiniCalculators';
import { saveFloodCalculation } from '../services/calculationService';
import { LocationIdentity } from './LocationIdentity';

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
}

interface NakayasuInputs {
  A: number;
  L: number;
  Ro: number;
  Alpha: number;
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
  Ro: 'Tinggi hujan efektif yang menjadi limpasan permukaan (mm)',
  Alpha: 'Koefisien karakteristik DAS, tergantung kondisi topografi (1.5-3.0)'
};

export const FloodDischargeCalculator: React.FC = () => {
  const [method, setMethod] = useState<MethodType>('RATIONAL');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [rationalInputs, setRationalInputs] = useState<RationalInputs>({
    C: 0.7,
    A: 0.5,
    tc: 30,
    I: 100
  });
  const [nakayasuInputs, setNakayasuInputs] = useState<NakayasuInputs>({
    A: 50,
    L: 15,
    Ro: 100,
    Alpha: 2
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const calculateRationalDischarge = (C: number, I: number, A: number): number => {
    return 0.278 * C * I * A;
  };

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

  const calculateNakayasuDischarge = (A: number, Ro: number, Tp: number): number => {
    return 0.278 * (A * Ro) / (3.6 * Tp);
  };

  const generateNakayasuHydrograph = (Qp: number, Tp: number, T03: number) => {
    const data = [];
    const totalTime = Tp + 3 * T03;
    const timeStep = totalTime / 50;

    for (let t = 0; t <= totalTime; t += timeStep) {
      let Q = 0;
      if (t < Tp) {
        Q = Qp * Math.pow(t / Tp, 2.4);
      } else if (t < Tp + T03) {
        Q = Qp * Math.pow(0.3, (t - Tp) / T03);
      } else if (t < Tp + T03 + 1.5 * T03) {
        Q = Qp * Math.pow(0.3, 1 + (t - Tp - T03) / (1.5 * T03));
      } else {
        Q = Qp * Math.pow(0.3, 2.5 + (t - Tp - 2.5 * T03) / (2 * T03));
      }
      data.push({ time: parseFloat(t.toFixed(1)), discharge: parseFloat(Q.toFixed(2)) });
    }
    return data;
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
      const Tg = 0.21 * Math.pow(nakayasuInputs.L, 0.7);
      const Tp = Tg + 0.8 * nakayasuInputs.Alpha;
      const T03 = nakayasuInputs.Alpha * Tg;
      const Q = calculateNakayasuDischarge(nakayasuInputs.A, nakayasuInputs.Ro, Tp);
      const vol = Q * Tp * 3600;
      setQPeak(Q);
      setTPeak(Tp);
      setVolume(vol);
      setHydrographData(generateNakayasuHydrograph(Q, Tp, T03));
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
      const Tg = 0.21 * Math.pow(nakayasuInputs.L, 0.7);
      const Tp = Tg + 0.8 * nakayasuInputs.Alpha;
      const updated = returnPeriods.map(rp => ({
        ...rp,
        qPeak: calculateNakayasuDischarge(nakayasuInputs.A, rp.rainfall, Tp)
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
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 pb-20 items-start">
      {/* LEFT SIDEBAR - 30% */}
      <div className="lg:col-span-3 space-y-6">
        <div className="lg:sticky lg:top-24 space-y-6">
          {/* Location Identity */}
          <LocationIdentity onLocationChange={setLocationData} />

          {/* Method Selector */}
          <Card>
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setMethod('RATIONAL')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all ${
                  method === 'RATIONAL' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Metode Rasional
              </button>
              <button
                onClick={() => setMethod('NAKAYASU')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all ${
                  method === 'NAKAYASU' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                HSS Nakayasu
              </button>
            </div>
          </Card>

          {method === 'RATIONAL' ? (
            <>
              <Card title="Geometri DAS" className="bg-white">
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
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg p-4 pr-16 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">km²</span>
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
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg p-4 pr-16 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">menit</span>
                      </div>
                      <button
                        onClick={() => setShowTcCalc(!showTcCalc)}
                        className="px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 text-xs font-bold"
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
              </Card>

              <Card title="Parameter Hidrologi" className="bg-white">
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Koefisien Limpasan (C)
                      <TooltipIcon text={TOOLTIPS.C} />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={rationalInputs.C}
                        onChange={e => setRationalInputs({...rationalInputs, C: parseFloat(e.target.value) || 0})}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg p-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Intensitas Hujan (I)
                      <TooltipIcon text={TOOLTIPS.I} />
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={rationalInputs.I}
                          onChange={e => setRationalInputs({...rationalInputs, I: parseFloat(e.target.value) || 0})}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg p-4 pr-20 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">mm/jam</span>
                      </div>
                      <button
                        onClick={() => setShowIntensityCalc(!showIntensityCalc)}
                        className="px-4 py-3 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200 text-xs font-bold"
                      >
                        Hitung I
                      </button>
                    </div>
                    {showIntensityCalc && (
                      <IntensityCalculator
                        tc={rationalInputs.tc}
                        onApply={(I) => setRationalInputs({...rationalInputs, I})}
                        onClose={() => setShowIntensityCalc(false)}
                      />
                    )}
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <>
              <Card title="Geometri DAS" className="bg-white">
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
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg p-4 pr-16 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">km²</span>
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
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg p-4 pr-16 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">km</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Parameter Hidrologi" className="bg-white">
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Hujan Satuan (Ro)
                      <TooltipIcon text={TOOLTIPS.Ro} />
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={nakayasuInputs.Ro}
                          onChange={e => setNakayasuInputs({...nakayasuInputs, Ro: parseFloat(e.target.value) || 0})}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg p-4 pr-16 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">mm</span>
                      </div>
                      <button
                        onClick={() => setShowEffRainCalc(!showEffRainCalc)}
                        className="px-4 py-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200 text-xs font-bold"
                      >
                        Hitung Ro
                      </button>
                    </div>
                    {showEffRainCalc && (
                      <EffectiveRainfallCalculator
                        onApply={(Ro) => setNakayasuInputs({...nakayasuInputs, Ro})}
                        onClose={() => setShowEffRainCalc(false)}
                      />
                    )}
                  </div>
                  <div>
                    <label className="flex items-center text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Koefisien Alpha (α)
                      <TooltipIcon text={TOOLTIPS.Alpha} />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={nakayasuInputs.Alpha}
                        onChange={e => setNakayasuInputs({...nakayasuInputs, Alpha: parseFloat(e.target.value) || 0})}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg p-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - 70% */}
      <div className="lg:col-span-7 space-y-6">
        {/* Save Message Toast */}
        {saveMessage && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-lg shadow-lg border-2 flex items-center gap-3 animate-fade-in ${
            saveMessage.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-red-50 border-red-500 text-red-800'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {saveMessage.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              )}
            </svg>
            <span className="font-semibold">{saveMessage.text}</span>
          </div>
        )}
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="text-xs font-bold uppercase tracking-wider opacity-90 mb-2">Debit Puncak</div>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-black">{qPeak.toFixed(2)}</div>
              <div className="text-sm font-bold opacity-80">m³/s</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="text-xs font-bold uppercase tracking-wider opacity-90 mb-2">Waktu Puncak</div>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-black">{tPeak.toFixed(2)}</div>
              <div className="text-sm font-bold opacity-80">jam</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="text-xs font-bold uppercase tracking-wider opacity-90 mb-2">Volume Banjir</div>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-black">{(volume / 1000).toFixed(1)}</div>
              <div className="text-sm font-bold opacity-80">×10³ m³</div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <Card title="Hidrograf Banjir Rencana" className="bg-white">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={hydrographData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" label={{ value: 'Waktu (jam)', position: 'insideBottom', offset: -5 }} stroke="#64748b" style={{ fontSize: '12px', fontWeight: 600 }} />
              <YAxis label={{ value: 'Debit (m³/s)', angle: -90, position: 'insideLeft' }} stroke="#64748b" style={{ fontSize: '12px', fontWeight: 600 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }} />
              <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
              <Line type="monotone" dataKey="discharge" stroke="#10b981" strokeWidth={3} name="Debit" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Return Period Table */}
        <Card title="Analisis Kala Ulang" className="bg-white">
          <div className="flex justify-between items-center mb-4">
            <div className="text-xs text-slate-500">Edit nilai hujan rencana atau gunakan analisis frekuensi</div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFreqAnalysis(true)}
                className="px-4 py-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors border border-teal-200 text-xs font-bold"
              >
                Analisis Frekuensi
              </button>
              <button
                onClick={handleSaveToDB}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                {isSaving ? 'Menyimpan...' : 'Simpan Hasil'}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-4 font-bold text-slate-600 text-xs uppercase">Kala Ulang</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600 text-xs uppercase">Hujan Rencana (mm)</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600 text-xs uppercase">Qpeak (m³/s)</th>
                </tr>
              </thead>
              <tbody>
                {returnPeriods.map((rp, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{rp.period}</td>
                    <td className="py-3 px-4 text-right">
                      <input
                        type="number"
                        value={rp.rainfall}
                        onChange={e => {
                          const updated = [...returnPeriods];
                          updated[idx].rainfall = parseFloat(e.target.value) || 0;
                          setReturnPeriods(updated);
                        }}
                        className="w-24 text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-bold focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                      />
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">{rp.qPeak.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
