import React from 'react';
import { Lock } from 'lucide-react';

interface InputReadonlyProps {
  label: string;
  value: string | number;
  unit?: string;
  source?: string;
  className?: string;
}

export const InputReadonly: React.FC<InputReadonlyProps> = ({
  label,
  value,
  unit,
  source,
  className = ''
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={`${value}${unit ? ` ${unit}` : ''}`}
          readOnly
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold cursor-not-allowed"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
      {source && (
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
          <span className="font-medium">Sumber:</span> {source}
        </p>
      )}
    </div>
  );
};
