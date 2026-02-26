import React, { useState, useMemo } from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { CloudRain, Activity, Waves, CheckCircle2, Lock } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { useFrequencyAnalysis } from '@/hooks/useFrequencyAnalysis';
import { DistribusiHujanStep } from './steps/DistribusiHujanStep';
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
  
  // Step 1 outputs
  const [hujanEfektif, setHujanEfektif] = useState<number[]>([]);
  const [durasiHujan, setDurasiHujan] = useState<number>(6);
  
  // Step 2 outputs
  const [selectedHSS, setSelectedHSS] = useState<string | null>(null);
  const [hssOrdinates, setHssOrdinates] = useState<number[]>([]);
  
  // Step 3 outputs
  const [finalHydrograph, setFinalHydrograph] = useState<{ time: number; discharge: number }[]>([]);
  const [peakDischarge, setPeakDischarge] = useState<number>(0);

  const { isComplete: freqComplete } = useFrequencyAnalysis();
  const { morfometriDAS, tutupanLahan } = useHydrologyStore();

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

  const handleStep1Complete = (efektif: number[], durasi: number) => {
    setHujanEfektif(efektif);
    setDurasiHujan(durasi);
    handleStepComplete(1);
  };

  const handleStep2Complete = (method: string, ordinates: number[]) => {
    setSelectedHSS(method);
    setHssOrdinates(ordinates);
    handleStepComplete(2);
  };

  const handleStep3Complete = (hydrograph: { time: number; discharge: number }[], peak: number) => {
    setFinalHydrograph(hydrograph);
    setPeakDischarge(peak);
    handleStepComplete(3);
  };

  return (
    <ModuleLayout
      title="Debit Banjir Rencana"
      description="Workflow Terintegrasi: Distribusi → HSS → Konvolusi"
      icon={<CloudRain className="w-6 h-6" />}
      iconColorClass="bg-blue-50 text-blue-600"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-2">
        {/* Stepper Navigation */}
        <div className="lg:col-span-3">
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 sticky top-4">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Langkah Progresif</h3>
            <div className="space-y-2">
              {STEPS.map((step, idx) => {
                const isActive = activeStep === step.id;
                const isCompleted = completedSteps.has(step.id);
                const canAccess = canProceedToStep(step.id);
                const isLocked = !canAccess && !isCompleted;

                return (
                  <button
                    key={step.id}
                    onClick={() => canAccess && setActiveStep(step.id)}
                    disabled={isLocked}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : isCompleted
                        ? 'bg-green-50 text-green-900 border border-green-200'
                        : isLocked
                        ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-white/20' : isCompleted ? 'bg-green-100' : 'bg-slate-200'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : isLocked ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold">{step.label}</p>
                        <p className={`text-xs mt-0.5 ${
                          isActive ? 'text-blue-100' : isCompleted ? 'text-green-600' : 'text-slate-500'
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
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Progress</span>
                <span className="font-bold text-slate-900">{completedSteps.size}/3</span>
              </div>
              <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                  style={{ width: `${(completedSteps.size / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="lg:col-span-9">
          {activeStep === 1 && (
            <DistribusiHujanStep
              onComplete={handleStep1Complete}
              isCompleted={completedSteps.has(1)}
            />
          )}
          
          {activeStep === 2 && (
            <HSSComparisonStep
              hujanEfektif={hujanEfektif}
              durasiHujan={durasiHujan}
              onComplete={handleStep2Complete}
              isCompleted={completedSteps.has(2)}
            />
          )}
          
          {activeStep === 3 && (
            <KonvolusiStep
              hujanEfektif={hujanEfektif}
              hssOrdinates={hssOrdinates}
              selectedHSS={selectedHSS}
              durasiHujan={durasiHujan}
              onComplete={handleStep3Complete}
              isCompleted={completedSteps.has(3)}
            />
          )}
        </div>
      </div>
    </ModuleLayout>
  );
};
