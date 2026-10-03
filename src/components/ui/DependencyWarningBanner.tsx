import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { Button } from './Button';

interface DependencyWarningBannerProps {
    module: 'banjir' | 'neraca' | 'frekuensi' | 'saluran';
    className?: string;
    onAction?: () => void;
    actionLabel?: string;
    customMessage?: string;
}

export const DependencyWarningBanner: React.FC<DependencyWarningBannerProps> = ({
    module,
    className,
    onAction,
    actionLabel,
    customMessage
}) => {
    const { isBanjirDirty, isNeracaDirty, isFrekuensiDirty } = useHydrologyStore();

    let isDirty = false;
    let title = 'Peringatan Integritas Data';
    let defaultMessage = '';
    let defaultActionLabel = 'Hitung Ulang';

    switch (module) {
        case 'frekuensi':
            isDirty = isFrekuensiDirty;
            title = 'Peringatan Integritas Data Hujan';
            defaultMessage = 'Data curah hujan stasiun atau konfigurasi hujan wilayah telah diperbarui. Parameter deret curah hujan maksimum tahunan (AMS) dan distribusi frekuensi terindikasi kedaluwarsa.';
            defaultActionLabel = 'Sinkronkan Deret Baru';
            break;
        case 'banjir':
            isDirty = isBanjirDirty;
            title = 'Peringatan Integritas Parameter Banjir';
            defaultMessage = 'Parameter fundamental (Luas DAS / Hujan Rencana / Tutupan Lahan) telah diperbarui. Hasil perhitungan hidrograf banjir pada modul ini terindikasi kedaluwarsa.';
            defaultActionLabel = 'Hitung Ulang Hidrograf';
            break;
        case 'neraca':
            isDirty = isNeracaDirty;
            title = 'Peringatan Integritas Neraca Air';
            defaultMessage = 'Parameter DAS atau data curah hujan bulanan telah diperbarui. Hasil ketersediaan air (F.J. Mock) perlu dihitung ulang.';
            defaultActionLabel = 'Hitung Ulang Neraca Air';
            break;
        case 'saluran':
            isDirty = isBanjirDirty;
            title = 'Peringatan Debit Desain Saluran';
            defaultMessage = 'Debit banjir rencana (Qp) pada modul hulu telah mengalami perubahan atau belum dimutakhirkan. Harap verifikasi kapasitas hidrolis penampang terhadap debit banjir terkini.';
            defaultActionLabel = 'Sinkronkan Debit Desain';
            break;
    }

    if (!isDirty) return null;

    return (
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border mb-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-xs
            bg-amber-50/95 backdrop-blur-md border-amber-200 text-amber-900 ${className || ''}`}>

            <div className="flex items-start gap-3">
                <div className="bg-amber-100 p-2 rounded-lg shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <h4 className="text-xs font-bold tracking-tight mb-0.5 uppercase text-amber-900">
                        {title}
                    </h4>
                    <p className="text-xs text-amber-800/90 leading-relaxed font-medium">
                        {customMessage || defaultMessage}
                    </p>
                </div>
            </div>

            {onAction && (
                <Button
                    size="sm"
                    onClick={onAction}
                    className="shrink-0 h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs flex items-center gap-1.5 self-end sm:self-center"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {actionLabel || defaultActionLabel}
                </Button>
            )}
        </div>
    );
};

