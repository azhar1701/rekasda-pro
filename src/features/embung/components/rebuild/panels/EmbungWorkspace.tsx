import React from 'react';
import { useEmbungStore } from '../../../hooks/useEmbungStore';
import { 
  Table, 
  Activity,
  Box,
  Compass,
  RefreshCcw
} from 'lucide-react';

// Re-using existing step components as workspace views
import { StepGeometry } from '../steps/StepGeometry';
import { StepCapacity } from '../steps/StepCapacity';
import { StepRouting } from '../steps/StepRouting';
import { StepOperation } from '../steps/StepOperation';
import { StepSediment } from '../steps/StepSediment';

type TabType = 'geometry' | 'capacity' | 'routing' | 'operation' | 'sediment';

const TABS: { id: TabType, label: string, icon: any }[] = [
  { id: 'geometry', label: 'Lengkung Kapasitas', icon: Compass },
  { id: 'capacity', label: 'Kebutuhan Tampungan', icon: Table },
  { id: 'routing', label: 'Penelusuran Banjir', icon: Activity },
  { id: 'operation', label: 'Pola Operasi', icon: RefreshCcw },
  { id: 'sediment', label: 'Sedimentasi', icon: Box },
];

export const EmbungWorkspace: React.FC = () => {
  const { state, dispatch } = useEmbungStore();
  const activeTab = state.activeTab;

  const setTab = (tab: TabType) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Workspace Tab Bar */}
      <div className="flex items-center px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 border-b-2 transition-all whitespace-nowrap ${
                isActive 
                  ? 'border-pupr-blue text-pupr-blue bg-pupr-surface/10' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-pupr-blue' : 'text-slate-400'}`} />
              <span className={`text-[11px] font-black uppercase tracking-wider ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Viewport Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {activeTab === 'geometry' && <StepGeometry />}
          {activeTab === 'capacity' && <StepCapacity />}
          {activeTab === 'routing' && <StepRouting />}
          {activeTab === 'operation' && <StepOperation />}
          {activeTab === 'sediment' && <StepSediment />}
        </div>
      </div>

      {/* Audit Footer */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            Engine: Live
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-pupr-blue"></div>
            Standard: Pd T-07-2004-A
          </div>
        </div>
        <div className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2">
          Workspace Mode: 
          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-pupr-blue tracking-tighter">
            PRO-GRADE AUDIT
          </span>
        </div>
      </div>
    </div>
  );
};
