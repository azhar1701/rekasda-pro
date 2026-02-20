import React, { useState } from 'react';
import { TrendingUp, Activity } from 'lucide-react';
import { PeakDischargeCalculator } from './PeakDischargeCalculator';
import { HydrographCalculator } from './HydrographCalculator';

type AnalysisMode = 'empiris' | 'hss';

interface FloodAnalysisTabProps {
  onConsultAI: () => void;
}

export const FloodAnalysisTab: React.FC<FloodAnalysisTabProps> = ({ onConsultAI }) => {
  const [mode, setMode] = useState<AnalysisMode>('empiris');

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 flex gap-1">
        <button
          onClick={() => setMode('empiris')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
            mode === 'empiris'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <div className="text-left">
            <div className="text-sm font-bold">Debit Puncak</div>
            <div className="text-xs opacity-90">Metode Empiris</div>
          </div>
        </button>
        <button
          onClick={() => setMode('hss')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
            mode === 'hss'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-5 h-5" />
          <div className="text-left">
            <div className="text-sm font-bold">Hidrograf Banjir</div>
            <div className="text-xs opacity-90">Metode HSS</div>
          </div>
        </button>
      </div>

      {/* Content */}
      {mode === 'empiris' ? (
        <PeakDischargeCalculator onConsultAI={onConsultAI} />
      ) : (
        <HydrographCalculator onConsultAI={onConsultAI} />
      )}
    </div>
  );
};
