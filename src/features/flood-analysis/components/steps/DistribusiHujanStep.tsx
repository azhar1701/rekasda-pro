import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { CloudRain, Droplets, Calculator } from 'lucide-react';
import { useFrequencyAnalysis } from '@/hooks/useFrequencyAnalysis';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DistribusiHujanStepProps {
  onComplete: (hujanEfektif: number[], durasi: number) => void;
  isCompleted: boolean;
}

export const DistribusiHujanStep: React.FC<DistribusiHujanStepProps> = ({ onComplete, isCompleted }) => {
  const { getR24 } = useFrequencyAnalysis();
  const { tutupanLahan } = useHydrologyStore();
  
  const [returnPeriod, setReturnPeriod] = useState(25);
  const [durasi, setDurasi] = useState(6);
  const [lossMethod, setLossMethod] = useState<'C' | 'CN'>('C');
  const [calculated, setCalculated] = useState(false);
  
  const R24 = getR24(returnPeriod) || 0;
  const C = tutupanLahan?.koefisienPengaliranGabungan || 0.65;
  const CN = tutupanLahan?.curveNumberGabungan || 75;

  const { hyetograph, effectiveRainfall } = useMemo(() => {
    if (!calculated) return { hyetograph: [], effectiveRainfall: [] };

    // Mononobe equation: I = (R24 / 24) * (24 / t)^(2/3)
    const intensities: number[] = [];
    for (let i = 1; i <= durasi; i++) {
      const I = (R24 / 24) * Math.pow(24 / i, 2/3);
      intensities.push(I);
    }

    // Alternating Block Method
    const sorted = [...intensities].sort((a, b) => b - a);
    const abm: number[] = [];
    const mid = Math.floor(durasi / 2);
    for (let i = 0; i < durasi; i++) {
      if (i % 2 === 0) {
        abm[mid + Math.floor(i / 2)] = sorted[i];
      } else {
        abm[mid - Math.ceil(i / 2)] = sorted[i];
      }
    }

    // Calculate losses
    const effective: number[] = [];
    if (lossMethod === 'C') {
      abm.forEach(rain => effective.push(rain * C));
    } else {
      const S = (25400 / CN) - 254;
      abm.forEach(rain => {
        const Pe = rain > 0.2 * S ? Math.pow(rain - 0.2 * S, 2) / (rain + 0.8 * S) : 0;
        effective.push(Pe);
      });
    }

    return { hyetograph: abm, effectiveRainfall: effective };
  }, [calculated, R24, durasi, lossMethod, C, CN]);

  const chartData = useMemo(() => {
    return hyetograph.map((total, i) => ({
      jam: i + 1,
      total: Number(total.toFixed(2)),
      efektif: Number(effectiveRainfall[i]?.toFixed(2) || 0),
      losses: Number((total - (effectiveRainfall[i] || 0)).toFixed(2))
    }));
  }, [hyetograph, effectiveRainfall]);

  const handleCalculate = () => {
    setCalculated(true);
  };

  const handleComplete = () => {
    onComplete(effectiveRainfall, durasi);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CloudRain className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Distribusi Hujan Jam-jaman</h3>
            <p className="text-xs text-slate-500">Mononobe + Alternating Block Method</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kala Ulang (Tr)</label>
            <select
              value={returnPeriod}
              onChange={(e) => setReturnPeriod(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              {[2, 5, 10, 25, 50, 100].map(tr => (
                <option key={tr} value={tr}>Q{tr} - {getR24(tr)?.toFixed(2) || 0} mm</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Durasi Hujan (jam)</label>
            <input
              type="number"
              value={durasi}
              onChange={(e) => setDurasi(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              min="2"
              max="24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Metode Losses</label>
            <select
              value={lossMethod}
              onChange={(e) => setLossMethod(e.target.value as 'C' | 'CN')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="C">Koef. C = {C.toFixed(3)}</option>
              <option value="CN">Curve Number = {CN.toFixed(0)}</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleCalculate}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Calculator className="w-5 h-5" />
          Hitung Distribusi & Losses
        </button>
      </Card>

      {calculated && chartData.length > 0 && (
        <>
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Hyetograph & Hujan Efektif</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="jam" label={{ value: 'Jam ke-', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Intensitas (mm)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="losses" stackId="a" fill="#94a3b8" name="Losses" />
                <Bar dataKey="efektif" stackId="a" fill="#3b82f6" name="Hujan Efektif" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 bg-green-50 border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Droplets className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-900">Total Hujan Efektif</p>
                  <p className="text-xs text-green-700">
                    {effectiveRainfall.reduce((a, b) => a + b, 0).toFixed(2)} mm dari {durasi} jam
                  </p>
                </div>
              </div>
              <button
                onClick={handleComplete}
                disabled={isCompleted}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  isCompleted
                    ? 'bg-green-600 text-white cursor-default'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isCompleted ? '✓ Selesai' : 'Lanjut ke HSS →'}
              </button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
