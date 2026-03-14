import React, { useState } from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import {
 Mountain,
 CloudRain,
 Activity,
 CheckCircle2,
 LayoutDashboard,
 ChevronRight,
 RefreshCw
 } from 'lucide-react';
import { useOnboarding } from '@/providers/OnboardingProvider';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { StepMorfometri } from './steps/StepMorfometri';
import { StepHietograf } from './steps/StepHietograf';
import { StepMetodeBanjir } from './steps/StepMetodeBanjir';
import { StepRekapVisualisasi } from './steps/StepRekapVisualisasi';

type Step = 1 | 2 | 3 | 4;

interface StepConfig {
 id: Step;
 label: string;
 icon: React.ReactNode;
 description: string;
}

const STEPS: StepConfig[] = [
 {
 id: 1,
 label: 'Morfometri DAS',
 icon: <Mountain className="w-4 h-4" />,
 description: 'Parameter geometri'
 },
 {
 id: 2,
 label: 'Hietograf ABM',
 icon: <CloudRain className="w-4 h-4" />,
 description: 'Distribusi hujan'
 },
 {
 id: 3,
 label: 'Debit Banjir',
 icon: <Activity className="w-4 h-4" />,
 description: 'Simulasi HSS'
 },
 {
 id: 4,
 label: 'Rekap Analysis',
 icon: <LayoutDashboard className="w-4 h-4" />,
 description: 'Final output'
 }
];

interface FloodAnalysisRebuildProps {
 onConsultAI?: () => void;
}

