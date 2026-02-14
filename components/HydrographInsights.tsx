import React, { useMemo } from 'react';
import { TrendingUp, Activity, Clock, Volume2 } from 'lucide-react';

interface HydrographDataPoint {
  time: number;
  discharge: number;
}

interface HydrographInsightsProps {
  data: HydrographDataPoint[];
  qPeak: number;
  tPeak: number;
  volume: number;
  unit?: string;
}

interface Statistic {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'teal' | 'blue' | 'emerald' | 'orange';
  unit: string;
  description?: string;
}

export const HydrographInsights: React.FC<HydrographInsightsProps> = ({
  data,
  qPeak,
  tPeak,
  volume,
  unit = 'm³/s',
}) => {
  const statistics = useMemo(() => {
    const stats: Statistic[] = [];

    if (qPeak > 0) {
      stats.push({
        label: 'Debit Puncak',
        value: qPeak.toFixed(2),
        unit: unit,
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'teal',
        description: 'Nilai debit maksimal pada hidrograf',
      });
    }

    if (tPeak > 0) {
      stats.push({
        label: 'Waktu Puncak',
        value: tPeak.toFixed(1),
        unit: 'jam',
        icon: <Clock className="w-5 h-5" />,
        color: 'blue',
        description: 'Waktu mencapai debit puncak',
      });
    }

    if (volume > 0) {
      stats.push({
        label: 'Volume Total',
        value: volume.toFixed(0),
        unit: 'juta m³',
        icon: <Volume2 className="w-5 h-5" />,
        color: 'emerald',
        description: 'Total volume air dalam hidrograf',
      });
    }

    // Add duration
    if (data.length > 0) {
      const duration = data[data.length - 1].time;

      stats.push({
        label: 'Durasi Total',
        value: duration.toFixed(1),
        unit: 'jam',
        icon: <Activity className="w-5 h-5" />,
        color: 'orange',
        description: 'Lama terjadinya aliran banjir',
      });
    }

    return stats;
  }, [qPeak, tPeak, volume, data, unit]);

  const colorMap = {
    teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', icon: 'text-teal-600' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-600' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-600' },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statistics.map((stat, idx) => {
        const colors = colorMap[stat.color];
        return (
          <div
            key={idx}
            className={`${colors.bg} border ${colors.border} rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:scale-105`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`${colors.icon} p-2 rounded-lg bg-white`}>
                {stat.icon}
              </div>
              <span className={`text-xs font-bold uppercase tracking-wide ${colors.text} opacity-60`}>
                {stat.unit}
              </span>
            </div>
            <h3 className={`text-xs font-medium ${colors.text} uppercase tracking-wider mb-2 opacity-75`}>
              {stat.label}
            </h3>
            <p className={`text-3xl font-bold ${colors.text} mb-2`}>
              {stat.value}
            </p>
            {stat.description && (
              <p className={`text-xs ${colors.text} opacity-60 leading-snug`}>
                {stat.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HydrographInsights;
