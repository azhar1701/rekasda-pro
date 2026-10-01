import React, { useState, useMemo, useCallback } from 'react';
import { useHydrologyStore, type ThiessenStasiunConfig } from '@/stores/useHydrologyStore';
import { Layers, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

/**
 * ThiessenCalculator — Multi-station Thiessen Polygon weighted-average calculator.
 * Sits in the Master Data layer as a pre-processor before Frequency Analysis.
 */
export const ThiessenCalculator: React.FC = () => {
    const { stasiunList, dataHujan, luasDas, hasilThiessen, setHasilThiessen, fetchMultipleStationsData } = useHydrologyStore();

    // Local state: selected stations + their influence areas
    const [configs, setConfigs] = useState<ThiessenStasiunConfig[]>(
        hasilThiessen?.stasiunConfigs || []
    );
    const [isExpanded, setIsExpanded] = useState(false);

    // Available stations not yet selected
    const availableStasiun = useMemo(
        () => stasiunList.filter(s => !configs.find(c => c.stasiunId === s.id)),
        [stasiunList, configs]
    );

    // Total luas for weight calculation
    const totalLuas = useMemo(
        () => configs.reduce((sum, c) => sum + c.luasPengaruh, 0),
        [configs]
    );

    // Auto-calculate bobot
    const configsWithBobot = useMemo(
        () => configs.map(c => ({
            ...c,
            bobot: totalLuas > 0 ? c.luasPengaruh / totalLuas : 0,
        })),
        [configs, totalLuas]
    );

    // Add station handler
    const handleAddStation = useCallback((stasiunId: string) => {
        const stasiun = stasiunList.find(s => s.id === stasiunId);
        if (!stasiun) return;
        setConfigs(prev => [...prev, {
            stasiunId: stasiun.id,
            namaStasiun: stasiun.nama_stasiun,
            luasPengaruh: 0,
            bobot: 0,
        }]);
    }, [stasiunList]);

    // Remove station handler
    const handleRemoveStation = useCallback((stasiunId: string) => {
        setConfigs(prev => prev.filter(c => c.stasiunId !== stasiunId));
    }, []);

    // Update luas pengaruh
    const handleLuasChange = useCallback((stasiunId: string, value: string) => {
        const num = parseFloat(value) || 0;
        setConfigs(prev => prev.map(c =>
            c.stasiunId === stasiunId ? { ...c, luasPengaruh: num } : c
        ));
    }, []);

    // Calculate & Save
    const handleSyncAndCalculate = async () => {
        const ids = configs.map(c => c.stasiunId);
        await fetchMultipleStationsData(ids);
        handleCalculate();
    };

    const handleCalculate = useCallback(() => {
        if (configs.length < 2) {
            toast.error('Minimal 2 stasiun diperlukan untuk Thiessen Polygon.');
            return;
        }
        if (configs.some(c => c.luasPengaruh <= 0)) {
            toast.error('Semua Luas Pengaruh harus > 0 km².');
            return;
        }

        try {
            // Kita simpan pembobotan Thiessen saja ke store Pipeline
            setHasilThiessen({
                stasiunConfigs: configsWithBobot.map(c => ({
                    ...c,
                    luasPengaruh: c.luasPengaruh,
                })),
                totalLuas: totalLuas,
                hujanRataRataDAS: [], // Akan dikalkukasi penuh di tab Curah Hujan Wilayah
            });

            toast.success(`Konfigurasi Thiessen disimpan: ${configsWithBobot.length} stasiun, total luas ${totalLuas.toFixed(1)} km²`);
        } catch (err: any) {
            toast.error(err.message || 'Gagal menghitung Thiessen.');
        }
    }, [configs, dataHujan, setHasilThiessen]);

    // ── Compact card when not expanded ──
    if (!isExpanded) {
        return (
            <div
                onClick={() => setIsExpanded(true)}
                className={cn(
                    'border rounded-md p-4 cursor-pointer transition-all hover:shadow-md',
                    hasilThiessen
                        ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
                        : 'bg-slate-50/50 border-slate-200 hover:border-blue-300'
                )}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            'w-9 h-9 rounded-md flex items-center justify-center',
                            hasilThiessen ? 'bg-emerald-100 text-pupr-blue' : 'bg-blue-50 text-pupr-blue'
                        )}>
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">Hujan Rata-rata DAS (Thiessen)</h4>
                            {hasilThiessen ? (
                                <p className="text-xs text-pupr-blue font-medium mt-0.5">
                                    ✓ {hasilThiessen.stasiunConfigs.length} stasiun · {hasilThiessen.totalLuas.toFixed(1)} km²
                                </p>
                            ) : (
                                <p className="text-xs text-slate-400 mt-0.5">Klik untuk mengatur Poligon Thiessen</p>
                            )}
                        </div>
                    </div>
                    <span className="text-xs text-pupr-blue font-semibold">Buka →</span>
                </div>
            </div>
        );
    }

    // ── Expanded panel ──
    return (
        <div className="border border-blue-200 rounded-md bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-blue-50/50 border-b border-blue-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center text-pupr-blue">
                        <Layers className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800">Poligon Thiessen — Hujan Rata-rata DAS</h4>
                        <p className="text-[10px] text-slate-400">Pembobotan multi-stasiun berdasarkan luas pengaruh</p>
                    </div>
                </div>
                <button onClick={() => setIsExpanded(false)} className="text-xs text-slate-400 hover:text-slate-600 font-medium">
                    Tutup ↑
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Add station */}
                {availableStasiun.length > 0 && (
                    <div className="flex items-center gap-2">
                        <select
                            className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                            defaultValue=""
                            onChange={(e) => { handleAddStation(e.target.value); e.target.value = ''; }}
                        >
                            <option value="" disabled>+ Tambah Stasiun...</option>
                            {availableStasiun.map(s => (
                                <option key={s.id} value={s.id}>{s.nama_stasiun}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Station table */}
                {configs.length > 0 && (
                    <div className="border border-slate-200 rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Stasiun</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">Luas (km²)</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">Bobot</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {configsWithBobot.map(c => (
                                    <tr key={c.stasiunId} className="hover:bg-slate-50">
                                        <td className="px-3 py-2 font-medium text-slate-700 text-xs tabular-nums tracking-tight">{c.namaStasiun}</td>
                                        <td className="px-3 py-2 tabular-nums tracking-tight">
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={c.luasPengaruh || ''}
                                                onChange={(e) => handleLuasChange(c.stasiunId, e.target.value)}
                                                placeholder="0.0"
                                                className="w-20 text-right px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-right tabular-nums tracking-tight">
                                            <span className="text-xs font-bold text-pupr-blue">
                                                {(c.bobot * 100).toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 tabular-nums tracking-tight">
                                            <button
                                                onClick={() => handleRemoveStation(c.stasiunId)}
                                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50">
                                <tr>
                                    <td className="px-3 py-2 text-xs font-bold text-slate-600 tabular-nums tracking-tight">Total</td>
                                    <td className="px-3 py-2 text-right text-xs font-bold text-slate-700 tabular-nums tracking-tight">{totalLuas.toFixed(1)}</td>
                                    <td className="px-3 py-2 text-right text-xs font-bold text-pupr-blue tabular-nums tracking-tight">
                                        {totalLuas > 0 ? '100.0%' : '—'}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {/* DAS area comparison */}
                {(() => {
                    const dasLuasNum = parseFloat(luasDas || '0') || 0;
                    if (dasLuasNum <= 0 || totalLuas <= 0) return null;
                    const maxTol = Math.max(0.05, 0.005 * dasLuasNum);
                    const diff = Math.abs(totalLuas - dasLuasNum);
                    if (diff <= maxTol) return null;

                    return (
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-xs font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            Total Thiessen ({totalLuas.toFixed(2)} km²) berbeda dari Luas DAS ({dasLuasNum.toFixed(2)} km²). Selisih: {diff.toFixed(2)} km² (Toleransi: &plusmn;{maxTol.toFixed(2)} km²)
                        </div>
                    );
                })()}

                {/* Output indicator removed, processed downstream instead */}

                {/* Calculate button */}
                {configs.length >= 2 && (
                    <button
                        onClick={handleSyncAndCalculate}
                        className="w-full py-3 rounded-md font-bold text-sm bg-pupr-blue hover:bg-blue-700 text-white shadow-sm shadow-blue-200/40 transition-all flex items-center justify-center gap-2"
                    >
                        <Layers className="w-4 h-4" />
                        Hitung Thiessen & Simpan ke Pipeline
                    </button>
                )}

                {configs.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-sm">
                        <Plus className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        Tambahkan minimal 2 stasiun untuk memulai.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ThiessenCalculator;
