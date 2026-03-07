import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Activity, TrendingUp } from 'lucide-react';
import { Info } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { calculateHSSNakayasu } from '@/lib/engine/flood/sni2415';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tooltip as UITooltip } from '@/components/ui/data-display/Tooltip';

interface HSSComparisonStepProps {
  onComplete: (method: string, ordinates: number[], hydrograph: { time: number;
  discharge: number }[]) => void;
isCompleted: boolean;
}

const HSS_METHODS = [
  { id: 'nakayasu', label: 'Nakayasu', color: '#3b82f6' },
  { id: 'snyder', label: 'Snyder', color: '#10b981' },
  { id: 'scs', label: 'SCS', color: '#f59e0b' },
  { id: 'itb1', label: 'ITB-1', color: '#8b5cf6' }
];

export const HSSComparisonStep: React.FC<HSSComparisonStepProps> = ({
  onComplete,
  isCompleted
}) => {
  const { morfometriDAS, distribusiHujanJamJaman } = useHydrologyStore();
  const [selectedMethod, setSelectedMethod] = useState<string>('nakayasu');
  const [calculated, setCalculated] = useState(false);

  useEffect(() => {
    if (!distribusiHujanJamJaman || distribusiHujanJamJaman.length === 0) {
      setCalculated(false);
    }
  }, [distribusiHujanJamJaman]);

  const A = morfometriDAS?.luasDAS || 100;
  const L = morfometriDAS?.panjangSungai || 20;

  const hssResults = useMemo(() => {
    if (!calculated) return {};

    const results: Record<string, { time: number[]; discharge: number[]; hydrograph: { time: number; discharge: number }[] }> = {};

    // Nakayasu (Real Engine)
    const Tg_nak = L < 15 ? 0.4 + 0.058 * L : 0.21 * Math.pow(L, 0.7);
    const Tr_nak = 0.5 * Tg_nak;
    const nakayasuOutput = calculateHSSNakayasu({
      Ro: 1, // Unit hydrograph
      Tg: Tg_nak,
      Tr: Tr_nak,
      Alpha: 2.0,
      A: A,
      L: L
    });
    
    // Filter to 0.5h intervals for consistency and worker compatibility
    const filteredNakayasu: { time: number; discharge: number }[] = [];
    for (let t = 0; t <= nakayasuOutput.Tb; t += 0.5) {
      const closest = nakayasuOutput.hydrograph.reduce((prev, curr) => 
        Math.abs(curr.time - t) < Math.abs(prev.time - t) ? curr : prev
      );
      filteredNakayasu.push({ time: t, discharge: closest.discharge });
    }

    results.nakayasu = { 
      time: filteredNakayasu.map(p => p.time), 
      discharge: filteredNakayasu.map(p => p.discharge),
      hydrograph: filteredNakayasu
    };

    // Snyder (simplified but consistent)
    const Ct = 0.6;
    const Lc = L * 0.5;
    const tp_sny = Ct * Math.pow(L * Lc, 0.3);
    const Qp_sny = (2.78 * 0.6 * A) / tp_sny;
    
    const hydro_sny: { time: number; discharge: number }[] = [];
    for (let t = 0; t <= tp_sny * 5; t += 0.5) {
      let q = 0;
      if (t <= tp_sny) {
        q = Qp_sny * Math.pow(t / tp_sny, 2.5);
      } else {
        q = Qp_sny * Math.exp(-0.5 * (t - tp_sny) / tp_sny);
      }
      hydro_sny.push({ time: t, discharge: q });
    }
    results.snyder = { 
      time: hydro_sny.map(p => p.time), 
      discharge: hydro_sny.map(p => p.discharge),
      hydrograph: hydro_sny
    };

    // SCS (simplified but consistent)
    const tp_scs = 0.6 * Math.sqrt(A);
    const Qp_scs = (2.08 * A) / tp_scs;
    
    const hydro_scs: { time: number; discharge: number }[] = [];
    for (let t = 0; t <= tp_scs * 5; t += 0.5) {
      const ratio = t / tp_scs;
      let q = 0;
      if (ratio <= 1) {
        q = Qp_scs * Math.pow(ratio, 2.3);
      } else {
        q = Qp_scs * Math.exp(-0.6 * (ratio - 1));
      }
      hydro_scs.push({ time: t, discharge: q });
    }
    results.scs = { 
      time: hydro_scs.map(p => p.time), 
      discharge: hydro_scs.map(p => p.discharge),
      hydrograph: hydro_scs
    };

    // ITB-1 (simplified but consistent)
    const tp_itb = 0.5 * Math.sqrt(A);
    const Qp_itb = (0.18 * A) / tp_itb;
    
    const hydro_itb: { time: number; discharge: number }[] = [];
    for (let t = 0; t <= tp_itb * 6; t += 0.5) {
      let q = 0;
      if (t <= tp_itb) {
        q = Qp_itb * Math.pow(t / tp_itb, 2.2);
      } else {
        q = Qp_itb * Math.exp(-0.7 * (t - tp_itb) / tp_itb);
      }
      hydro_itb.push({ time: t, discharge: q });
    }
    results.itb1 = { 
      time: hydro_itb.map(p => p.time), 
      discharge: hydro_itb.map(p => p.discharge),
      hydrograph: hydro_itb
    };

    return results;
  }, [calculated, A, L]);

  const chartData = useMemo(() => {
    if (!calculated) return [];
    
    const maxLength = Math.max(...Object.values(hssResults).map(r => r.time.length));
    const data: any[] = [];
    
    for (let i = 0; i < maxLength; i++) {
      const point: any = { time: i * 0.5 };
      Object.entries(hssResults).forEach(([method, result]) => {
        point[method] = result.discharge[i] || null;
      });
      data.push(point);
    }
    
    return data;
  }, [calculated, hssResults]);

  const handleCalculate = () => {
    setCalculated(true);
  };

  const handleComplete = () => {
    const selected = hssResults[selectedMethod];
    if (selected) {
      onComplete(selectedMethod, selected.discharge, selected.hydrograph);
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Upstream Check */}
      {(!distribusiHujanJamJaman || distribusiHujanJamJaman.length === 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <p className="text-sm font-semibold text-amber-900">⚠️ Selesaikan Step Distribusi Hujan terlebih dahulu</p>
          <p className="text-xs text-amber-700 mt-1">Data hujan efektif diperlukan untuk konvolusi HSS</p>
        </div>
      )}

      {/* TAHAP 2: Contextual Header - Data Upstream dari Store */}
      {morfometriDAS && distribusiHujanJamJaman && distribusiHujanJamJaman.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-md bg-pupr-blue" />
            <p className="text-xs font-bold text-slate-700">Data dari Step Sebelumnya (Read-Only)</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-600">Luas DAS:</span>
              <span className="ml-2 font-bold text-blue-900 tabular-nums tracking-tight">{A.toFixed(2)} km²</span>
            </div>
            <div>
              <span className="text-slate-600">Panjang Sungai:</span>
              <span className="ml-2 font-bold text-blue-900 tabular-nums tracking-tight">{L.toFixed(2)} km</span>
            </div>
            <div>
              <span className="text-slate-600">Durasi Hujan:</span>
              <span className="ml-2 font-bold text-blue-900 tabular-nums tracking-tight">{distribusiHujanJamJaman.length} jam</span>
            </div>
          </div>
        </div>
      )}

      <Card className="p-6 bg-white border border-slate-300 shadow-sm rounded-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-md">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Perbandingan Hidrograf Satuan Sintetis</h3>
              <p className="text-xs text-slate-500">Multi-HSS untuk 1 mm hujan efektif</p>
            </div>
          </div>
          <UITooltip content="Alpha = 2.0 sebagai standar SNI kecuali ada data kalibrasi.">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded border border-slate-200 cursor-help">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] font-bold text-slate-600">Alpha = 2.0</span>
            </div>
          </UITooltip>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <p className="text-xs font-semibold text-slate-600">Luas DAS (A)</p>
            <p className="text-lg font-bold text-slate-900 tabular-nums tracking-tight">{A.toFixed(2)} km²</p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <p className="text-xs font-semibold text-slate-600">Panjang Sungai (L)</p>
            <p className="text-lg font-bold text-slate-900 tabular-nums tracking-tight">{L.toFixed(2)} km</p>
          </div>
        </div>

        <button
          onClick={handleCalculate}
          className="w-full px-4 py-3 bg-[#0c3a66] hover:bg-[#0d4578] text-white font-semibold rounded-md transition-colors flex items-center justify-center gap-2"
        >
          <TrendingUp className="w-5 h-5" />
          Hitung & Bandingkan HSS
        </button>
      </Card>

      {calculated && chartData.length > 0 && (
        <>
          <Card className="p-6 bg-white border border-slate-300 shadow-sm rounded-md">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Kurva Perbandingan HSS</h4>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="time" 
                  label={{ value: 'Waktu (jam)', position: 'insideBottom', offset: -5, style: { fontSize: 12, fontWeight: 600 } }}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  label={{ value: 'Q (m³/s/mm)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fontWeight: 600 } }}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => value.toFixed(2)}
                />
                <Tooltip itemStyle={{ fontVariantNumeric: "tabular-nums" }} 
                  contentStyle={{ fontSize: 12, fontFamily: 'monospace' }}
                  formatter={(value: any) => value?.toFixed(3)}
                />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                {HSS_METHODS.map(method => (
                  <Line
                    key={method.id}
                    type="monotone"
                    dataKey={method.id}
                    stroke={method.color}
                    strokeWidth={selectedMethod === method.id ? 3 : 2}
                    name={method.label}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 bg-white border border-slate-300 shadow-sm rounded-md">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Pilih Metode HSS</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {HSS_METHODS.map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`p-3 rounded-md border-2 transition-all ${
                    selectedMethod === method.id
                      ? 'border-[#0c3a66] bg-[#0c3a66]/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-4 h-4 rounded-md mx-auto mb-2" style={{ backgroundColor: method.color }} />
                  <p className="text-sm font-semibold text-slate-900">{method.label}</p>
                </button>
              ))}
            </div>

            <button
              onClick={handleComplete}
              disabled={isCompleted}
              className={`w-full px-6 py-3 rounded-md font-semibold transition-colors ${
                isCompleted
                  ? 'bg-green-600 text-white cursor-default'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isCompleted ? '✓ Selesai' : 'Lanjut ke Konvolusi →'}
            </button>
          </Card>
        </>
      )}
    </div>
  );
};
