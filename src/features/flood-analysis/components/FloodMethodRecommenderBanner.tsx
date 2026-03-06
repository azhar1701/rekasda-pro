import React from 'react';
import { AlertTriangle, Info, ShieldCheck } from 'lucide-react';
import { useFloodMethod } from '@/hooks/useFloodMethod';

export const FloodMethodRecommenderBanner: React.FC = () => {
    const { recommendation, isDataReady, luasDasNumeric, hujanRencanaValue } = useFloodMethod();

    if (!isDataReady) {
        return (
            <div className="flex items-start gap-4 p-5 rounded-md border bg-red-50 border-red-200 text-red-900 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-red-100 p-2.5 rounded-md shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-black uppercase tracking-tight mb-1">Akses Kalkulasi Dibatasi</h4>
                    <p className="text-xs font-medium leading-relaxed opacity-90">
                        Selesaikan delineasi <strong>Modul Spasial (Luas DAS)</strong> dan <strong>Analisis Frekuensi (Hujan Rencana)</strong> terlebih dahulu. Sistem memerlukan data ini untuk merekomendasikan metode teknis yang tepat.
                    </p>
                    {!luasDasNumeric && (
                        <div className="mt-2 text-[10px] font-bold text-red-700 bg-red-100/50 inline-block px-2 py-0.5 rounded border border-red-200">
                            ⚠ Luas DAS: Kosong
                        </div>
                    )}
                    {!hujanRencanaValue && (
                        <div className="mt-2 ml-2 text-[10px] font-bold text-red-700 bg-red-100/50 inline-block px-2 py-0.5 rounded border border-red-200">
                            ⚠ Hujan Rencana: Belum Dipilih
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="group flex flex-col gap-4 p-5 rounded-md border bg-blue-50/50 border-[#0c3a66]/20 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-2.5 rounded-md shrink-0 border border-blue-200 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-5 h-5 text-[#0c3a66]" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-black text-[#0c3a66] uppercase tracking-tight">Sistem Pakar Recommender</h4>
                        <span className="text-[10px] font-bold bg-[#0c3a66] text-white px-2 py-0.5 rounded uppercase">Verified by SNI</span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed mb-3">
                        Sistem mendeteksi Luas DAS sebesar <span className="font-bold text-blue-800">{luasDasNumeric.toFixed(2)} km²</span> dan Hujan Rencana (Q50) sebesar <span className="font-bold text-blue-800">{hujanRencanaValue.toFixed(2)} mm</span>.
                    </p>
                </div>
            </div>

            <div className="bg-[#0c3a66] p-4 rounded-md border-b-4 border-yellow-400">
                <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-yellow-400" />
                    <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Rekomendasi Ahli (Principal Hydrology)</span>
                </div>
                <div className="text-lg font-black text-white leading-tight mb-2">
                    METODE {recommendation.metode.toUpperCase()}
                </div>
                <p className="text-xs font-bold text-white/90 leading-relaxed italic">
                    "{recommendation.alasan}"
                </p>
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/60">Parameter telah dikunci untuk kepatuhan teknis.</span>
                </div>
            </div>
        </div>
    );
};
