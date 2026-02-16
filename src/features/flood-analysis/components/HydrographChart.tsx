import { useMemo } from 'react';
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
  TooltipProps,
} from 'recharts';

import { formatNumber } from '@/lib/utils/formatting';
import { CHART_COLORS } from '@/lib/constants';
import type { HydrographDataPoint } from '../types/flood.types';

interface HydrographChartProps {
  data: HydrographDataPoint[];
  qPeak?: number;
  tPeak?: number;
  title?: string;
  primaryColor?: string;
  height?: number;
  volume?: number;
  className?: string;
}

interface ChartMetrics {
  peakPoint: HydrographDataPoint | null;
  duration: number;
  dataPointCount: number;
  gradientId: string;
}

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>): JSX.Element | null => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload as HydrographDataPoint;

  return (
    <div className="bg-slate-900/85 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700/50">
      <p className="text-sm font-semibold text-slate-100">
        Waktu: <span className="text-teal-300">{data.time.toFixed(1)}</span> jam
      </p>
      <p className="text-sm font-semibold text-slate-100 mt-1">
        Debit: <span className="text-emerald-300">{formatNumber(data.discharge, 2)}</span> m³/s
      </p>
    </div>
  );
};

const calculateChartMetrics = (data: HydrographDataPoint[], componentId: string): ChartMetrics => {
  const peakPoint = data.length > 0
    ? data.reduce((max, point) => (point.discharge > max.discharge ? point : max))
    : null;

  return {
    peakPoint,
    duration: data.length > 0 ? data[data.length - 1].time : 0,
    dataPointCount: data.length,
    gradientId: `hydrograph-gradient-${componentId}`,
  };
};

export const HydrographChart = ({
  data,
  qPeak = 0,
  tPeak = 0,
  title = 'Hidrograf Banjir Rencana',
  primaryColor = CHART_COLORS.primary,
  height = 400,
  volume = 0,
  className = '',
}: HydrographChartProps): JSX.Element => {
  const componentId = useMemo(() => Math.random().toString(36).substring(2, 9), []);
  const metrics = useMemo<ChartMetrics>(() => calculateChartMetrics(data, componentId), [data, componentId]);

  const hasValidData = data.length > 0;
  const showPeakIndicators = qPeak > 0;

  return (
    <div className={`w-full bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden ${className}`}>
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-transparent">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            {volume > 0 && (
              <p className="text-sm text-slate-600 font-medium">
                <span className="text-slate-400">Volume:</span>{' '}
                <span className="font-semibold text-slate-800">{formatNumber(volume, 0)} juta m³</span>
              </p>
            )}
          </div>

          {showPeakIndicators && (
            <div className="grid grid-cols-2 gap-8 md:justify-end">
              <div className="text-center md:text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Q-Peak</p>
                <p className="text-3xl font-bold text-teal-600 leading-none">{formatNumber(qPeak, 2)}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">m³/s</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">T-Peak</p>
                <p className="text-3xl font-bold text-slate-700 leading-none">{tPeak.toFixed(1)}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">jam</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4">
        <div style={{ width: '100%', height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 30, right: 30, left: 0, bottom: 30 }}>
              <defs>
                <linearGradient id={metrics.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.7} />
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="4 8" stroke="#cbd5e1" vertical={false} opacity={0.4} />

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

              <Area
                type="natural"
                dataKey="discharge"
                stroke={primaryColor}
                strokeWidth={3}
                fill={`url(#${metrics.gradientId})`}
                isAnimationActive={true}
                animationDuration={800}
                dot={false}
              />

              {showPeakIndicators && (
                <ReferenceLine
                  y={qPeak}
                  stroke="#f97316"
                  strokeDasharray="5 5"
                  opacity={0.3}
                  label={{
                    value: `Max: ${formatNumber(qPeak, 2)} m³/s`,
                    position: 'insideRight',
                    fill: '#f97316',
                    fontSize: 11,
                    fontWeight: 600,
                    offset: -10,
                  }}
                />
              )}

              {metrics.peakPoint && (
                <ReferenceDot
                  x={metrics.peakPoint.time}
                  y={metrics.peakPoint.discharge}
                  r={6}
                  fill={primaryColor}
                  stroke="white"
                  strokeWidth={2}
                />
              )}

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: primaryColor, strokeOpacity: 0.3, strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {hasValidData && (
        <div className="px-6 py-2 border-t border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-3 gap-6 items-center">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Durasi</p>
              <p className="text-sm font-semibold text-slate-900 mt-2">
                {metrics.duration.toFixed(1)} <span className="text-xs font-medium text-slate-600">jam</span>
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Data Points</p>
              <p className="text-sm font-semibold text-slate-900 mt-2">
                {metrics.dataPointCount} <span className="text-xs font-medium text-slate-600">titik</span>
              </p>
            </div>

            <div className="text-right flex items-center justify-end gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: primaryColor, opacity: 0.7 }} />
              <span className="text-xs font-medium text-slate-600">Area hydrograf</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
