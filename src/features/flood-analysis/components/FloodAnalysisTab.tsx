import React, { useState } from 'react';
import { TrendingUp, Activity } from 'lucide-react';
import { PeakDischargeCalculator } from './PeakDischargeCalculator';
import { HydrographCalculator } from './HydrographCalculator';

interface FloodAnalysisTabProps {
  onConsultAI: () => void;
}

type FloodMode = 'peak' | 'hydrograph';

export const FloodAnalysisTab: React.FC<FloodAnalysisTabProps> = ({ onConsultAI }) => {
  const [mode, setMode] = useState<FloodMode>('peak');

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="max-w-[1600px] mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Analisis Debit Banjir Rencana</h1>
        <p className="text-xs sm:text-sm text-neutral-600 mt-1">Perhitungan debit puncak dengan metode empiris & hidrograf satuan sintetik • SNI 2415:2016</p>
      </div>

      {/* Mode Selector */}
      <div className="glass-card rounded-xl shadow-lg border border-white/20 p-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode('peak')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
              mode === 'peak'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="hidden sm:inline">Debit Puncak (Metode Empiris)</span>
            <span className="sm:hidden">Debit Puncak</span>
          </button>
          <button
            onClick={() => setMode('hydrograph')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
              mode === 'hydrograph'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="hidden sm:inline">Hidrograf Banjir (Metode HSS)</span>
            <span className="sm:hidden">Hidrograf</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
      {mode === 'peak' ? (
        <PeakDischargeCalculator onConsultAI={onConsultAI} />
      ) : (
        <HydrographCalculator onConsultAI={onConsultAI} />
      )}
      </div>
    </div>
    </div>
  );
};
