import React, { useState } from 'react';
import { FloodAnalysisRebuild } from './rebuild/FloodAnalysisRebuild';
import { ModulBanjirRencana } from './ModulBanjirRencana';
import { FloodDischargeCalculator } from './FloodDischargeCalculator';
import { Layers, Activity, Calculator } from 'lucide-react';

interface FloodAnalysisTabProps {
  onConsultAI?: () => void;
}

type FloodMode = 'workflow' | 'multi' | 'calculator';

export const FloodAnalysisTab: React.FC<FloodAnalysisTabProps> = ({ onConsultAI }) => {
  const [activeMode, setActiveMode] = useState<FloodMode>('workflow');

  return (
    <div className="space-y-4">
      {/* Mode Switcher / Sub-navigation bar */}
      <div className="bg-white border border-slate-200 rounded-md p-2 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveMode('workflow')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm transition-all ${
              activeMode === 'workflow'
                ? 'bg-pupr-blue text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Workflow Bertahap (SNI 4-Langkah)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('multi')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm transition-all ${
              activeMode === 'multi'
                ? 'bg-pupr-blue text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Multi-Metode Cepat (9 Metode)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('calculator')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm transition-all ${
              activeMode === 'calculator'
                ? 'bg-pupr-blue text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Kalkulator Split-Screen & Whitebox</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-2">
          Standar: <span className="font-bold text-slate-700">SNI 2415:2016</span>
        </div>
      </div>

      {/* Render Active Module */}
      {activeMode === 'workflow' && <FloodAnalysisRebuild onConsultAI={onConsultAI} />}
      {activeMode === 'multi' && <ModulBanjirRencana onConsultAI={onConsultAI} />}
      {activeMode === 'calculator' && <FloodDischargeCalculator onConsultAI={onConsultAI} />}
    </div>
  );
};

export default FloodAnalysisTab;
