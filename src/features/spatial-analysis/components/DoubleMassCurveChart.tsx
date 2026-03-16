import React from 'react';
import { Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
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
  const { dataPlot, pesan } = result;

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
    <div className="w-full bg-white dark:bg-slate-900 h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer>
          <ComposedChart margin={{ top: 10, right: 10, left: -10, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="akumulasiReferensi"
              type="number"
              tick={{ fontSize: 9, fill: '#94a3b8' }}
              domain={[0, 'dataMax']}
              label={{ value: `\u03A3 Hujan ${referenceName} (mm)`, position: 'insideBottom', offset: -5, fontSize: 9, fill: '#94a3b8' }}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              dataKey="akumulasiTarget"
              type="number"
              tick={{ fontSize: 9, fill: '#94a3b8' }}
              domain={[0, 'dataMax']}
              width={70}
              label={{ value: `\u03A3 Hujan ${targetName} (mm)`, angle: -90, position: 'insideLeft', fontSize: 9, fill: '#94a3b8', offset: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ borderRadius: '0px', fontSize: '10px', border: '1px solid #e2e8f0', boxShadow: 'none' }}
              formatter={(val: number, name: string) => [val.toFixed(1), name === 'akumulasiTarget' ? targetName : 'Trend']}
              labelFormatter={(label) => `\u03A3 Referensi: ${Number(label).toFixed(1)} mm`}
            />
            <Line data={regressionData} dataKey="regressionY" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="5 5" dot={false} activeDot={false} isAnimationActive={false} />
            <Scatter data={dataPlot} fill="#0c3a66" line={{ stroke: '#0ea5e9', strokeWidth: 1.5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-[9px] font-mono p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700 leading-tight">
        {pesan}
      </div>
    </div>
  );
};
