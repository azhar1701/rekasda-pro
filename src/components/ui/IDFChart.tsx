import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '@/lib/constants/chartColors';

interface IDFChartProps {
 curahHujanRencana: Array<{ kalaUlang: number; curahHujan: number }>;
 selectedKalaUlang?: number;
 maxDuration?: number;
}

const COLORS: Record<number, string> = {
  2: CHART_COLORS.baseflow,
  5: CHART_COLORS.axisLine,
  10: '#475569',
  25: CHART_COLORS.discharge,
  50: CHART_COLORS.tertiary,
  100: CHART_COLORS.peakFlow
};


const CustomTooltip = ({ active, payload }: any) => {
 if (!active || !payload || payload.length === 0) return null;

 const duration = payload[0]?.payload?.duration || 0;

 return (
 <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm p-3">
 <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">
 Durasi: {duration} jam
 </p>
 <div className="space-y-1">
 {payload.map((entry: any, index: number) => (
 <div key={index} className="flex items-center justify-between gap-4">
 <div className="flex items-center gap-1.5">
 <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
 <span className="text-xs text-slate-600 dark:text-slate-500">{entry.name}:</span>
 </div>
 <span className="text-xs font-medium tabular-nums text-right" style={{ color: entry.color }}>
 {entry.value.toFixed(2)} mm/jam
 </span>
 </div>
 ))}
 </div>
 </div>
 );
};

export const IDFChart: React.FC<IDFChartProps> = ({ curahHujanRencana = [], selectedKalaUlang, maxDuration = 24 }) => {
 // Early return for empty data
 if (!curahHujanRencana || curahHujanRencana.length === 0) {
 return (
 <div className="w-full h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm">
 <div className="text-center p-6">
 <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
 </svg>
 <p className="text-sm font-semibold text-slate-600 dark:text-slate-500">Belum Ada Data IDF</p>
 <p className="text-xs text-slate-500 mt-1">Selesaikan Analisis Frekuensi terlebih dahulu</p>
 </div>
 </div>
 );
 }

 const data = React.useMemo(() => {
 const points = [];
 for (let t = 1; t <= maxDuration; t++) {
 const point: any = { duration: t };
 curahHujanRencana.forEach(({ kalaUlang, curahHujan }) => {
 const I = (curahHujan / 24) * Math.pow(24 / t, 2 / 3);
 point[`Q${kalaUlang}`] = Number(I.toFixed(2));
 });
 points.push(point);
 }
 return points;
 }, [curahHujanRencana, maxDuration]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLine} />
        <XAxis 
          dataKey="duration" 
          tick={{ fontSize: 12, fill: CHART_COLORS.axisLine }} 
          tickLine={false}
          label={{ value: 'Durasi (jam)', position: 'insideBottom', offset: -5, style: { fontSize: 12, fill: '#475569' } }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: CHART_COLORS.axisLine }} 
          tickLine={false} 
          axisLine={false}
          label={{ value: 'Intensitas (mm/jam)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#475569' } }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
          iconType="line"
        />
        {curahHujanRencana.map(({ kalaUlang }) => (
          <Line 
            key={kalaUlang}
            type="monotone" 
            dataKey={`Q${kalaUlang}`}
            stroke={COLORS[kalaUlang] || CHART_COLORS.axisLine}
            strokeWidth={selectedKalaUlang === kalaUlang ? 3 : 2}
            name={`Q${kalaUlang}`}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );

};
