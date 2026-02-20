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
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Analisis Banjir</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Perhitungan debit puncak dan hidrograf banjir rencana</p>
        </div>

        {/* Mode Selector */}
        <div className="mb-4 sm:mb-6">
          <div className="flex gap-2 p-2 bg-slate-100 rounded-xl">
            <button
              onClick={() => setMode('empiris')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                mode === 'empiris'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              <div className="text-left">
                <div className="font-bold">Debit Puncak</div>
                <div className="text-[10px] sm:text-xs opacity-80">Metode Empiris</div>
              </div>
            </button>
            <button
              onClick={() => setMode('hss')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                mode === 'hss'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              <div className="text-left">
                <div className="font-bold">Hidrograf Banjir</div>
                <div className="text-[10px] sm:text-xs opacity-80">Metode HSS</div>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        {mode === 'empiris' ? (
          <PeakDischargeCalculator onConsultAI={onConsultAI} />
        ) : (
          <HydrographCalculator onConsultAI={onConsultAI} />
        )}
      </div>
    </div>
  );
};
