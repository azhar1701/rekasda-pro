import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';

interface DependencyWarningBannerProps {
    module: 'banjir' | 'neraca';
    className?: string;
}

export const DependencyWarningBanner: React.FC<DependencyWarningBannerProps> = ({ module, className }) => {
    const { isBanjirDirty, isNeracaDirty } = useHydrologyStore();

    const isDirty = module === 'banjir' ? isBanjirDirty : isNeracaDirty;

    if (!isDirty) return null;

    return (
        <div className={`flex items-start gap-4 p-4 rounded-xl border mb-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm
            bg-amber-50/90 backdrop-blur-md border-amber-200 text-amber-900 ${className || ''}`}>

            <div className="bg-amber-100 p-2 rounded-lg shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>

            <div className="flex-1 mt-0.5">
                <h4 className="text-sm font-bold tracking-tight mb-1">
                    Peringatan Integritas Data
                </h4>
                <p className="text-xs text-amber-700/90 leading-relaxed font-medium">
                    Parameter fundamental (Luas DAS / Stasiun Hujan) telah diperbarui. Hasil perhitungan *(State Output)* pada modul ini terindikasi kedaluwarsa atau tidak akurat. Harap klik opsi <strong>Hitung Ulang</strong> untuk menyinkronkan kembali kalkulasi matematis.
                </p>
            </div>
        </div>
    );
};
