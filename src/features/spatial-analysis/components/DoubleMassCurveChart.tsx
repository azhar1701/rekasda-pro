import React from 'react';
import { Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { Card } from '@/components/ui/Card';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DoubleMassResult } from '@/lib/utils/qc/dataQualityMath';

interface DoubleMassCurveChartProps {
  result: DoubleMassResult;
  targetName?: string;
  referenceName?: string;
}

export const DoubleMassCurveChart: React.FC<DoubleMassCurveChartProps> = ({
  result,
  targetName = "CHIRPS",
  referenceName = "Stasiun Sekitar"
}) => {
  const { dataPlot, isKonsisten, breakYear, faktorKoreksi, pesan } = result;

  if (!dataPlot || dataPlot.length === 0) return null;

  // Prepare regression line points (start and end)
  const xMin = 0;
  const yMin = 0;
  const lastPoint = dataPlot[dataPlot.length - 1];
  const xMax = lastPoint.akumulasiReferensi;
  const yMax = lastPoint.akumulasiTarget;

  const regressionData = [
    { akumulasiReferensi: xMin, regressionY: yMin },
    { akumulasiReferensi: xMax, regressionY: yMax }
  ];

  return (
    <Card className={`p-4 border-l-4 shadow-sm bg-white ${isKonsisten ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-700 ">Double Mass Curve</h4>
          <p className="text-[10px] text-slate-500">Uji Konsistensi Data Spasial</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold ${isKonsisten ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {isKonsisten ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          {isKonsisten ? 'KONSISTEN' : 'INKONSISTEN'}
        </div>
      </div>

      <div style={{ height: 250, width: '100%' }}>
        <ResponsiveContainer>
          <ComposedChart margin={{ top: 5, right: 10, left: -20, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="akumulasiReferensi"
              type="number"
              tick={{ fontSize: 10, fill: '#64748b' }}
              domain={[0, 'dataMax']}
              label={{ value: `Σ Hujan ${referenceName} (mm)`, position: 'insideBottom', offset: -10, fontSize: 10, fill: '#64748b' }}
            />
            <YAxis
              dataKey="akumulasiTarget"
              type="number"
              tick={{ fontSize: 10, fill: '#64748b' }}
              domain={[0, 'dataMax']}
              width={60}
              label={{ value: `Σ Hujan ${targetName} (mm)`, angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(val: number, name: string) => [val.toFixed(1), name === 'akumulasiTarget' ? targetName : 'Trend']}
              labelFormatter={(label) => `Σ Referensi: ${Number(label).toFixed(1)} mm`}
            />
            <Line data={regressionData} dataKey="regressionY" stroke="#94a3b8" strokeWidth={1} strokeDasharray="5 5" dot={false} activeDot={false} isAnimationActive={false} />
            <Scatter data={dataPlot} fill="#0c3a66" line={{ stroke: '#0ea5e9', strokeWidth: 1.5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-[10px] font-mono p-2 bg-slate-50 rounded text-slate-600 border border-slate-200">
        {pesan}
        {!isKonsisten && breakYear && (
          <span className="block mt-1 font-bold text-rose-600">⚠ Diperlukan koreksi data pra-{breakYear} (Faktor: {faktorKoreksi?.toFixed(3)})</span>
        )}
      </div>
    </Card>
  );
};
