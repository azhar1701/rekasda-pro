import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
} from 'recharts';

interface HydrographDataPoint {
  time: number;
  discharge: number;
}

interface FloodHydrographChartProps {
  data: HydrographDataPoint[];
  secondaryData?: HydrographDataPoint[];
  qPeak?: number;
  tPeak?: number;
  title?: string;
  primaryColor?: string;
  height?: number;
  volume?: number;
}

// Custom Tooltip Component
const CustomHydrographTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-2xl border border-white/10 pointer-events-none z-50 min-w-[160px]">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-white/10 pb-1">
          Waktu: <span className="text-white">{payload[0].payload.time.toFixed(1)} jam</span>
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill }}></div>
                <span className="text-xs font-medium text-slate-300">{entry.name}:</span>
              </div>
              <span className="text-xs font-bold text-white">{entry.value.toFixed(3)} <span className="text-[10px] text-slate-400 font-normal">m³/s</span></span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const FloodHydrographChart: React.FC<FloodHydrographChartProps> = ({
  data,
  secondaryData,
  qPeak = 0,
  tPeak = 0,
  title = 'Hidrograf Banjir Rencana',
  primaryColor = '#0d9488',
  height = 400,
  volume = 0,
}) => {
  // Find peak point in data for annotation
  const peakPoint = useMemo(() => {
    if (data.length === 0) return null;
    const maxPoint = data.reduce((max, point) =>
      point.discharge > max.discharge ? point : max
    );
    return maxPoint;
  }, [data]);

  // Calculate gradient ID to ensure uniqueness
  const gradientId = `hydrograph-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-transparent">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left: Title & Volume */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {title}
              {secondaryData && (
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                  Dual Series
                </span>
              )}
            </h3>
            {volume > 0 && (
              <p className="text-sm text-slate-600 font-medium mt-1">
                <span className="text-slate-400">Total Volume:</span> <span className="font-semibold text-slate-800">{(volume / 1000).toFixed(2)} ribu m³</span>
              </p>
            )}
          </div>

          {/* Right: Q-Peak & T-Peak */}
          {qPeak > 0 && (
            <div className="grid grid-cols-2 gap-8 md:justify-end">
              <div className="text-center md:text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Debit Puncak</p>
                <div className="flex items-baseline md:justify-end gap-1">
                  <span className="text-3xl font-black text-teal-600 leading-none tracking-tight">{qPeak.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">m³/s</span>
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Waktu Puncak</p>
                <div className="flex items-baseline md:justify-end gap-1">
                  <span className="text-3xl font-black text-slate-800 leading-none tracking-tight">{tPeak.toFixed(1)}</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Jam</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart Container */}
      <div className="px-6 py-4">
        <div style={{ width: '100%', height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 30, right: 30, left: 0, bottom: 30 }}
            >
              {/* Define Gradient */}
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Grid */}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                vertical={false}
              />

              {/* X Axis */}
              <XAxis
                dataKey="time"
                label={{
                  value: 'Waktu (jam)',
                  position: 'bottom',
                  offset: 0,
                  style: { fontSize: '11px', fontWeight: 700, fill: '#64748b' },
                }}
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                type="number"
                domain={['auto', 'auto']}
              />

              {/* Y Axis */}
              <YAxis
                label={{
                  value: 'Debit (m³/s)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 15,
                  style: { fontSize: '11px', fontWeight: 700, fill: '#64748b' },
                }}
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />

              {/* Secondary Area (Unit Hydrograph) */}
              {secondaryData && (
                <Area
                  data={secondaryData}
                  name="Unit Hydrograph"
                  type="monotone"
                  dataKey="discharge"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="none"
                  isAnimationActive={false}
                  dot={false}
                />
              )}

              {/* Area - Main hydrograph (DFH) */}
              <Area
                name={secondaryData ? 'Design Flood Hydrograph' : 'Hydrograph'}
                type="monotone"
                dataKey="discharge"
                stroke={primaryColor}
                strokeWidth={3}
                fill={`url(#${gradientId})`}
                isAnimationActive={true}
                animationDuration={1000}
                dot={false}
              />

              {/* Reference line at peak discharge */}
              {qPeak > 0 && (
                <ReferenceLine
                  y={qPeak}
                  stroke="#f97316"
                  strokeDasharray="5 5"
                  opacity={0.4}
                  label={{
                    value: `Qp: ${qPeak.toFixed(2)}`,
                    position: 'insideRight',
                    fill: '#f97316',
                    fontSize: 10,
                    fontWeight: 700,
                    offset: -10,
                  }}
                />
              )}

              {/* Peak point indicator */}
              {peakPoint && (
                <ReferenceDot
                  x={peakPoint.time}
                  y={peakPoint.discharge}
                  r={5}
                  fill={primaryColor}
                  stroke="white"
                  strokeWidth={2}
                />
              )}

              {/* Custom Tooltip */}
              <Tooltip
                content={<CustomHydrographTooltip />}
                cursor={{
                  stroke: primaryColor,
                  strokeOpacity: 0.2,
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Durasi Total</p>
            <p className="text-sm font-black text-slate-800 mt-1">
              {data.length > 0 ? data[data.length - 1].time.toFixed(1) : 0} <span className="text-[10px] font-bold text-slate-500">jam</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resolusi</p>
            <p className="text-sm font-black text-slate-800 mt-1">
              {data.length} <span className="text-[10px] font-bold text-slate-500">titik</span>
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 py-1 px-3 bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: primaryColor }}></div>
            <span className="text-[10px] font-bold text-slate-600 uppercase">DFH (Konvolusi)</span>
          </div>
          {secondaryData && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-slate-400 rounded-full"></div>
              <span className="text-[10px] font-bold text-slate-600 uppercase">Unit Hydrograph</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FloodHydrographChart;
