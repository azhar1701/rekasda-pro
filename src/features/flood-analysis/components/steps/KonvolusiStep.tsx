import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Waves, Save, TrendingUp } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface KonvolusiStepProps {
  hssOrdinates: number[];
  selectedHSS: string | null;
  onComplete: () => void;
  isCompleted: boolean;
}

export const KonvolusiStep: React.FC<KonvolusiStepProps> = ({
  hssOrdinates,
  selectedHSS,
  onComplete,
  isCompleted
}) => {
  const { setHasilBanjir, hujanEfektif } = useHydrologyStore();
  const [calculated, setCalculated] = useState(false);

  const isDataReady = hujanEfektif && hujanEfektif.length > 0 && hssOrdinates.length > 0;

  const { hydrograph, peakDischarge, timeToPeak } = useMemo(() => {
    if (!calculated || !hujanEfektif?.length || !hssOrdinates?.length) {
      return { hydrograph: [], peakDischarge: 0, timeToPeak: 0 };
    }

    const n = hujanEfektif.length;
    const m = hssOrdinates.length;
    const totalLength = n + m - 1;
    
    const Q: number[] = new Array(totalLength).fill(0);
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        Q[i + j] += hujanEfektif[i] * hssOrdinates[j];
      }
    }

    const validQ = Q.map(q => (isFinite(q) ? q : 0));

    const hydrograph = validQ.map((q, i) => ({
      time: Number((i * 0.5).toFixed(1)),
      inflow: Number(q.toFixed(2))
    }));

    const peak = Math.max(...validQ, 0);
    const peakIndex = validQ.indexOf(peak);
    const tPeak = peakIndex * 0.5;

    return {
      hydrograph,
      peakDischarge: Number(peak.toFixed(2)),
      timeToPeak: Number(tPeak.toFixed(1))
    };
  }, [calculated, hujanEfektif, hssOrdinates]);

  const handleCalculate = () => {
    setCalculated(true);
  };

  const handleSave = () => {
    setHasilBanjir({
      debitPuncak: peakDischarge,
      hidrograf: hydrograph,
      method: selectedHSS || 'unknown'
    });
    
    const { setHasilKonvolusi } = useHydrologyStore.getState();
    setHasilKonvolusi({
      floodHydrograph: hydrograph.map(h => ({ time: h.time, discharge: h.inflow })),
      peakDischarge,
      timeToPeak,
      totalVolume: hydrograph.reduce((sum, h) => sum + h.inflow, 0) * 0.5 * 3600,
      componentHydrographs: []
    });
    
    onComplete();
  };

  return (
    <div className="space-y-6">
      {/* Smart Empty State - Data Belum Tersedia */}
      {!isDataReady && (
        <Card className="p-6 bg-yellow-50 border-2 border-yellow-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Waves className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-900 mb-2">
                ⚠️ Data Hujan Efektif Belum Tersedia
              </h3>
              <p className="text-sm text-yellow-800 mb-4">
                Sistem membutuhkan distribusi hujan jam-jaman untuk melakukan konvolusi.
                Silakan hitung <strong>Distribusi Hujan</strong> di langkah sebelumnya.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => window.history.back()}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  👈 Kembali ke Distribusi Hujan
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Waves className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Konvolusi & Hidrograf Banjir</h3>
            <p className="text-xs text-slate-500">Superposisi Hujan Efektif × HSS {selectedHSS?.toUpperCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs font-semibold text-blue-700">Hujan Efektif</p>
            <p className="text-lg font-bold text-blue-900 tabular-nums tracking-tight">{hujanEfektif?.length || 0} ordinat</p>
            <p className="text-xs text-blue-600 mt-1 tabular-nums tracking-tight">
              Total: {(hujanEfektif?.reduce((a, b) => a + b, 0) || 0).toFixed(2)} mm
            </p>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-xs font-semibold text-green-700">HSS Ordinates</p>
            <p className="text-lg font-bold text-green-900 tabular-nums tracking-tight">{hssOrdinates.length} ordinat</p>
            <p className="text-xs text-green-600 mt-1">
              Metode: {selectedHSS?.toUpperCase()}
            </p>
          </div>
        </div>

        <button
          onClick={handleCalculate}
          disabled={!isDataReady}
          className="w-full px-4 py-3 bg-[#0c3a66] hover:bg-[#0d4578] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors flex items-center justify-center gap-2"
          title={!isDataReady ? 'Selesaikan Distribusi Hujan terlebih dahulu' : ''}
        >
          <TrendingUp className="w-5 h-5" />
          {!isDataReady ? 'Menunggu Data Hujan...' : 'Hitung Konvolusi'}
        </button>
      </Card>

      {calculated && hydrograph.length > 0 && (
        <>
          {/* Peak Discharge Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 bg-gradient-to-br from-[#0c3a66] to-[#0d4578] text-white rounded-md">
              <p className="text-sm font-semibold opacity-90 mb-1">Debit Puncak (Qp)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tabular-nums tracking-tight">{peakDischarge}</span>
                <span className="text-lg font-bold opacity-80">m³/s</span>
              </div>
              <p className="text-xs opacity-75 mt-2">Metode: {selectedHSS?.toUpperCase()}</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-slate-600 to-slate-700 text-white rounded-md">
              <p className="text-sm font-semibold opacity-90 mb-1">Waktu Puncak (Tp)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tabular-nums tracking-tight">{timeToPeak}</span>
                <span className="text-lg font-bold opacity-80">jam</span>
              </div>
              <p className="text-xs opacity-75 mt-2">Dari hidrograf konvolusi</p>
            </Card>
          </div>

          {/* Hydrograph Chart */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Hidrograf Banjir Rencana</h4>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={hydrograph}>
                <defs>
                  <linearGradient id="floodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  label={{ value: 'Waktu (jam)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  label={{ value: 'Debit (m³/s)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value} m³/s`, 'Debit']}
                  labelFormatter={(label) => `Jam ke-${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="inflow"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#floodGradient)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Save Button */}
          <Card className="p-6 bg-green-50 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-900">Analisis Banjir Selesai</p>
                <p className="text-xs text-green-700 mt-1">
                  Qp = {peakDischarge} m³/s pada t = {timeToPeak} jam
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={isCompleted}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                  isCompleted
                    ? 'bg-green-600 text-white cursor-default'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <Save className="w-5 h-5" />
                {isCompleted ? '✓ Tersimpan' : 'Simpan ke Global Store'}
              </button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
