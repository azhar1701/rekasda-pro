import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Waves, Save, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { useHydrologyWorker } from '@/hooks/useHydrologyWorker';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface KonvolusiStepProps {
  hssOrdinates: number[];
  selectedHSS: string | null;
  onComplete: () => void;
  isCompleted: boolean;
}

interface HydrographPoint {
  time: number;
  inflow: number;
}

interface KonvolusiState {
  hydrograph: HydrographPoint[];
  peakDischarge: number;
  timeToPeak: number;
}

const INITIAL_STATE: KonvolusiState = {
  hydrograph: [],
  peakDischarge: 0,
  timeToPeak: 0,
};

export const KonvolusiStep: React.FC<KonvolusiStepProps> = ({
  hssOrdinates,
  selectedHSS,
  onComplete,
  isCompleted,
}) => {
  const { setHasilBanjir, hujanEfektif } = useHydrologyStore();

  // ── Worker hook — semua kalkulasi berat di background thread ──────────────
  const { calculateConvolution, isCalculating, error: workerError, clearError } =
    useHydrologyWorker();

  const [result, setResult] = useState<KonvolusiState>(INITIAL_STATE);
  const [hasCalculated, setHasCalculated] = useState(false);

  const isDataReady =
    Array.isArray(hujanEfektif) &&
    hujanEfektif.length > 0 &&
    hssOrdinates.length > 0;

  // Reset hasil saat input berubah (step sebelumnya diubah user)
  useEffect(() => {
    setResult(INITIAL_STATE);
    setHasCalculated(false);
    clearError();
  }, [hujanEfektif, hssOrdinates, clearError]);

  // ── Trigger kalkulasi konvolusi di Worker ──────────────────────────────────
  const handleCalculate = useCallback(async () => {
    if (!isDataReady || isCalculating) return;

    try {
      clearError();

      // Kirim ke background thread — main thread TIDAK terblokir
      const workerResult = await calculateConvolution({
        hujanEfektif: hujanEfektif ?? [],
        ordinatHSS: hssOrdinates,
        baseflow: 0,
        timeStep: 0.5,
      });

      // Transformasi ke format chart
      const hydrograph: HydrographPoint[] = (workerResult.debitBanjir ?? []).map(
        (q, i) => ({
          time: Number((i * 0.5).toFixed(1)),
          inflow: Number(q.toFixed(2)),
        }),
      );

      setResult({
        hydrograph,
        peakDischarge: workerResult.debitPuncak,
        timeToPeak: workerResult.waktuPuncak,
      });
      setHasCalculated(true);
    } catch (err) {
      // Error sudah diset di hook — tidak perlu setState tambahan
      console.error('[KonvolusiStep] Worker error:', err);
    }
  }, [isDataReady, isCalculating, hujanEfektif, hssOrdinates, calculateConvolution, clearError]);

  // ── Simpan ke global store ─────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    const { hydrograph, peakDischarge, timeToPeak } = result;

    setHasilBanjir({
      debitPuncak: peakDischarge,
      hidrograf: hydrograph,
      method: selectedHSS ?? 'unknown',
    });

    useHydrologyStore.getState().setHasilKonvolusi({
      floodHydrograph: hydrograph.map(h => ({ time: h.time, discharge: h.inflow })),
      peakDischarge,
      timeToPeak,
      totalVolume: hydrograph.reduce((sum, h) => sum + h.inflow, 0) * 0.5 * 3600,
      componentHydrographs: [],
    });

    onComplete();
  }, [result, selectedHSS, setHasilBanjir, onComplete]);

  // ─────────────────────────────────────────────────────────────────────────
  const { hydrograph, peakDischarge, timeToPeak } = result;

  return (
    <div className="space-y-6">

      {/* Empty State — data belum tersedia */}
      {!isDataReady && (
        <Card className="p-6 bg-yellow-50 border-2 border-yellow-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-100 rounded-full flex-shrink-0">
              <Waves className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-900 mb-2">
                Data Hujan Efektif Belum Tersedia
              </h3>
              <p className="text-sm text-yellow-800">
                Sistem membutuhkan distribusi hujan jam-jaman untuk melakukan
                konvolusi. Silakan selesaikan{' '}
                <strong>Distribusi Hujan</strong> di langkah sebelumnya terlebih dahulu.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Panel utama kalkulasi */}
      <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
            <Waves className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Konvolusi &amp; Hidrograf Banjir</h3>
            <p className="text-xs text-slate-500">
              Superposisi Hujan Efektif × HSS {selectedHSS?.toUpperCase()}
              {' '}— Kalkulasi berjalan di background thread (non-blocking)
            </p>
          </div>
        </div>

        {/* Ringkasan data input */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs font-semibold text-blue-700">Hujan Efektif</p>
            <p className="text-lg font-bold text-blue-900 tabular-nums tracking-tight">
              {hujanEfektif?.length ?? 0} ordinat
            </p>
            <p className="text-xs text-blue-600 mt-1 tabular-nums tracking-tight">
              Total: {((hujanEfektif ?? []).reduce((a, b) => a + b, 0)).toFixed(2)} mm
            </p>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-xs font-semibold text-green-700">HSS Ordinates</p>
            <p className="text-lg font-bold text-green-900 tabular-nums tracking-tight">
              {hssOrdinates.length} ordinat
            </p>
            <p className="text-xs text-green-600 mt-1">
              Metode: {selectedHSS?.toUpperCase() ?? '-'}
            </p>
          </div>
        </div>

        {/* Error state */}
        {workerError && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{workerError}</p>
          </div>
        )}

        {/* Tombol hitung */}
        <button
          onClick={handleCalculate}
          disabled={!isDataReady || isCalculating}
          className="w-full px-4 py-3 bg-[#0c3a66] hover:bg-[#0d4578] active:bg-[#0b3060] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#0c3a66] focus:ring-offset-2"
          title={!isDataReady ? 'Selesaikan Distribusi Hujan terlebih dahulu' : ''}
        >
          {isCalculating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Menghitung Konvolusi…
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5" />
              {!isDataReady ? 'Menunggu Data Hujan…' : 'Hitung Konvolusi'}
            </>
          )}
        </button>
      </Card>

      {/* Hasil konvolusi */}
      {hasCalculated && hydrograph.length > 0 && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 bg-gradient-to-br from-[#0c3a66] to-[#0d4578] text-white rounded-md">
              <p className="text-sm font-semibold opacity-90 mb-1">Debit Puncak (Qp)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tabular-nums tracking-tight">
                  {peakDischarge.toFixed(2)}
                </span>
                <span className="text-lg font-bold opacity-80">m³/s</span>
              </div>
              <p className="text-xs opacity-75 mt-2">Metode: {selectedHSS?.toUpperCase()}</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-slate-600 to-slate-700 text-white rounded-md">
              <p className="text-sm font-semibold opacity-90 mb-1">Waktu Puncak (Tp)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tabular-nums tracking-tight">
                  {timeToPeak.toFixed(1)}
                </span>
                <span className="text-lg font-bold opacity-80">jam</span>
              </div>
              <p className="text-xs opacity-75 mt-2">Dari hidrograf konvolusi</p>
            </Card>
          </div>

          {/* Grafik hidrograf */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Hidrograf Banjir Rencana</h4>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={hydrograph}>
                <defs>
                  <linearGradient id="floodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
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
                  tickFormatter={(v: number) => v.toLocaleString('id-ID')}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(2)} m³/s`, 'Debit']}
                  labelFormatter={(label: string) => `Jam ke-${label}`}
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

          {/* Tombol simpan */}
          <Card className="p-6 bg-green-50 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-900">Analisis Banjir Selesai</p>
                <p className="text-xs text-green-700 mt-1 tabular-nums">
                  Qp = {peakDischarge.toFixed(2)} m³/s pada t = {timeToPeak.toFixed(1)} jam
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={isCompleted}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  isCompleted
                    ? 'bg-green-600 text-white cursor-default'
                    : 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
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
