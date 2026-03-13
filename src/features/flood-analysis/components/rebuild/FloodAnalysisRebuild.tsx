import React, { useState } from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Card } from '@/components/ui/Card';
import {
    Mountain,
    CloudRain,
    Activity,
    CheckCircle2,
    LayoutDashboard,
    ChevronRight,
    Info
} from 'lucide-react';
import { useFrequencyAnalysis } from '@/hooks/useFrequencyAnalysis';
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
        label: 'Karakteristik DAS',
        icon: <Mountain className="w-5 h-5" />,
        description: 'Morfometri & Runoff'
    },
    {
        id: 2,
        label: 'Hietograf (ABM)',
        icon: <CloudRain className="w-5 h-5" />,
        description: 'Distribusi Hujan'
    },
    {
        id: 3,
        label: 'Analisis Debit',
        icon: <Activity className="w-5 h-5" />,
        description: 'Multi-Method HSS'
    },
    {
        id: 4,
        label: 'Rekap & Output',
        icon: <LayoutDashboard className="w-5 h-5" />,
        description: 'Final Hydrograph'
    }
];

interface FloodAnalysisRebuildProps {
    onConsultAI?: () => void;
}

export const FloodAnalysisRebuild: React.FC<FloodAnalysisRebuildProps> = ({ onConsultAI }) => {
    const [activeStep, setActiveStep] = useState<Step>(1);
    const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());

    // Data from store for accurate auto-tracking
    const hydroState = useHydrologyStore();
    const {
        morfometriDAS,
        hujanEfektif,
        hasilBanjir,
        hasilKonvolusi
    } = hydroState;

    const { isComplete: freqComplete } = useFrequencyAnalysis();
    const { completeStep } = useOnboarding();

    // 100% Accurate Auto-Tracking Logic
    React.useEffect(() => {
        const newCompleted = new Set<Step>();
        
        // Step 1: Karakteristik DAS (Needs Area and Length)
        if ((morfometriDAS?.luasDAS || 0) > 0 && (morfometriDAS?.panjangSungai || 0) > 0) {
            newCompleted.add(1);
        }

        // Step 2: Hietograf (Needs Effective Rainfall from ABM)
        if (hujanEfektif && hujanEfektif.length > 0) {
            newCompleted.add(2);
        }

        // Step 3: Analisis Debit (Needs a calculated Flood result or Unit Hydrograph)
        if (hasilBanjir || (hydroState.distribusiHujanJamJaman && hydroState.distribusiHujanJamJaman.length > 0)) {
            newCompleted.add(3);
        }

        // Step 4: Rekap & Output (Needs final convolution results)
        if (hasilKonvolusi && (hasilKonvolusi.peakDischarge || 0) > 0) {
            newCompleted.add(4);
            completeStep('banjir');
        }

        // Only update if the set has actually changed to prevent render loops
        const currentIds = Array.from(completedSteps).sort().join(',');
        const newIds = Array.from(newCompleted).sort().join(',');
        
        if (currentIds !== newIds) {
            setCompletedSteps(newCompleted);
        }
    }, [morfometriDAS, hujanEfektif, hasilBanjir, hasilKonvolusi, hydroState.distribusiHujanJamJaman, completeStep, completedSteps]);

    // Data passed between steps
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

    return (
        <ModuleLayout
            title="Analisis Debit Banjir Rencana"
            description="Penghitungan debit puncak dan hidrograf banjir dengan standar SNI 2415:2016"
            icon={<Activity className="w-6 h-6" />}
            iconColorClass="bg-pupr-blue/10 text-pupr-blue"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-2">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-3 space-y-4">
                    <Card className="p-4 border border-slate-200 shadow-sm rounded-md bg-white">
                        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Workflow Progress</h3>
                        <div className="space-y-1">
                            {STEPS.map((step) => {
                                const isActive = activeStep === step.id;
                                const isCompleted = completedSteps.has(step.id);
                                const isLocked = step.id > 1 && !completedSteps.has((step.id - 1) as Step);

                                return (
                                    <button
                                        key={step.id}
                                        onClick={() => !isLocked && setActiveStep(step.id)}
                                        disabled={isLocked}
                                        className={`w-full text-left p-3 rounded-md transition-all flex items-center justify-between group ${isActive
                                            ? 'bg-pupr-blue text-white shadow-md'
                                            : isCompleted
                                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                                : isLocked
                                                    ? 'text-slate-300 cursor-not-allowed opacity-50'
                                                    : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-md ${isActive ? 'bg-white/20' : isCompleted ? 'bg-green-100' : 'bg-slate-100'}`}>
                                                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold leading-none mb-1">{step.label}</p>
                                                <p className={`text-[9px] ${isActive ? 'text-white/60' : 'text-slate-400'}`}>{step.description}</p>
                                            </div>
                                        </div>
                                        {isActive && <ChevronRight className="w-4 h-4 animate-pulse" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Overall Progress */}
                        <div className="mt-6 pt-4 border-t border-slate-100">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2">
                                <span>OVERALL COMPLETION</span>
                                <span>{Math.round((completedSteps.size / STEPS.length) * 100)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 transition-all duration-700"
                                    style={{ width: `${(completedSteps.size / STEPS.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </Card>

                    {!freqComplete && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md animate-pulse">
                            <div className="flex items-center gap-2 mb-2 text-amber-700">
                                <Info className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase">Prasyarat Belum Terpenuhi</span>
                            </div>
                            <p className="text-[10px] text-amber-600">Selesaikan <b>Analisis Frekuensi</b> untuk mendapatkan Hujan Rencana (R24) sebagai input utama distribusi hujan.</p>
                        </div>
                    )}

                    {onConsultAI && (
                        <button
                            onClick={onConsultAI}
                            className="w-full p-4 bg-white border border-pupr-blue/20 rounded-md shadow-sm hover:shadow-md transition-all flex items-center gap-3 group overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-pupr-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="p-2 bg-pupr-blue/10 rounded-lg text-pupr-blue group-hover:scale-110 transition-transform">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-extrabold text-slate-900 leading-none mb-1">Konsultan AI</p>
                                <p className="text-[9px] font-bold text-pupr-blue uppercase tracking-widest">Audit Analisis</p>
                            </div>
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-9">
                    {activeStep === 1 && (
                        <StepMorfometri
                            onComplete={() => handleStepComplete(1)}
                            isCompleted={completedSteps.has(1)}
                        />
                    )}

                    {activeStep === 2 && (
                        <StepHietograf
                            onComplete={() => handleStepComplete(2)}
                            isCompleted={completedSteps.has(2)}
                        />
                    )}

                    {activeStep === 3 && (
                        <StepMetodeBanjir
                            onComplete={onMethodSelected}
                            isCompleted={completedSteps.has(3)}
                        />
                    )}

                    {activeStep === 4 && (
                        <StepRekapVisualisasi
                            selectedMethod={selectedMethod}
                            unitHydrograph={unitHydrograph}
                            onComplete={() => handleStepComplete(4)}
                        />
                    )}
                </div>
            </div>
        </ModuleLayout>
    );
};