export const FloodAnalysisRebuild: React.FC<FloodAnalysisRebuildProps> = ({ onConsultAI }) => {
 const [activeStep, setActiveStep] = useState<Step>(1);
 const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());

 const hydroState = useHydrologyStore();
 const { morfometriDAS, hujanEfektif, hasilBanjir, hasilKonvolusi } = hydroState;
 const { completeStep } = useOnboarding();

 React.useEffect(() => {
 const newCompleted = new Set<Step>();
 if ((morfometriDAS?.luasDAS || 0) > 0 && (morfometriDAS?.panjangSungai || 0) > 0) newCompleted.add(1);
 if (hujanEfektif && hujanEfektif.length > 0) newCompleted.add(2);
 if (hasilBanjir || (hydroState.distribusiHujanJamJaman && hydroState.distribusiHujanJamJaman.length > 0)) newCompleted.add(3);
 if (hasilKonvolusi && (hasilKonvolusi.peakDischarge || 0) > 0) {
 newCompleted.add(4);
 completeStep('banjir');
 }

 const currentIds = Array.from(completedSteps).sort().join(',');
 const newIds = Array.from(newCompleted).sort().join(',');
 if (currentIds !== newIds) setCompletedSteps(newCompleted);
 }, [morfometriDAS, hujanEfektif, hasilBanjir, hasilKonvolusi, hydroState.distribusiHujanJamJaman, completeStep, completedSteps]);

 const [selectedMethod, setSelectedMethod] = useState<string>('nakayasu');
 const [unitHydrograph, setUnitHydrograph] = useState<any[]>([]);

 const handleStepComplete = React.useCallback((step: Step) => {
 if (step < 4) setActiveStep((step + 1) as Step);
 }, []);

 const onMethodSelected = React.useCallback((method: string, hydro: any[]) => {
 setSelectedMethod(method);
 setUnitHydrograph(hydro);
 handleStepComplete(3);
 }, [handleStepComplete]);

 const completionPercentage = (completedSteps.size / STEPS.length) * 100;

 const handleReset = () => {
 if (window.confirm('⚠️ KONFIRMASI RESET: Anda yakin ingin menghapus seluruh parameter input banjir?')) {
 hydroState.resetAll();
 }
 };

 return (
 <ModuleLayout
 title="Flood Discharge Analysis"
 description="Penghitungan debit puncak hidrograf standar SNI 2415:2016"
 icon={<Activity className="w-6 h-6" />}
 iconColorClass="bg-pupr-surface text-pupr-blue"
 sniCode="SNI 2415:2016"
 actions={
 <div className="flex items-center gap-6">
 <div className="flex flex-col items-end">
 <div className="flex items-center gap-3">
 <span className="text-3xl font-light tabular-nums text-pupr-blue">{Math.round(completionPercentage)}%</span>
 <div className="w-32 h-1 bg-slate-100 rounded-sm overflow-hidden">
 <div 
 className="h-full bg-pupr-blue transition-all duration-75" 
 style={{ width: `${completionPercentage}%` }}
 />
 </div>
 </div>
 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Technical Readiness</span>
 </div>
 
 <button 
 onClick={handleReset}
 className="p-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-all border border-slate-200 dark:border-slate-700 group"
 title="Reset Module"
 >
 <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-75" />
 </button>
 </div>
 }
 >
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 py-4">
 {/* Navigation Sidebar: Distilled & Quieter */}
 <div className="lg:col-span-3 space-y-8">
 <nav className="space-y-1">
 <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Workflow</h3>
 {STEPS.map((step) => {
 const isActive = activeStep === step.id;
 const isCompleted = completedSteps.has(step.id);
 const isLocked = step.id > 1 && !completedSteps.has((step.id - 1) as Step);

 return (
 <button
 key={step.id}
 onClick={() => !isLocked && setActiveStep(step.id)}
 disabled={isLocked}
 className={`w-full text-left py-3 px-4 rounded-sm transition-all flex items-center justify-between group relative ${isActive
 ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
 : 'text-slate-500 hover:bg-slate-50 dark:bg-slate-800'
 } ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
 >
 {isActive && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-pupr-blue rounded-r-full" />}
 <div className="flex items-center gap-3">
 <div className={isActive ? 'text-pupr-blue' : isCompleted ? 'text-emerald-500' : 'text-slate-300'}>
 {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
 </div>
 <div>
 <p className={`text-xs font-bold leading-none mb-1 ${isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>{step.label}</p>
 <p className="text-[10px] text-slate-500 font-medium">{step.description}</p>
 </div>
 </div>
 {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
 </button>
 );
 })}
 </nav>

 <div className="pt-6 border-t border-slate-100">
 <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-tighter">
 <span>Ready for export</span>
 <span className="text-pupr-blue">{Math.round((completedSteps.size / STEPS.length) * 100)}%</span>
 </div>
 <div className="h-0.5 w-full bg-slate-100 rounded-sm overflow-hidden">
 <div
 className="h-full bg-pupr-blue transition-all duration-75"
 style={{ width: `${(completedSteps.size / STEPS.length) * 100}%` }}
 />
 </div>
 </div>

 {onConsultAI && (
 <button
 onClick={onConsultAI}
 className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm hover:bg-slate-100 transition-all flex items-center gap-3 group"
 >
 <div className="p-2 bg-white dark:bg-slate-900 rounded-sm text-pupr-blue border border-slate-100">
 <Activity className="w-4 h-4" />
 </div>
 <div className="text-left">
 <p className="text-xs font-bold text-slate-900 dark:text-slate-100">AI Consultant</p>
 <p className="text-[10px] text-slate-500 font-medium">Verify Compliance</p>
 </div>
 </button>
 )}
 </div>

 {/* Content Area: More whitespace */}
 <div className="lg:col-span-9 bg-white dark:bg-slate-900 min-h-[600px]">
 {activeStep === 1 && <StepMorfometri onComplete={() => handleStepComplete(1)} isCompleted={completedSteps.has(1)} />}
 {activeStep === 2 && <StepHietograf onComplete={() => handleStepComplete(2)} isCompleted={completedSteps.has(2)} />}
 {activeStep === 3 && <StepMetodeBanjir onComplete={onMethodSelected} isCompleted={completedSteps.has(3)} />}
 {activeStep === 4 && <StepRekapVisualisasi selectedMethod={selectedMethod} unitHydrograph={unitHydrograph} onComplete={() => handleStepComplete(4)} />}
 </div>
 </div>
 </ModuleLayout>
 );
};
