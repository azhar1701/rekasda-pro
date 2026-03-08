import React from 'react';

interface ResultCardProps {
  title: string;
  value: number;
  unit: string;
  icon?: React.ReactNode;
  description?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  title,
  value,
  unit,
  icon,
  description
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3 text-slate-500">
        {icon}
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-5xl font-extrabold text-slate-900">{value.toFixed(2)}</div>
        <div className="text-lg font-bold text-slate-500">{unit}</div>
      </div>
      {description && (
        <p className="text-xs text-slate-400 mt-2">{description}</p>
      )}
    </div>
  );
};
