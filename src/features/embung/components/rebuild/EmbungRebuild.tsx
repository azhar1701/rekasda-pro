import React from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Droplets, Beaker, Spline, Activity, Waves, Database, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useEmbungStore, EmbungProvider } from '../../hooks/useEmbungStore';
import { Button } from '@/components/ui/Button';

// Step Components
import { StepGeometry } from './steps/StepGeometry';
import { StepCapacity } from './steps/StepCapacity';
import { StepRouting } from './steps/StepRouting';
import { StepOperation } from './steps/StepOperation';
import { StepSediment } from './steps/StepSediment';

const STEPS = [
 { id: 'geometry', title: 'Geometri', icon: <Beaker className="w-4 h-4" />, description: 'Stage-Storage-Area' },
 { id: 'capacity', title: 'Kapasitas', icon: <Spline className="w-4 h-4" />, description: 'Metode Rippl' },
 { id: 'routing', title: 'Routing', icon: <Activity className="w-4 h-4" />, description: 'Penelusuran Banjir' },
 { id: 'operation', title: 'Pola Operasi', icon: <Waves className="w-4 h-4" />, description: 'Water Balance' },
 { id: 'sediment', title: 'Sedimentasi', icon: <Database className="w-4 h-4" />, description: 'Umur Guna' },
] as const;

export const EmbungRebuildMain: React.FC = () => {
 const { state, dispatch } = useEmbungStore();
 const currentStepIndex = STEPS.findIndex(s => s.id === state.activeTab);

 const handleNext = () => {
 if (currentStepIndex < STEPS.length - 1) {
 dispatch({ type: 'SET_ACTIVE_TAB', payload: STEPS[currentStepIndex + 1].id });
 }
 };

 const handleBack = () => {
 if (currentStepIndex > 0) {
 dispatch({ type: 'SET_ACTIVE_TAB', payload: STEPS[currentStepIndex - 1].id });
 }
 };

 return (
 <ModuleLayout
 title="Manajemen Situ & Embung"
 description="Desain & Analisis terpadu berdasarkan Standar Perencanaan Embung (Guidance Workflow)"
 icon={<Droplets className="w-6 h-6" />}
 
 sniCode="Pd T-07-2004-A"
 >
 <div className="flex flex-col h-full gap-6">
 {/* Professional Engineering Tabs */}
 <div className="border-b border-slate-300 dark:border-slate-700 overflow-x-auto scrollbar-hide">
 <div className="flex gap-0 min-w-max">
 {STEPS.map((step, idx) => {
 const isActive = state.activeTab === step.id;
 const isCompleted = currentStepIndex > idx;

 return (
 <button
 key={step.id}
 onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: step.id })}
 className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all border-b-4 ${isActive
 ? 'text-pupr-blue border-pupr-yellow bg-slate-50 dark:bg-slate-800'
 : 'text-slate-500 border-transparent hover:text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800'
 }`}
 >
 {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className={isActive ? 'text-pupr-blue' : 'text-slate-500'}>{step.icon}</div>}
 <span>{step.title}</span>
 </button>
 );
 })}
 </div>
 </div>

 {/* Step Content Area */}
 <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden flex flex-col">
 <div className="flex-1 overflow-auto p-6">
 {state.activeTab === 'geometry' && <StepGeometry />}
 {state.activeTab === 'capacity' && <StepCapacity />}
 {state.activeTab === 'routing' && <StepRouting />}
 {state.activeTab === 'operation' && <StepOperation />}
 {state.activeTab === 'sediment' && <StepSediment />}
 </div>

 {/* Navigation Footer */}
 <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
 <Button
 variant="outline"
 onClick={handleBack}
 disabled={currentStepIndex === 0}
 className="text-slate-600 dark:text-slate-500"
 >
 <ChevronLeft className="w-4 h-4 mr-2" />
 Kembali
 </Button>

 <div className="flex items-center gap-3">
 <span className="text-xs font-medium text-slate-500">
 Langkah {currentStepIndex + 1} dari {STEPS.length}
 </span>
 <Button
 onClick={handleNext}
 disabled={currentStepIndex === STEPS.length - 1}
 className="bg-pupr-blue hover:bg-teal-700 text-white"
 >
 {currentStepIndex === STEPS.length - 1 ? 'Selesai' : 'Lanjut'}
 <ChevronRight className="w-4 h-4 ml-2" />
 </Button>
 </div>
 </div>
 </div>
 </div>
 </ModuleLayout>
 );
};

export const EmbungRebuild: React.FC = () => (
 <EmbungProvider>
 <EmbungRebuildMain />
 </EmbungProvider>
);
