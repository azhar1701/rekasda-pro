import React from 'react';
import { DistributionMethod } from '../FrequencyAnalysisModal';

interface MethodSelectorProps {
  method: DistributionMethod;
  onChange: (method: DistributionMethod) => void;
}

const methods: { id: DistributionMethod; label: string }[] = [
  { id: 'gumbel', label: 'Gumbel' },
  { id: 'normal', label: 'Normal' },
  { id: 'log-pearson-iii', label: 'Log Pearson III' },
  { id: 'log-normal', label: 'Log-Normal' }
];

export const MethodSelector: React.FC<MethodSelectorProps> = ({ method, onChange }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-700">Metode Distribusi</h3>
      <div className="grid grid-cols-2 gap-3">
        {methods.map((m) => (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all ${
              method === m.id
                ? 'border-teal-600 text-teal-600 bg-teal-50'
                : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
};
