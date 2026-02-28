import React, { useMemo, useState, useCallback } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { calculateARF } from '@/lib/engine/rainfallAnalysis';
import { ArrowRight, RotateCcw, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * AreaReductionCard — Displays point→areal rainfall conversion via ARF.
 * Sits between Curah Hujan input and Calculate button in ModulBanjirRencana.
 */
export const AreaReductionCard: React.FC = () => {
    const luasDas = useHydrologyStore(s => s.luasDas);
    const hasilAnalisisFrekuensi = useHydrologyStore(s => s.hasilAnalisisFrekuensi);
    const setHasilARF = useHydrologyStore(s => s.setHasilARF);
    const curahHujanRencana = useHydrologyStore(s => s.curahHujanRencana);

    // Manual ARF override
    const [arfOverride, setArfOverride] = useState<string>('');
    const isOverridden = arfOverride !== '' && !isNaN(parseFloat(arfOverride));

    // Get point rainfall from frequency analysis or manual input
    const hujanTitik = useMemo(() => {
        if (hasilAnalisisFrekuensi?.selectedKalaUlang) {
            const match = hasilAnalisisFrekuensi.curahHujanRencana.find(
                v => v.kalaUlang === hasilAnalisisFrekuensi.selectedKalaUlang
            );
            if (match) return match.curahHujan;
        }
        return parseFloat(curahHujanRencana) || 0;
    }, [hasilAnalisisFrekuensi, curahHujanRencana]);

    // Calculate ARF
    const arfResult = useMemo(() => {
        const A = parseFloat(luasDas);
        if (!A || A <= 0 || hujanTitik <= 0) return null;

        try {
            const result = calculateARF(A, hujanTitik);
            return result;
        } catch {
            return null;
        }
    }, [luasDas, hujanTitik]);

    // Effective ARF (override or calculated)
    const effectiveArf = isOverridden ? parseFloat(arfOverride) : arfResult?.arf || 0;
    const effectiveHujanDAS = hujanTitik > 0 ? Number((hujanTitik * effectiveArf).toFixed(2)) : 0;

    // Save to store
    const handleSave = useCallback(() => {
        if (!arfResult && !isOverridden) return;

        setHasilARF({
            arfValue: arfResult?.arf || effectiveArf,
            arfOverride: isOverridden ? parseFloat(arfOverride) : null,
            hujanTitik,
            hujanDAS: effectiveHujanDAS,
        });
    }, [arfResult, isOverridden, arfOverride, hujanTitik, effectiveHujanDAS, effectiveArf, setHasilARF]);

    // Auto-save on calculation
    React.useEffect(() => {
        if (arfResult && hujanTitik > 0) {
            handleSave();
        }
    }, [arfResult, hujanTitik]); // eslint-disable-line react-hooks/exhaustive-deps

    // Don't render if no DAS area or no rainfall
    if (!luasDas || parseFloat(luasDas) <= 0 || hujanTitik <= 0) return null;

    return (
        <div className={cn(
            'border rounded-md p-4 transition-all',
            isOverridden
                ? 'bg-amber-50/50 border-amber-200'
                : 'bg-slate-50/50 border-slate-200'
        )}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-indigo-50 flex items-center justify-center text-pupr-blue">
                    <Shield className="w-4 h-4" />
                </div>
                <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Koefisien Reduksi Area (ARF)
                    </h4>
                    <p className="text-[10px] text-slate-400">PSA 007 · Hujan Titik → Hujan DAS</p>
                </div>
            </div>

            {/* Flow visualization: Point → × ARF → = Areal */}
            <div className="flex items-center gap-2 text-sm">
                {/* Point rainfall */}
                <div className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-2 text-center">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Hujan Titik</p>
                    <p className="text-lg font-black text-slate-800">{hujanTitik.toFixed(1)}</p>
                    <p className="text-[10px] text-slate-400">mm</p>
                </div>

                {/* × ARF */}
                <div className="flex flex-col items-center gap-1">
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                    <span className="text-[10px] font-bold text-slate-500">×</span>
                </div>

                {/* ARF value (editable) */}
                <div className={cn(
                    'flex-1 rounded-md px-3 py-2 text-center border',
                    isOverridden
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-white border-slate-200'
                )}>
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">ARF</p>
                        {isOverridden && (
                            <button
                                onClick={() => setArfOverride('')}
                                className="p-0.5 text-amber-500 hover:text-amber-700"
                                title="Reset ke nilai perhitungan"
                            >
                                <RotateCcw className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        max="1.0"
                        value={isOverridden ? arfOverride : (arfResult?.arf?.toFixed(4) || '—')}
                        onChange={(e) => setArfOverride(e.target.value)}
                        className={cn(
                            'w-full text-center text-lg font-black bg-transparent outline-none',
                            isOverridden ? 'text-amber-700' : 'text-pupr-blue'
                        )}
                    />
                    <p className="text-[10px] text-slate-400">
                        A = {luasDas} km²
                    </p>
                </div>

                {/* = DAS rainfall */}
                <div className="flex flex-col items-center gap-1">
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                    <span className="text-[10px] font-bold text-slate-500">=</span>
                </div>

                <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 text-center">
                    <p className="text-[10px] font-semibold text-pupr-blue uppercase">Hujan DAS</p>
                    <p className="text-lg font-black text-emerald-700">{effectiveHujanDAS.toFixed(1)}</p>
                    <p className="text-[10px] text-pupr-blue">mm</p>
                </div>
            </div>

            {/* Override indicator */}
            {isOverridden && (
                <p className="text-[10px] text-amber-600 font-medium mt-2 text-center">
                    ⚠ ARF di-override manual. Klik ⟲ untuk reset ke nilai PSA 007.
                </p>
            )}
        </div>
    );
};

export default AreaReductionCard;
