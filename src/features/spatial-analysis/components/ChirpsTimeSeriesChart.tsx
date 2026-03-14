import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/Card';

interface ChirpsTimeSeriesChartProps {
 data: Array<{
 date: string; // YYYY-MM-DD
 rainfall: number;
 }>;
 title?: string;
 height?: number;
}

export const ChirpsTimeSeriesChart: React.FC<ChirpsTimeSeriesChartProps> = ({ 
 data, 
 title = "Time-Series Curah Hujan Harian CHIRPS", 
 height = 300 
}) => {
 // Aggregate to monthly/yearly if too many points?
 // Let's do simple downsampling if data > 1000 points to avoid SVG crash
 const chartData = data.length > 2000 
 ? data.filter((_, i) => i % Math.ceil(data.length / 2000) === 0) 
 : data;

 const maxRainfall = Math.max(...chartData.map(d => d.rainfall), 10);

 return (
 <Card className="p-4 border-l-4 border-l-pupr-blue bg-white dark:bg-slate-900">
 <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center justify-between">
 {title}
 <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-mono">
 N = {data.length} Hari
 </span>
 </h4>
 <div style={{ height, width: '100%' }}>
 <ResponsiveContainer>
 <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
 <XAxis 
 dataKey="date" 
 tick={{ fontSize: 10, fill: '#64748b' }} 
 tickFormatter={(val) => val.substring(0, 4)} 
 minTickGap={40}
 />
 <YAxis 
 tick={{ fontSize: 10, fill: '#64748b' }} 
 domain={[0, maxRainfall * 1.1]} 
 width={50}
 />
 <Tooltip 
 contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
 formatter={(value: number) => [`${value.toFixed(1)} mm`, 'Curah Hujan']}
 labelFormatter={(label) => `Tanggal: ${label}`}
 />
 <Line 
 type="monotone" 
 dataKey="rainfall" 
 stroke="#0ea5e9" 
 strokeWidth={1} 
 dot={false}
 activeDot={{ r: 4, fill: '#0c3a66', strokeWidth: 0 }}
 />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </Card>
 );
};
