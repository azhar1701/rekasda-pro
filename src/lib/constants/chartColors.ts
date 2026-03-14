/**
 * Chart Color System — SSOT for all Recharts visualizations
 * Synced with tailwind.config.js chart tokens
 */

export const CHART_COLORS = {
  primary: '#2563EB',
  secondary: '#10B981',
  tertiary: '#F59E0B',
  quaternary: '#8B5CF6',
  quinary: '#EC4899',
  inflow: '#2563EB',
  outflow: '#EF4444',
  surplus: '#10B981',
  deficit: '#EF4444',
  rainfall: '#3B82F6',
  discharge: '#0C3A66',
  demand: '#F97316',
  supply: '#06B6D4',
  capacity: '#8B5CF6',
  hydrograph: '#2563EB',
  baseflow: '#94A3B8',
  peakFlow: '#DC2626',
  danger: '#DC2626',
  gridLine: '#E2E8F0',
  axisLine: '#94A3B8',
  referenceLine: '#CBD5E1',
  tooltip: '#1E293B',
} as const;

export const CHART_SERIES_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  CHART_COLORS.quaternary,
  CHART_COLORS.quinary,
] as const;

export const getSeriesColor = (index: number): string => {
  return CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length];
};
