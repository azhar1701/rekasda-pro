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
    <Card className={`p-5 rounded-[2rem] border-l-[6px] shadow-xl bg-white transition-all hover:shadow-2xl ${isKonsisten ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="text-base font-extrabold text-slate-800 uppercase tracking-tighter italic">Double Mass Curve</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Uji Konsistensi Data Spasial</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest shadow-sm ${isKonsisten ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
          {isKonsisten ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          {isKonsisten ? 'Konsisten' : 'Inkonsisten'}
        </div>
      </div>

      <div style={{ height: 250, width: '100%' }}>
        <ResponsiveContainer>
          <ComposedChart margin={{ top: 10, right: 10, left: -10, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="akumulasiReferensi"
              type="number"
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              domain={[0, 'dataMax']}
              label={{ value: `Σ Hujan ${referenceName} (mm)`, position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}
            />
            <YAxis
              dataKey="akumulasiTarget"
              type="number"
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 'dataMax']}
              width={60}
              label={{ value: `Σ Hujan ${targetName} (mm)`, angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }}
              contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
              formatter={(val: number, name: string) => [val.toFixed(1), name === 'akumulasiTarget' ? targetName : 'Trend']}
              labelFormatter={(label) => `Σ Referensi: ${Number(label).toFixed(1)} mm`}
            />
            <Line data={regressionData} dataKey="regressionY" stroke="#e2e8f0" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} isAnimationActive={false} />
            <Scatter data={dataPlot} fill="#0c3a66" line={{ stroke: '#0c3a66', strokeWidth: 2, strokeOpacity: 0.3 }} />
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
