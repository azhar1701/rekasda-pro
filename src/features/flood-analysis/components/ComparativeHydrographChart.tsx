import React from 'react';
import {
 AreaChart,
 Area,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 Legend,
 ResponsiveContainer,
} from 'recharts';

interface HydrographDataPoint {
 time: number;
 [key: string]: number; // Dynamic discharge keys for multiple scenarios
}

interface ComparativeHydrographProps {
 data: HydrographDataPoint[];
 scenarios: {
 key: string;
 label: string;
 color: string;
 qPeak?: number;
 tPeak?: number;
 }[];
 title?: string;
 height?: number;
 showLegend?: boolean;
}

const CustomComparativeTooltip: React.FC<any> = ({ active, payload }) => {
 if (active && payload && payload.length > 0) {
 const data = payload[0].payload;
 return (
 <div className="bg-slate-900/85 text-white px-4 py-3 rounded-sm border border-slate-700/50 pointer-events-none">
 <p className="text-sm font-semibold text-slate-100 mb-2">
 Waktu: <span className="text-teal-300">{data.time.toFixed(1)}</span> jam
 </p>
 {payload.map((entry: any, idx: number) => (
 <p key={idx} className="text-sm font-semibold text-slate-100" style={{ color: entry.color }}>
 {entry.name}: <span>{entry.value.toFixed(2)}</span> m³/s
 </p>
 ))}
 </div>
 );
 }
 return null;
};

export const ComparativeHydrographChart: React.FC<ComparativeHydrographProps> = ({
 data,
 scenarios,
 title = 'Perbandingan Hidrograf',
 height = 450,
 showLegend = true,
}) => {


 return (
 <div className="w-full bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 hover: transition-shadow duration-75 overflow-hidden">
 {/* Header */}
 <div className="px-6 py-5 border-b border-slate-100 bg-pupr-blue text-white">
 <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
 <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
 Analisis perbandingan untuk berbagai kala ulang dan skenario
 </p>
 </div>

 {/* Chart Container */}
 <div className="px-6 py-4">
 <div style={{ width: '100%', height: `${height}px` }}>
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart
 data={data}
 margin={{ top: 10, right: 60, left: 0, bottom: 50 }}
 >
 <defs>
 {scenarios.map((scenario, idx) => (
 <linearGradient
 key={`gradient-${idx}`}
 id={`gradient-${scenario.key}`}
 x1="0"
 y1="0"
 x2="0"
 y2="1"
 >
 <stop offset="5%" stopColor={scenario.color} stopOpacity={0.6} />
 <stop offset="95%" stopColor={scenario.color} stopOpacity={0.02} />
 </linearGradient>
 ))}
 </defs>

 <CartesianGrid
 strokeDasharray="4 8"
 stroke="#cbd5e1"
 vertical={false}
 opacity={0.4}
 />

 <XAxis
 dataKey="time"
 label={{
 value: 'Waktu (jam)',
 position: 'bottom',
 offset: 10,
 style: { fontSize: '13px', fontWeight: 600, fill: '#64748b' },
 }}
 tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
 axisLine={false}
 tickLine={false}
 type="number"
 />

 <YAxis
 label={{
 value: 'Debit (m³/s)',
 angle: -90,
 position: 'insideLeft',
 offset: 10,
 style: { fontSize: '13px', fontWeight: 600, fill: '#64748b' },
 }}
 tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
 axisLine={false}
 tickLine={false}
 />

 {/* Area for each scenario */}
 {scenarios.map((scenario, idx) => (
 <Area
 key={`area-${idx}`}
 type="natural"
 dataKey={scenario.key}
 stroke={scenario.color}
 strokeWidth={2.5}
 fill={`url(#gradient-${scenario.key})`}
 name={scenario.label}
 isAnimationActive={true}
 animationDuration={800}
 dot={false}
 opacity={0.8}
 />
 ))}

 {/* Legend */}
 {showLegend && (
 <Legend
 wrapperStyle={{
 fontSize: '12px',
 fontWeight: 600,
 paddingTop: '20px',
 }}
 iconType="square"
 />
 )}

 <Tooltip
 content={<CustomComparativeTooltip />}
 cursor={{
 stroke: '#0d9488',
 strokeOpacity: 0.2,
 strokeWidth: 1,
 }}
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Statistics Table */}
 <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 dark:bg-slate-800 overflow-x-auto">
 <table className="w-full text-xs">
 <thead>
 <tr className="border-b-2 border-slate-200 dark:border-slate-700">
 <th className="text-left py-3 px-3 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Skenario</th>
 <th className="text-right py-3 px-3 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Q-Peak</th>
 <th className="text-right py-3 px-3 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">T-Peak</th>
 </tr>
 </thead>
 <tbody>
 {scenarios.map((scenario, idx) => (
 <tr key={idx} className="border-b border-slate-100 hover:bg-slate-100/80 transition-colors">
 <td className="py-3 px-3 tabular-nums tracking-tight">
 <div className="flex items-center gap-2">
 <div
 className="w-3 h-3 rounded"
 style={{ backgroundColor: scenario.color }}
 ></div>
 <span className="font-semibold text-slate-900 dark:text-slate-100">{scenario.label}</span>
 </div>
 </td>
 <td className="text-right py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 tabular-nums tracking-tight">
 {scenario.qPeak ? scenario.qPeak.toFixed(2) : '-'} <span className="text-slate-500 font-normal text-xs">m³/s</span>
 </td>
 <td className="text-right py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 tabular-nums tracking-tight">
 {scenario.tPeak ? scenario.tPeak.toFixed(1) : '-'} <span className="text-slate-500 font-normal text-xs">jam</span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Info */}
 <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800 text-center border-t border-slate-100">
 <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
 <span className="font-semibold text-slate-700 dark:text-slate-300">💡 Tips:</span> Analisis perbandingan membantu dalam perencanaan infrastruktur dan manajemen banjir
 </p>
 </div>
 </div>
 );
};

export default ComparativeHydrographChart;
