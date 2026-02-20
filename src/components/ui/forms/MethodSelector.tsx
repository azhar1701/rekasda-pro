import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface Method {
  id: string;
  name: string;
  description: string;
  recommended?: boolean;
}

interface MethodSelectorProps {
  methods: Method[];
  selected: string;
  onChange: (id: string) => void;
  title?: string;
  columns?: 1 | 2 | 3;
}

export const MethodSelector: React.FC<MethodSelectorProps> = ({ 
  methods, 
  selected, 
  onChange,
  title = 'Pilih Metode',
  columns = 2
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3'
  };

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
      <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 sm:mb-4">
        {title}
      </h2>
      <div className={`grid ${gridCols[columns]} gap-2`}>
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => onChange(method.id)}
            className={`relative p-3 rounded-lg border-2 text-left transition-all ${
              selected === method.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">{method.name}</div>
                <div className="text-xs text-slate-500 mt-1">{method.description}</div>
              </div>
              {method.recommended && (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
