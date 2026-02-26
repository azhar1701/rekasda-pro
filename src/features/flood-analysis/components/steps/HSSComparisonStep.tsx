import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Activity, TrendingUp } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HSSComparisonStepProps {
  onComplete: (method: string, ordinates: number[]) => void;
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
  const { morfometriDAS } = useHydrologyStore();
  const [selectedMethod, setSelectedMethod] = useState<string>('nakayasu');
  const [calculated, setCalculated] = useState(false);

  const A = morfometriDAS?.luasDAS || 100;
  const L = morfometriDAS?.panjangSungai || 20;

  const hssResults = useMemo(() => {
    if (!calculated) return {};

    const results: Record<string, { time: number[]; discharge: number[] }> = {};

    // Nakayasu
    const Tg = L < 15 ? 0.4 + 0.058 * L : 0.21 * Math.pow(L, 0.7);
    const Tr = 0.5 * Tg;
    const Tp_nak = Tg + 0.8 * Tr;
    const Qp_nak = (A * 1) / (3.6 * (0.3 * Tp_nak + 2.0 * (Tp_nak + Tg)));
    
    const time_nak: number[] = [];
    const q_nak: number[] = [];
    for (let t = 0; t <= Tp_nak * 4; t += 0.5) {
      time_nak.push(t);
      if (t <= Tp_nak) {
        q_nak.push(Qp_nak * Math.pow(t / Tp_nak, 2.4));
      } else if (t <= Tp_nak + 1.5 * Tg) {
        q_nak.push(Qp_nak * Math.pow(0.3, (t - Tp_nak) / Tg));
      } else {
        q_nak.push(Qp_nak * Math.pow(0.3, 1.5 + (t - Tp_nak - 1.5 * Tg) / (2 * Tg)));
      }
    }
    results.nakayasu = { time: time_nak, discharge: q_nak };

    // Snyder (simplified)
    const Ct = 0.6;
    const Lc = L * 0.5;
    const tp_sny = Ct * Math.pow(L * Lc, 0.3);
    const Qp_sny = (2.78 * 0.6 * A) / tp_sny;
    
    const time_sny: number[] = [];
    const q_sny: number[] = [];
    for (let t = 0; t <= tp_sny * 5; t += 0.5) {
      time_sny.push(t);
      if (t <= tp_sny) {
        q_sny.push(Qp_sny * Math.pow(t / tp_sny, 2.5));
      } else {
        q_sny.push(Qp_sny * Math.exp(-0.5 * (t - tp_sny) / tp_sny));
      }
    }
    results.snyder = { time: time_sny, discharge: q_sny };

    // SCS (simplified)
    const tp_scs = 0.6 * Math.sqrt(A);
    const Qp_scs = (2.08 * A) / tp_scs;
    
    const time_scs: number[] = [];
    const q_scs: number[] = [];
    for (let t = 0; t <= tp_scs * 5; t += 0.5) {
      time_scs.push(t);
      const ratio = t / tp_scs;
      if (ratio <= 1) {
        q_scs.push(Qp_scs * Math.pow(ratio, 2.3));
      } else {
        q_scs.push(Qp_scs * Math.exp(-0.6 * (ratio - 1)));
      }
    }
    results.scs = { time: time_scs, discharge: q_scs };

    // ITB-1 (simplified)
    const tp_itb = 0.5 * Math.sqrt(A);
    const Qp_itb = (0.18 * A) / tp_itb;
    
    const time_itb: number[] = [];
    const q_itb: number[] = [];
    for (let t = 0; t <= tp_itb * 6; t += 0.5) {
      time_itb.push(t);
      if (t <= tp_itb) {
        q_itb.push(Qp_itb * Math.pow(t / tp_itb, 2.2));
      } else {
        q_itb.push(Qp_itb * Math.exp(-0.7 * (t - tp_itb) / tp_itb));
      }
    }
    results.itb1 = { time: time_itb, discharge: q_itb };

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
      onComplete(selectedMethod, selected.discharge);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Activity className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Perbandingan Hidrograf Satuan Sintetis</h3>
            <p className="text-xs text-slate-500">Multi-HSS untuk 1 mm hujan efektif</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600">Luas DAS (A)</p>
            <p className="text-lg font-bold text-slate-900">{A.toFixed(2)} km²</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600">Panjang Sungai (L)</p>
            <p className="text-lg font-bold text-slate-900">{L.toFixed(2)} km</p>
          </div>
        </div>

        <button
          onClick={handleCalculate}
          className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <TrendingUp className="w-5 h-5" />
          Hitung & Bandingkan HSS
        </button>
      </Card>

      {calculated && chartData.length > 0 && (
        <>
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Kurva Perbandingan HSS</h4>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" label={{ value: 'Waktu (jam)', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Q (m³/s/mm)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
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

          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Pilih Metode HSS</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {HSS_METHODS.map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedMethod === method.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: method.color }} />
                  <p className="text-sm font-semibold text-slate-900">{method.label}</p>
                </button>
              ))}
            </div>

            <button
              onClick={handleComplete}
              disabled={isCompleted}
              className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
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
