import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Waves, Save, TrendingUp } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface KonvolusiStepProps {
  hujanEfektif: number[];
  hssOrdinates: number[];
  selectedHSS: string | null;
  durasiHujan: number;
  onComplete: (hydrograph: { time: number; discharge: number }[], peak: number) => void;
  isCompleted: boolean;
}

export const KonvolusiStep: React.FC<KonvolusiStepProps> = ({
  hujanEfektif,
  hssOrdinates,
  selectedHSS,
  durasiHujan,
  onComplete,
  isCompleted
}) => {
  const { setHasilBanjir } = useHydrologyStore();
  const [calculated, setCalculated] = useState(false);

  const { hydrograph, peakDischarge, timeToPeak } = useMemo(() => {
    if (!calculated || hujanEfektif.length === 0 || hssOrdinates.length === 0) {
      return { hydrograph: [], peakDischarge: 0, timeToPeak: 0 };
    }

    // Convolution: Q(t) = Σ [Pe(i) × U(t-i)]
    const n = hujanEfektif.length;
    const m = hssOrdinates.length;
    const totalLength = n + m - 1;
    
    const Q: number[] = new Array(totalLength).fill(0);
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        Q[i + j] += hujanEfektif[i] * hssOrdinates[j];
      }
    }

    const hydrograph = Q.map((q, i) => ({
      time: Number((i * 0.5).toFixed(1)),
      discharge: Number(q.toFixed(2))
    }));

    const peak = Math.max(...Q);
    const peakIndex = Q.indexOf(peak);
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
    onComplete(hydrograph, peakDischarge);
  };

  return (
    <div className="space-y-6">
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
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 font-medium">Hujan Efektif</p>
            <p className="text-lg font-bold text-blue-900">{hujanEfektif.length} ordinat</p>
            <p className="text-xs text-blue-600 mt-1">
              Total: {hujanEfektif.reduce((a, b) => a + b, 0).toFixed(2)} mm
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-700 font-medium">HSS Ordinates</p>
            <p className="text-lg font-bold text-green-900">{hssOrdinates.length} ordinat</p>
            <p className="text-xs text-green-600 mt-1">
              Metode: {selectedHSS?.toUpperCase()}
            </p>
          </div>
        </div>

        <button
          onClick={handleCalculate}
          className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <TrendingUp className="w-5 h-5" />
          Hitung Konvolusi
        </button>
      </Card>

      {calculated && hydrograph.length > 0 && (
        <>
          {/* Peak Discharge Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <p className="text-sm font-semibold opacity-90 mb-1">Debit Puncak (Qp)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">{peakDischarge}</span>
                <span className="text-lg font-bold opacity-80">m³/s</span>
              </div>
              <p className="text-xs opacity-75 mt-2">Metode: {selectedHSS?.toUpperCase()}</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <p className="text-sm font-semibold opacity-90 mb-1">Waktu Puncak (Tp)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">{timeToPeak}</span>
                <span className="text-lg font-bold opacity-80">jam</span>
              </div>
              <p className="text-xs opacity-75 mt-2">Durasi: {durasiHujan} jam</p>
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
                  dataKey="discharge"
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
