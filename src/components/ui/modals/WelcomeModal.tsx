import React from 'react';
import { X, Sparkles, Database, TrendingUp, FileText, CheckCircle2 } from 'lucide-react';
import { useOnboarding } from '@/providers/OnboardingProvider';

export const WelcomeModal: React.FC = () => {
    const { hasSeenWelcome, setHasSeenWelcome } = useOnboarding();

    if (hasSeenWelcome) return null;

    const steps = [
        {
            icon: <Database className="w-5 h-5 text-blue-600" />,
            title: "Input Master Data",
            description: "Lengkapi identitas lokasi dan data hujan historis sebagai pondasi analisis."
        },
        {
            icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
            title: "Analisis Hidrologi",
            description: "Lakukan analisis frekuensi dan perhitungan banjir rencana secara otomatis."
        },
        {
            icon: <FileText className="w-5 h-5 text-green-600" />,
            title: "Laporan & AI Audit",
            description: "Dapatkan laporan teknis dan konsultasi AI berbasis standar SNI terkini."
        }
    ];

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/70 animate-in fade-in duration-300">
            <div className="bg-white rounded-sm border border-slate-300 shadow-none max-w-2xl w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">

                {/* Decorative Header */}
                <div className="bg-pupr-blue p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <Sparkles className="w-40 h-40 text-white" />
                    </div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-3xl font-extrabold text-white mb-2">Selamat Datang di Rekasda Pro</h2>
                        <p className="text-blue-100 font-medium">Platform Terpadu untuk Rekayasa Sumber Daya Air</p>
                    </div>
                    <button
                        onClick={() => setHasSeenWelcome(true)}
                        className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-white/80 hover:text-white rounded-sm transition-colors"
                        aria-label="Tutup"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {steps.map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center text-center space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-1">
                                    {step.icon}
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm leading-tight">{step.title}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 flex gap-4 items-start">
                        <div className="bg-pupr-yellow/20 p-2 rounded-lg">
                            <Sparkles className="w-5 h-5 text-amber-700" />
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-900 text-sm mb-1">Butuh Bantuan?</h4>
                            <p className="text-xs text-amber-800 leading-relaxed">
                                Gunakan fitur <strong>AI Konsultan</strong> untuk mengaudit hasil perhitungan Anda atau mencari referensi standar teknis di setiap tahapan.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setHasSeenWelcome(true)}
                        className="w-full py-4 bg-pupr-blue text-white font-bold rounded-xl hover:bg-[#092b4d] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 group"
                    >
                        Mulai Eksplorasi
                        <CheckCircle2 className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};
