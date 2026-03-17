import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { ManningInputs, ChannelShape } from '@/types/types';
import { calculateManning } from '@/services/calculationService';
import { CHART_COLORS } from '@/lib/constants/chartColors';

interface Props {
  inputs: ManningInputs;
  currentQ: number;
}

export const RatingCurveChart: React.FC<Props> = ({ inputs, currentQ }) => {
  const chartData = useMemo(() => {
    const data = [];
    const maxH = inputs.shape === ChannelShape.CIRCULAR ? inputs.diameter : inputs.totalDepth || (inputs.depth * 1.5);
    const steps = 20;

    for (let i = 0; i <= steps; i++) {
        const stepH = (maxH / steps) * i;
        if (stepH === 0 && i === 0) {
            data.push({ h: 0, q: 0 });
            continue;
        }
        
        const results = calculateManning({
            ...inputs,
            depth: stepH
        });
        
        data.push({
            h: parseFloat(stepH.toFixed(3)),
            q: parseFloat(Number(results.Discharge).toFixed(3))
        });
    }
    return data;
  }, [inputs]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Hydraulic Analytics</h3>
          <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200">Rating Curve (H vs Q)</h2>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-pupr-blue/20 border border-pupr-blue/50" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Kapasitas</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-rose-500" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Q Operasi</span>
            </div>
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="colorQ" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.hydrograph} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={CHART_COLORS.hydrograph} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_COLORS.gridLine} />
            <XAxis 
              dataKey="q" 
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: CHART_COLORS.axisLine, fontWeight: 700 }}
              label={{ value: 'Debit (m³/s)', position: 'insideBottom', offset: -10, fontSize: 9, fill: CHART_COLORS.axisLine, fontWeight: 800 }}
            />
            <YAxis 
              dataKey="h"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: CHART_COLORS.axisLine, fontWeight: 700 }}
              label={{ value: 'Kedalaman (m)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 9, fill: CHART_COLORS.axisLine, fontWeight: 800 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: 'none', 
                borderRadius: '0px', 
                fontSize: '10px',
                color: 'white',
                fontWeight: '700'
              }}
              itemStyle={{ color: 'white' }}
              cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
              labelFormatter={(value) => `Debit: ${value} m³/s`}
              formatter={(value: any) => [`${value} m`, 'Kedalaman (H)']}
            />
            <Area 
              type="monotone" 
              dataKey="h" 
              stroke={CHART_COLORS.hydrograph} 
              fillOpacity={1} 
              fill="url(#colorQ)" 
              strokeWidth={2}
            />
            {currentQ > 0 && (
                <ReferenceLine 
                    x={currentQ} 
                    stroke="#f43f5e" 
                    strokeWidth={2} 
                    strokeDasharray="3 3"
                    label={{ 
                        value: 'Q-OPS', 
                        position: 'top', 
                        fill: '#f43f5e', 
                        fontSize: 9, 
                        fontWeight: 900 
                    }} 
                />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-2 text-[8px] font-medium text-slate-400 uppercase tracking-widest text-right italic">
        * Kurva dihasilkan melalui simulasi iteratif Rumus Manning (Steady Flow)
      </div>
    </div>
  );
};
