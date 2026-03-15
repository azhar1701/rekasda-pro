import React, { useState } from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { CloudRain, Activity, Waves, CheckCircle2, Circle, CircleDot } from 'lucide-react';
import { useFrequencyAnalysis } from '@/hooks/useFrequencyAnalysis';
import { StepDistribusiHujan } from './steps/StepDistribusiHujan';
import { HSSComparisonStep } from './steps/HSSComparisonStep';
import { KonvolusiStep } from './steps/KonvolusiStep';

type Step = 1 | 2 | 3;

interface StepConfig {
 id: Step;
 label: string;
 icon: React.ReactNode;
 description: string;
}

const STEPS: StepConfig[] = [
 {
 id: 1,
 label: 'Distribusi & Hujan Efektif',
 icon: <CloudRain className="w-5 h-5" />,
 description: 'Hyetograph & Rainfall Losses'
 },
 {
 id: 2,
 label: 'Hidrograf Satuan Sintetis',
 icon: <Activity className="w-5 h-5" />,
 description: 'Multi-HSS Comparison'
 },
 {
 id: 3,
 label: 'Konvolusi & Output',
 icon: <Waves className="w-5 h-5" />,
 description: 'Final Flood Hydrograph'
 }
];

export const ModulBanjirStepper: React.FC = () => {
 const [activeStep, setActiveStep] = useState<Step>(1);
 const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());
 
 const [selectedHSS, setSelectedHSS] = useState<string | null>(null);
 const [hssOrdinates, setHssOrdinates] = useState<number[]>([]);
 const [hssHydrograph, setHssHydrograph] = useState<{ time: number; discharge: number }[]>([]);
 const { isComplete: freqComplete } = useFrequencyAnalysis();

 React.useEffect(() => {
 const handleCompleteStep = (e: any) => {
 const step = e.detail as Step;
 setCompletedSteps(prev => new Set(prev).add(step));
 if (step < 3) setActiveStep((step + 1) as Step);
 };
 window.addEventListener('completeStep', handleCompleteStep);
 return () => window.removeEventListener('completeStep', handleCompleteStep);
 }, []);

 const canProceedToStep = (step: Step): boolean => {
 if (step === 1) return freqComplete;
 if (step === 2) return completedSteps.has(1);
 if (step === 3) return completedSteps.has(2);
 return false;
 };

 const handleStepComplete = (step: Step) => {
 setCompletedSteps(prev => new Set(prev).add(step));
 if (step < 3) setActiveStep((step + 1) as Step);
 };

 const handleStep2Complete = (method: string, ordinates: number[], hydrograph: { time: number; discharge: number }[]) => {
 setSelectedHSS(method);
 setHssOrdinates(ordinates);
 setHssHydrograph(hydrograph);
 handleStepComplete(2);
 };

 const handleStep3Complete = () => {
 handleStepComplete(3);
 };

 return (
 <ModuleLayout
 title="Debit Banjir Rencana"
 description="Workflow Terintegrasi: Distribusi → HSS → Konvolusi"
 icon={<CloudRain className="w-6 h-6" />}
 
 >
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-2">
 {/* Stepper Navigation */}
 <div className="lg:col-span-3">
 <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm p-4 sticky top-4">
 <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Langkah Progresif</h3>
 <div className="space-y-1">
 {STEPS.map((step) => {
 const isActive = activeStep === step.id;
 const isCompleted = completedSteps.has(step.id);
 const canAccess = canProceedToStep(step.id);
 const isLocked = !canAccess && !isCompleted;

 return (
 <button
 key={step.id}
 onClick={() => canAccess && setActiveStep(step.id)}
 disabled={isLocked}
 className={`w-full text-left p-3 rounded-r-md transition-all ${
 isActive
 ? 'border-l-4 border-pupr-blue bg-pupr-blue/5 text-pupr-blue'
 : isCompleted
 ? 'border-l-4 border-green-600 bg-green-50 text-green-900'
 : isLocked
 ? 'border-l-4 border-transparent bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
 : 'border-l-4 border-transparent text-slate-600 dark:text-slate-500 hover:bg-slate-50 dark:bg-slate-800'
 }`}
 >
 <div className="flex items-start gap-3">
 <div className="flex-shrink-0">
 {isCompleted ? (
 <CheckCircle2 className="w-5 h-5 text-green-600" />
 ) : isActive ? (
 <CircleDot className="w-5 h-5 text-pupr-blue" />
 ) : (
 <Circle className="w-5 h-5" />
 )}
 </div>
 <div className="flex-1 min-w-0">
 <p className={`text-sm ${
 isActive || isCompleted ? 'font-bold' : 'font-semibold'
 }`}>{step.label}</p>
 <p className={`text-xs mt-0.5 ${
 isActive ? 'text-pupr-blue/70' : isCompleted ? 'text-green-600' : 'text-slate-500'
 }`}>
 {step.description}
 </p>
 </div>
 </div>
 </button>
 );
 })}
 </div>

 {/* Progress Summary */}
 <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
 <div className="flex items-center justify-between text-xs">
 <span className="text-slate-600 dark:text-slate-500 font-semibold">Progress</span>
 <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">{completedSteps.size}/3</span>
 </div>
 <div className="mt-2 h-2 bg-slate-100 rounded-sm overflow-hidden">
 <div
 className="h-full bg-pupr-blue transition-all duration-75"
 style={{ width: `${(completedSteps.size / 3) * 100}%` }}
 />
 </div>
 </div>
 </div>
 </div>

 {/* Step Content */}
 <div className="lg:col-span-9">
 {activeStep === 1 && (
 <StepDistribusiHujan />
 )}
 
 {activeStep === 2 && completedSteps.has(1) && (
 <HSSComparisonStep
 onComplete={handleStep2Complete}
 isCompleted={completedSteps.has(2)}
 />
 )}
 
 {activeStep === 3 && completedSteps.has(2) && (
 <KonvolusiStep
 hssOrdinates={hssOrdinates}
 hssHydrograph={hssHydrograph}
 selectedHSS={selectedHSS}
 onComplete={handleStep3Complete}
 isCompleted={completedSteps.has(3)}
 />
 )}
 </div>
 </div>
 </ModuleLayout>
 );
};
