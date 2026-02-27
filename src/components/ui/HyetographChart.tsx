import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    <div className="bg-white/95 backdrop-blur border border-slate-300 shadow-md rounded-md p-3">
      <p className="text-xs font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">
        Jam ke-{jam}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-slate-600">Total Hujan:</span>
          <span className="text-xs font-medium text-slate-900 tabular-nums text-right">
            {total.toFixed(2)} mm
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#0c3a66]" />
            <span className="text-xs text-slate-600">Hujan Efektif:</span>
          </div>
          <span className="text-xs font-medium text-[#0c3a66] tabular-nums text-right">
            {efektif.toFixed(2)} mm
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#94a3b8]" />
            <span className="text-xs text-slate-600">Losses:</span>
          </div>
          <span className="text-xs font-medium text-slate-600 tabular-nums text-right">
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
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis 
          dataKey="jam" 
          tick={{ fontSize: 12, fill: '#64748b' }} 
          tickLine={false}
          label={{ value: 'Jam ke-', position: 'insideBottom', offset: -5, style: { fontSize: 12, fill: '#475569' } }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#64748b' }} 
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
          fill="#94a3b8" 
          name="Losses (Infiltrasi)" 
          radius={[0, 0, 0, 0]} 
        />
        <Bar 
          dataKey="efektif" 
          stackId="a" 
          fill="#0c3a66" 
          name="Hujan Efektif" 
          radius={[4, 4, 0, 0]} 
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
