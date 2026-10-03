import React from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Droplets, Beaker, Spline, Activity, Waves, Database, ChevronRight, ChevronLeft, CheckCircle2, Sparkles, Save } from 'lucide-react';
import { useEmbungStore, EmbungProvider } from '../../hooks/useEmbungStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { saveEmbungProject } from '@/services/calculationService';
import { CalculationType } from '@/types/common.types';
import { toast } from '@/hooks/useToast';

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

interface EmbungRebuildProps {
    onConsultAI?: (type: string, data: any, result: any) => void;
    onSave?: (type: any, inputs: any, outputs: any) => void;
}

export const EmbungRebuildMain: React.FC<EmbungRebuildProps> = ({ onConsultAI, onSave }) => {
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

    const handleSaveDesign = async () => {
        try {
            await saveEmbungProject({
                projectName: 'Desain Situ & Embung Terpadu',
                analysisType: 'full_embung_workflow',
                inputData: {
                    activeTab: state.activeTab,
                    zoning: state.zoning,
                },
                resultData: {
                    capacityResult: state.capacityResult,
                    routingResult: state.routingResult,
                    waterBalanceResult: state.waterBalanceResult,
                    sedimentResult: state.sedimentResult,
                },
                notes: 'Desain teknis situ dan embung terintegrasi (SNI Pedoman Embung)'
            });

            if (onSave) {
                onSave(
                    CalculationType.EMBUNG,
                    {
                        site: { channelName: 'Desain Situ & Embung Terpadu' },
                        zoning: state.zoning
                    },
                    {
                        deadStorage: state.zoning?.deadStorageVolume || 0,
                        effectiveStorage: state.zoning?.activeStorageVolume || 0,
                        floodStorage: state.zoning?.floodStorageVolume || 0,
                        totalStorage: state.zoning?.totalStorageVolume || 0
                    }
                );
            } else {
                toast.success('Desain & analisis Embung berhasil disimpan ke skenario proyek!');
            }
        } catch (err) {
            console.error('Save embung error:', err);
            toast.error('Gagal menyimpan desain embung');
        }
    };

    return (
        <ModuleLayout
            title="Manajemen Situ & Embung"
            description="Desain & Analisis terpadu berdasarkan Standar Perencanaan Embung (Guidance Workflow)"
            icon={<Droplets className="w-6 h-6" />}
            iconColorClass="bg-blue-50 text-pupr-blue"
            actions={
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        onClick={handleSaveDesign}
                        className="bg-pupr-blue text-white hover:bg-blue-800 h-8 text-xs font-semibold flex items-center gap-1.5"
                    >
                        <Save className="w-3.5 h-3.5" />
                        Simpan Desain
                    </Button>
                    {onConsultAI && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                onConsultAI(state.activeTab, state, {
                                    zoning: state.zoning,
                                    capacityResult: state.capacityResult,
                                    routingResult: state.routingResult,
                                    waterBalanceResult: state.waterBalanceResult,
                                    sedimentResult: state.sedimentResult
                                });
                            }}
                            className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 h-8 text-xs font-semibold"
                        >
                            <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-600" />
                            Konsultasi AI
                        </Button>
                    )}
                </div>
            }
        >
            <div className="flex flex-col h-full gap-6">
                {/* Stepper Header */}
                <div className="grid grid-cols-5 gap-4">
                    {STEPS.map((step, idx) => {
                        const isActive = state.activeTab === step.id;
                        const isCompleted = currentStepIndex > idx;

                        return (
                            <Card
                                key={step.id}
                                className={cn(
                                    "p-4 border-2 transition-all cursor-pointer hover:border-pupr-blue/50",
                                    isActive ? "border-pupr-blue bg-blue-50/30" : "border-transparent bg-white",
                                    isCompleted && "border-teal-500/20"
                                )}
                                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: step.id })}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors",
                                        isActive ? "bg-pupr-blue text-white" :
                                            isCompleted ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-400"
                                    )}>
                                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className={cn("text-xs font-bold truncate", isActive ? "text-blue-900" : "text-slate-500")}>
                                            {step.title}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 truncate">{step.description}</p>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Step Content Area */}
                <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto p-6">
                        {state.activeTab === 'geometry' && <StepGeometry />}
                        {state.activeTab === 'capacity' && <StepCapacity />}
                        {state.activeTab === 'routing' && <StepRouting />}
                        {state.activeTab === 'operation' && <StepOperation />}
                        {state.activeTab === 'sediment' && <StepSediment />}
                    </div>

                    {/* Navigation Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            disabled={currentStepIndex === 0}
                            className="text-slate-600"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Kembali
                        </Button>

                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-slate-400">
                                Langkah {currentStepIndex + 1} dari {STEPS.length}
                            </span>
                            {currentStepIndex === STEPS.length - 1 ? (
                                <Button
                                    onClick={handleSaveDesign}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Selesai & Simpan Desain
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleNext}
                                    className="bg-pupr-blue hover:bg-teal-700 text-white"
                                >
                                    Lanjut
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ModuleLayout>
    );
};

export const EmbungRebuild: React.FC<EmbungRebuildProps> = ({ onConsultAI, onSave }) => (
    <EmbungProvider>
        <EmbungRebuildMain onConsultAI={onConsultAI} onSave={onSave} />
    </EmbungProvider>
);
