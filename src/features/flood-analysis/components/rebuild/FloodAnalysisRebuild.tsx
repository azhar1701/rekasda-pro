import React, { useState } from 'react';
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
 { id: 1, label: 'Morfometri DAS', icon: <Mountain className="w-4 h-4" />, description: 'Parameter geometri' },
 { id: 2, label: 'Hietograf ABM', icon: <CloudRain className="w-4 h-4" />, description: 'Distribusi hujan' },
 { id: 3, label: 'Debit Banjir', icon: <Activity className="w-4 h-4" />, description: 'Simulasi HSS' },
 { id: 4, label: 'Rekap Analysis', icon: <LayoutDashboard className="w-4 h-4" />, description: 'Final output' },
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
 <div className="space-y-8 p-1">
  {/* ── Page Header (MasterHidrologiTab pattern) ── */}
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
  <div>
   <h2 className="text-3xl font-medium text-[#1e293b] tracking-tight">Debit Banjir Rencana</h2>
   <p className="text-sm text-slate-500 mt-1">Penghitungan debit puncak hidrograf — SNI 2415:2016</p>
  </div>
  <div className="flex items-center gap-6">
   <div className="flex flex-col items-end">
   <div className="flex items-center gap-3">
    <span className="text-3xl font-light tabular-nums text-pupr-blue">{Math.round(completionPercentage)}%</span>
    <div className="w-32 h-1 bg-slate-100 overflow-hidden text-pupr-blue border border-slate-200">
    <div className="h-full bg-pupr-blue transition-all duration-75" style={{ width: `${completionPercentage}%` }} />
    </div>
   </div>
   <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider mt-1">Kesiapan Teknis</span>
   </div>
   <button
   onClick={handleReset}
   className="p-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all border border-slate-200 group"
   title="Reset Module"
   >
   <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-75" />
   </button>
  </div>
  </div>

  {/* ── Split-Pane Container (MasterHidrologiTab pattern) ── */}
  <div className="flex flex-col lg:flex-row gap-0 bg-white border border-slate-200 min-h-[600px]">

  {/* ════ Left Column: Workflow Navigator ════ */}
  <div className="w-full lg:w-1/4 xl:w-1/5 flex flex-col border-r border-slate-200 self-stretch">
   {/* Panel Header */}
   <div className="p-4 border-b border-slate-200 bg-slate-50/50">
   <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
    <span className="w-2 h-2 bg-pupr-blue"></span>
    ALUR KERJA
    <span className="ml-auto bg-slate-200 text-slate-600 px-1.5 py-0.5 text-[10px] tabular-nums font-bold">
    {completedSteps.size}/{STEPS.length}
    </span>
   </h3>
   </div>

   {/* Step Nav Items */}
   <div className="flex-1 flex flex-col divide-y divide-slate-100">
   {STEPS.map((step) => {
    const isActive = activeStep === step.id;
    const isCompleted = completedSteps.has(step.id);
    const isLocked = step.id > 1 && !completedSteps.has((step.id - 1) as Step);

    return (
    <button
     key={step.id}
     onClick={() => !isLocked && setActiveStep(step.id)}
     disabled={isLocked}
     className={`w-full text-left px-5 py-4 transition-all flex items-center justify-between group relative border-l-4
     ${isActive
      ? 'bg-slate-50 border-pupr-blue'
      : isCompleted
      ? 'hover:bg-slate-50/80 border-emerald-400'
      : 'hover:bg-slate-50/80 border-transparent'
     }
     ${isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
     `}
    >
     <div className="flex items-center gap-3">
     <div className={`${isActive ? 'text-pupr-blue' : isCompleted ? 'text-emerald-500' : 'text-slate-300'}`}>
      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
     </div>
     <div>
      <p className={`text-xs font-bold leading-none mb-1 ${isActive ? 'text-pupr-blue' : 'text-slate-700'}`}>{step.label}</p>
      <p className="text-[10px] text-slate-500 font-medium">{step.description}</p>
     </div>
     </div>
     {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
    </button>
    );
   })}
   </div>

   {/* Bottom Section */}
   <div className="p-4 border-t border-slate-200 space-y-3">
   <div className="flex justify-between text-[10px] font-black text-slate-500 mb-1 uppercase tracking-tighter">
    <span>Siap ekspor</span>
    <span className="text-pupr-blue tabular-nums">{Math.round(completionPercentage)}%</span>
   </div>
   <div className="h-0.5 w-full bg-slate-100 overflow-hidden border border-slate-200">
    <div className="h-full bg-pupr-blue transition-all duration-75" style={{ width: `${completionPercentage}%` }} />
   </div>

   {onConsultAI && (
    <button
    onClick={onConsultAI}
    className="w-full mt-3 p-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all flex items-center gap-3 group"
    >
    <div className="p-1.5 bg-white text-pupr-blue border border-slate-100">
     <Activity className="w-3.5 h-3.5" />
    </div>
    <div className="text-left">
     <p className="text-[10px] font-bold text-slate-700">Konsultan AI</p>
     <p className="text-[9px] text-slate-500 font-medium">Verifikasi Kepatuhan</p>
    </div>
    </button>
   )}
   </div>
  </div>

  {/* ════ Right Column: Content Workspace ════ */}
  <div className="w-full lg:w-3/4 xl:w-4/5 flex flex-col self-stretch bg-slate-50/30 overflow-hidden">
   {/* Workspace Header */}
   <div className="p-5 border-b border-slate-200 bg-white flex justify-between items-center">
   <div>
    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
    {STEPS.find(s => s.id === activeStep)?.icon}
    {STEPS.find(s => s.id === activeStep)?.label}
    </h3>
    <p className="text-xs text-slate-500 font-medium mt-0.5">
    Langkah <span className="font-bold text-slate-700 tabular-nums">{activeStep}</span> dari <span className="font-bold text-slate-700 tabular-nums">{STEPS.length}</span>
    <span className="mx-2 text-slate-300">|</span>
    <span className="font-bold text-slate-700">{STEPS.find(s => s.id === activeStep)?.description}</span>
    </p>
   </div>
   {completedSteps.has(activeStep) && (
    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200 uppercase tracking-wider">
    ✓ Selesai
    </span>
   )}
   </div>

   {/* Step Content */}
   <div className="flex-1 overflow-y-auto">
   {activeStep === 1 && <StepMorfometri onComplete={() => handleStepComplete(1)} isCompleted={completedSteps.has(1)} />}
   {activeStep === 2 && <StepHietograf onComplete={() => handleStepComplete(2)} isCompleted={completedSteps.has(2)} />}
   {activeStep === 3 && <StepMetodeBanjir onComplete={onMethodSelected} isCompleted={completedSteps.has(3)} />}
   {activeStep === 4 && <StepRekapVisualisasi selectedMethod={selectedMethod} unitHydrograph={unitHydrograph} onComplete={() => handleStepComplete(4)} />}
   </div>
  </div>
  </div>
 </div>
 );
};
