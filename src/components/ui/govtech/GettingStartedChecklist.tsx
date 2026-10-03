import React from 'react';
import { useOnboarding } from '@/providers/OnboardingProvider';
import { CheckCircle2, Circle, ChevronDown, Zap } from 'lucide-react';

export const GettingStartedChecklist: React.FC = () => {
    const { completedSteps, isChecklistVisible, setChecklistVisible } = useOnboarding();

    const steps = [
        { id: 'identitas', label: 'Lengkapi Identitas Lokasi', tab: '/master?tab=identitas' },
        { id: 'hujan', label: 'Input Data Curah Hujan', tab: '/master?tab=data-hujan' },
        { id: 'spasial', label: 'Morfometri DAS (A & L)', tab: '/master?tab=parameter-spasial' },
        { id: 'frekuensi', label: 'Analisis Frekuensi Hujan', tab: '/frekuensi' },
        { id: 'banjir', label: 'Hitung Banjir Rencana (HSS)', tab: '/banjir' }
    ];

    const progress = Math.round((completedSteps.length / steps.length) * 100);

    if (progress === 100 && !isChecklistVisible) return null;

    return (
        <div className={`fixed bottom-24 right-6 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-[45] transition-all duration-500 transform ${isChecklistVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
            <button
                onClick={() => setChecklistVisible(false)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
                <ChevronDown className="w-4 h-4" />
            </button>

            <div className="p-4 bg-pupr-blue rounded-t-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />

                <div className="flex items-center gap-2 mb-3 relative z-10">
                    <Zap className="w-4 h-4 text-pupr-yellow animate-pulse" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Langkah Persiapan</h3>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-pupr-yellow transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-bold text-white whitespace-nowrap">{progress}%</span>
                </div>
            </div>

            <div className="p-2 space-y-1">
                {steps.map((step) => {
                    const isDone = completedSteps.includes(step.id);
                    return (
                        <button
                            key={step.id}
                            onClick={() => {
                                const event = new CustomEvent('navigateToTab', { detail: step.tab });
                                window.dispatchEvent(event);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group ${isDone ? 'bg-green-50/50' : 'hover:bg-slate-50'}`}
                        >
                            {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 animate-in zoom-in-50 duration-300" />
                            ) : (
                                <Circle className="w-4 h-4 text-slate-300 shrink-0 group-hover:text-pupr-blue transition-colors" />
                            )}
                            <span className={`text-xs font-medium transition-all ${isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                {step.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {progress === 100 && (
                <div className="p-3 bg-green-50 rounded-b-xl border-t border-green-100">
                    <p className="text-[10px] text-green-800 font-bold text-center">
                        🎉 Persiapan Selesai! Anda siap untuk pelaporan.
                    </p>
                </div>
            )}
        </div>
    );
};

// Toggle Button for Checklist
export const ChecklistToggle: React.FC = () => {
    const { isChecklistVisible, setChecklistVisible } = useOnboarding();
    const { completedSteps } = useOnboarding();

    if (isChecklistVisible) return null;

    return (
        <button
            onClick={() => setChecklistVisible(true)}
            className="fixed bottom-24 right-6 w-12 h-12 bg-pupr-blue text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-all z-[45] group"
        >
            <Zap className="w-5 h-5 text-pupr-yellow group-hover:animate-pulse" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-pupr-yellow text-pupr-blue text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                {completedSteps.length}/4
            </div>
        </button>
    );
};
