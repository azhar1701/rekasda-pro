import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '@/lib/constants/chartColors';

interface HyetographData {
 jam: number;
 losses: number;
 efektif: number;
}

interface HyetographChartProps {
 data: HyetographData[];
}

const CustomTooltip = ({ active, payload }: any) => {
 if (!active || !payload || payload.length === 0) return null;

 const losses = payload.find((p: any) => p.dataKey === 'losses')?.value || 0;
 const efektif = payload.find((p: any) => p.dataKey === 'efektif')?.value || 0;
 const total = losses + efektif;
 const jam = payload[0]?.payload?.jam || 0;

 return (
 <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm p-3">
 <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">
 Jam ke-{jam}
 </p>
 <div className="space-y-1.5">
 <div className="flex items-center justify-between gap-4">
 <span className="text-xs text-slate-600 dark:text-slate-400">Total Hujan:</span>
 <span className="text-xs font-medium text-slate-900 dark:text-slate-100 tabular-nums text-right">
 {total.toFixed(2)} mm
 </span>
 </div>
 <div className="flex items-center justify-between gap-4">
 <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-pupr-blue" />
          <span className="text-xs text-slate-600 dark:text-slate-400">Hujan Efektif:</span>
        </div>
        <span className="text-xs font-medium text-pupr-blue tabular-nums text-right">
          {efektif.toFixed(2)} mm
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS.baseflow }} />
          <span className="text-xs text-slate-600 dark:text-slate-400">Losses:</span>
        </div>
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 tabular-nums text-right">
          {losses.toFixed(2)} mm
        </span>
      </div>

 </div>
 </div>
 );
};

export const HyetographChart: React.FC<HyetographChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_COLORS.gridLine} />
        <XAxis
          dataKey="jam"
          tick={{ fontSize: 12, fill: CHART_COLORS.axisLine }}
          tickLine={false}
          label={{ value: 'Jam ke-', position: 'insideBottom', offset: -5, style: { fontSize: 12, fill: '#475569' } }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: CHART_COLORS.axisLine }}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Intensitas (mm)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#475569' } }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
          iconType="square"
          iconSize={12}
        />
        <Bar
          dataKey="losses"
          stackId="a"
          fill={CHART_COLORS.baseflow}
          name="Losses (Infiltrasi)"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="efektif"
          stackId="a"
          fill={CHART_COLORS.discharge}
          name="Hujan Efektif"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

};
