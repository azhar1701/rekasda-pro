import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceLine } from 'recharts';

interface SatelliteScatterPlotProps {
  data: Array<{
    ground: number;
    satellite: number;
    year: number;
  }>;
}

export const SatelliteScatterPlot: React.FC<SatelliteScatterPlotProps> = ({ data }) => {
  const maxVal = Math.max(...data.map(d => Math.max(d.ground, d.satellite)), 100);
  
  return (
    <div className="h-[250px] w-full bg-white dark:bg-slate-900">
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis 
            type="number" 
            dataKey="ground" 
            name="Ground" 
            unit=" mm" 
            domain={[0, maxVal * 1.1]}
            tick={{ fontSize: 9, fill: '#94a3b8' }}
            label={{ value: 'Observasi (mm)', position: 'insideBottom', offset: -10, fontSize: 9, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis 
            type="number" 
            dataKey="satellite" 
            name="Satellite" 
            unit=" mm" 
            domain={[0, maxVal * 1.1]}
            tick={{ fontSize: 9, fill: '#94a3b8' }}
            label={{ value: 'Satelit (mm)', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={70}
          />
          <ZAxis type="number" range={[50, 50]} />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ borderRadius: '0px', fontSize: '10px', border: '1px solid #e2e8f0', boxShadow: 'none' }}
            formatter={(value: number, name: string) => [value.toFixed(1) + ' mm', name]}
          />
          <ReferenceLine x={0} y={0} segment={[{ x: 0, y: 0 }, { x: maxVal * 1.1, y: maxVal * 1.1 }]} stroke="#cbd5e1" strokeDasharray="3 3" />
          <Scatter name="Rainfall Pair" data={data} fill="#10b981" fillOpacity={0.6} shape="circle" strokeWidth={0} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
