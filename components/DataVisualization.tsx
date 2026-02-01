import React from 'react';
import { CalculationResult, CalculationType } from '../types';

interface DataVisualizationProps {
  data: CalculationResult[];
  className?: string;
}

export const DataVisualization: React.FC<DataVisualizationProps> = ({ data, className = '' }) => {
  const manningData = data.filter(d => d.type === CalculationType.MANNING);
  const rationalData = data.filter(d => d.type === CalculationType.RATIONAL);

  const getDischargeValues = (items: CalculationResult[]) => {
    return items.map(item => parseFloat(item.outputs.Discharge as string) || 0);
  };

  const manningDischarges = getDischargeValues(manningData);
  const rationalDischarges = getDischargeValues(rationalData);

  const allDischarges = [...manningDischarges, ...rationalDischarges];
  const maxDischarge = Math.max(...allDischarges, 1);
  const minDischarge = Math.min(...allDischarges, 0);

  const SimpleBarChart: React.FC<{ values: number[]; color: string; label: string }> = ({ values, color, label }) => {
    if (values.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-slate-700">{label}</h4>
          <span className="text-xs text-slate-500">{values.length} data</span>
        </div>
        <div className="space-y-1">
          {values.slice(0, 10).map((value, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-8 text-xs text-slate-500 text-right">{index + 1}</div>
              <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full ${color} transition-all duration-500 ease-out`}
                  style={{ width: `${(value / maxDischarge) * 100}%` }}
                />
              </div>
              <div className="w-16 text-xs text-slate-700 font-mono">{value.toFixed(2)}</div>
            </div>
          ))}
          {values.length > 10 && (
            <div className="text-xs text-slate-400 text-center py-1">
              +{values.length - 10} data lainnya
            </div>
          )}
        </div>
      </div>
    );
  };

  const StatCard: React.FC<{ title: string; value: string; subtitle?: string; color: string }> = ({ 
    title, value, subtitle, color 
  }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-100">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <h3 className="text-sm font-medium text-slate-600">{title}</h3>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
    </div>
  );

  if (data.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-slate-500 text-sm">Belum ada data untuk divisualisasikan</p>
      </div>
    );
  }

  const avgManning = manningDischarges.length > 0 
    ? (manningDischarges.reduce((a, b) => a + b, 0) / manningDischarges.length).toFixed(2)
    : '0.00';
  
  const avgRational = rationalDischarges.length > 0
    ? (rationalDischarges.reduce((a, b) => a + b, 0) / rationalDischarges.length).toFixed(2)
    : '0.00';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Data"
          value={data.length.toString()}
          subtitle="Perhitungan tersimpan"
          color="bg-blue-500"
        />
        <StatCard
          title="Manning"
          value={manningData.length.toString()}
          subtitle={`Avg: ${avgManning} m³/s`}
          color="bg-blue-500"
        />
        <StatCard
          title="Rational"
          value={rationalData.length.toString()}
          subtitle={`Avg: ${avgRational} m³/s`}
          color="bg-red-500"
        />
        <StatCard
          title="Max Debit"
          value={`${maxDischarge.toFixed(2)}`}
          subtitle="m³/s"
          color="bg-green-500"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100">
          <SimpleBarChart
            values={manningDischarges}
            color="bg-blue-500"
            label="Debit Manning (m³/s)"
          />
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100">
          <SimpleBarChart
            values={rationalDischarges}
            color="bg-red-500"
            label="Debit Rational (m³/s)"
          />
        </div>
      </div>

      {/* Distribution */}
      <div className="bg-white p-6 rounded-xl border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Distribusi Data</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Manning vs Rational</span>
            <span className="text-xs text-slate-500">
              {((manningData.length / data.length) * 100).toFixed(1)}% : {((rationalData.length / data.length) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex h-4 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 transition-all duration-500"
              style={{ width: `${(manningData.length / data.length) * 100}%` }}
            />
            <div
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${(rationalData.length / data.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Manning ({manningData.length})</span>
            <span>Rational ({rationalData.length})</span>
          </div>
        </div>
      </div>
    </div>
  );
};