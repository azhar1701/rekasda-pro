import React from 'react';

interface ResultCardProps {
  title: string;
  value: number;
  unit: string;
  icon?: React.ReactNode;
  gradient?: string;
  description?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({ 
  title, 
  value, 
  unit, 
  icon,
  gradient = 'from-blue-500 to-blue-600',
  description 
}) => {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-md`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-bold uppercase tracking-wide opacity-90">{title}</h3>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-5xl font-black">{value.toFixed(2)}</div>
        <div className="text-lg font-bold opacity-80">{unit}</div>
      </div>
      {description && (
        <p className="text-xs opacity-75 mt-2">{description}</p>
      )}
    </div>
  );
};
