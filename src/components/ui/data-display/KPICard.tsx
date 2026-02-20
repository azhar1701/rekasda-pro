import React from 'react';

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'slate';
  tooltip?: string;
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-emerald-100 text-emerald-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
  teal: 'bg-teal-100 text-teal-600',
  slate: 'bg-slate-100 text-slate-600'
};

const valueColorClasses = {
  blue: 'text-blue-600',
  green: 'text-emerald-600',
  purple: 'text-purple-600',
  orange: 'text-orange-600',
  teal: 'text-teal-600',
  slate: 'text-slate-600'
};

export const KPICard: React.FC<KPICardProps> = ({ 
  label, 
  value, 
  unit, 
  icon, 
  color = 'blue',
  tooltip 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 group relative">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
          {label}
          {tooltip && (
            <>
              <svg className="w-3 h-3 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                {tooltip}
              </div>
            </>
          )}
        </span>
        {icon && (
          <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
            {icon}
          </div>
        )}
      </div>
      <div className={`text-3xl font-bold ${valueColorClasses[color]} font-mono`}>
        {typeof value === 'number' ? value.toFixed(2) : value}
      </div>
      {unit && <div className="text-xs text-slate-500 font-medium mt-1">{unit}</div>}
    </div>
  );
};
