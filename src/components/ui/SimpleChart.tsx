import React from 'react';

interface ChartDataPoint {
  name: string;
  value: number;
}

interface SimpleChartProps {
  title: string;
  description?: string;
  data: ChartDataPoint[];
  color?: string;
}

/**
 * Simple chart component for displaying data
 * Can be extended with recharts or visx for more advanced features
 */
export const SimpleChart: React.FC<SimpleChartProps> = ({
  title,
  description,
  data,
  color = 'teal',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-50 rounded-lg p-8 text-center">
        <p className="text-slate-500 text-sm">No data available for {title}</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const colorMap = {
    teal: 'bg-teal-600',
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-600',
    slate: 'bg-slate-600',
  };

  const colorClass = colorMap[color as keyof typeof colorMap] || colorMap.teal;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        {/* Y-Axis Label */}
        <div className="flex items-end justify-between gap-4 h-64">
          {/* Axis */}
          <div className="flex flex-col justify-between text-right pr-2 text-xs text-slate-400 h-full min-w-max">
            <span>{Math.round(maxValue)}</span>
            <span>{Math.round(maxValue / 2)}</span>
            <span>0</span>
          </div>

          {/* Bars/Lines */}
          <div className="flex items-end justify-between gap-2 flex-1 h-full">
            {data.map((item, idx) => {
              const heightPercent = (item.value / maxValue) * 100;
              return (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div className="w-full flex justify-center mb-2">
                    <div
                      className={`${colorClass} rounded-t-md transition-all hover:opacity-80 w-full`}
                      style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                      title={`${item.name}: ${item.value}`}
                    />
                  </div>
                  <span className="text-xs text-slate-600 truncate text-center w-full">
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* X-Axis Label */}
        <div className="text-xs text-slate-500 text-center mt-4">Item</div>
      </div>
    </div>
  );
};
