import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceLine } from 'recharts';
import { Card } from '@/components/ui/Card';

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
    <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500 shadow-none">
      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Agreement: Ground vs Satellite</h4>
      <div className="h-[250px] w-full">
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              type="number" 
              dataKey="ground" 
              name="Ground" 
              unit=" mm" 
              domain={[0, maxVal * 1.1]}
              tick={{ fontSize: 10, fill: '#64748b' }}
              label={{ value: 'Observasi (mm)', position: 'insideBottom', offset: -10, fontSize: 10, fill: '#64748b' }}
            />
            <YAxis 
              type="number" 
              dataKey="satellite" 
              name="Satellite" 
              unit=" mm" 
              domain={[0, maxVal * 1.1]}
              tick={{ fontSize: 10, fill: '#64748b' }}
              label={{ value: 'Satelit (mm)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }}
            />
            <ZAxis type="number" range={[64]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ borderRadius: '4px', fontSize: '10px', border: '1px solid #e2e8f0' }}
              formatter={(value: number, name: string) => [value.toFixed(1) + ' mm', name]}
            />
            <ReferenceLine x={0} y={0} segment={[{ x: 0, y: 0 }, { x: maxVal * 1.1, y: maxVal * 1.1 }]} stroke="#94a3b8" strokeDasharray="3 3" />
            <Scatter name="Rainfall Pair" data={data} fill="#10b981" fillOpacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
