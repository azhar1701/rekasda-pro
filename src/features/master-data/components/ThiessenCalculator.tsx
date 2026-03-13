import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useHydrologyStore, type ThiessenStasiunConfig } from '@/stores/useHydrologyStore';
import { Layers, Plus, Trash2, AlertTriangle, Search, Filter, CheckCircle2, Database } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

/**
 * ThiessenCalculator — Professional Station Selection & weight-average tool.
 * Integrated as Step 1 of the Spatial Analysis Workflow.
 */
export const ThiessenCalculator: React.FC = () => {
    const { 
        stasiunList, 
        projectStationIds,
        toggleProjectStation,
        luasDas, 
        hasilThiessen, 
        setHasilThiessen, 
        fetchMultipleStationsData,
        qcStatus 
    } = useHydrologyStore();

    // Local state for searching available database stations
    const [isExpanded, setIsExpanded] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterHealthy, setFilterHealthy] = useState(false);

    // 1. Available stations from Master Database (not yet enrolled)
    const availableFromDatabase = useMemo(() => {
        return stasiunList.filter(s => {
            const notEnrolled = !projectStationIds.includes(s.id);
            const matchesSearch = s.nama_stasiun.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (filterHealthy) {
                const status = qcStatus?.[s.id];
                const isHealthy = status?.konsisten && status?.bebasOutlier && status?.homogen;
                return notEnrolled && matchesSearch && isHealthy;
            }
            
            return notEnrolled && matchesSearch;
        });
    }, [stasiunList, projectStationIds, searchTerm, filterHealthy, qcStatus]);

    // 2. Local configs for enrolled stations (to manage influence area inputs)
    const [configs, setConfigs] = useState<ThiessenStasiunConfig[]>(() => {
        return projectStationIds.map(id => {
            const stasiun = stasiunList.find(s => s.id === id);
            const existingHasil = hasilThiessen?.stasiunConfigs?.find(c => c.stasiunId === id);
            
            return {
                stasiunId: id,
                namaStasiun: stasiun?.nama_stasiun || 'Unknown',
                luasPengaruh: existingHasil?.luasPengaruh || 0,
                bobot: existingHasil?.bobot || 0,
            };
        });
    });

    // Sync local configs when enrollment changes globally
    useEffect(() => {
        setConfigs(prev => {
            return projectStationIds.map(id => {
                const existing = prev.find(p => p.stasiunId === id);
                if (existing) return existing;
                
                const stasiun = stasiunList.find(s => s.id === id);
                return {
                    stasiunId: id,
                    namaStasiun: stasiun?.nama_stasiun || 'Unknown',
                    luasPengaruh: 0,
                    bobot: 0,
                };
            });
        });
    }, [projectStationIds, stasiunList]);

    // Total area for weight calculation
    const totalLuas = useMemo(
        () => configs.reduce((sum, c) => sum + (typeof c.luasPengaruh === 'string' ? parseFloat(c.luasPengaruh) || 0 : c.luasPengaruh), 0),
        [configs]
    );

    // Auto-calculate weights (W = Ai / Atotal)
    const configsWithBobot = useMemo(
        () => configs.map(c => {
            const safeLuas = typeof c.luasPengaruh === 'string' ? parseFloat(c.luasPengaruh) || 0 : c.luasPengaruh;
            return {
                ...c,
                bobot: totalLuas > 0 ? safeLuas / totalLuas : 0,
            };
        }),
        [configs, totalLuas]
    );

    const handleLuasChange = useCallback((stasiunId: string, value: string) => {
        setConfigs(prev => prev.map(c =>
            c.stasiunId === stasiunId ? { ...c, luasPengaruh: value as any } : c
        ));
    }, []);

    const handleSyncAndCalculate = async () => {
        if (configs.length === 0) return;
        
        const ids = configs.map(c => c.stasiunId);
        await fetchMultipleStationsData(ids);
        
        // Strict Engineering Check: If Area is set, Thiessen total should match
        const areaVal = typeof luasDas === 'string' ? parseFloat(luasDas) : (luasDas || 0);
        if (areaVal > 0 && Math.abs(totalLuas - areaVal) > 0.1) {
            toast.warning(`Perhatian: Total Luas Thiessen (${totalLuas.toFixed(2)}) tidak sinkron dengan Luas DAS (${areaVal.toFixed(2)}).`);
        }

        try {
            setHasilThiessen({
                stasiunConfigs: configsWithBobot.map(c => ({ 
                    ...c, 
                    luasPengaruh: typeof c.luasPengaruh === 'string' ? parseFloat(c.luasPengaruh) || 0 : c.luasPengaruh 
                })),
                totalLuas: totalLuas,
                hujanRataRataDAS: [], 
            });
            toast.success(`Konfigurasi ${configsWithBobot.length} stasiun berhasil disimpan ke project.`);
        } catch (err: any) {
            toast.error(err.message || 'Gagal menghitung.');
        }
    };

    return (
        <div className="border border-slate-300 rounded-md bg-white shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-pupr-yellow" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em]">Tahap 1: Seleksi Stasiun Project</h4>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest mr-2">Status: {projectStationIds.length} Aktif</span>
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)} 
                        className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
                    >
                        {isExpanded ? 'Minimize' : 'Buka Tool'}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 space-y-4">
                    {/* Database Search (Available Stations) */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Database Master (Klik stasiun untuk memasukkan ke Project)</label>
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text"
                                    placeholder="Cari stasiun di database master..."
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-pupr-blue/20 outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={() => setFilterHealthy(!filterHealthy)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap",
                                    filterHealthy ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                )}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Hanya Data QC
                            </button>
                        </div>

                        {availableFromDatabase.length > 0 ? (
                            <div className="bg-slate-50 rounded-md border border-slate-200 p-2 max-h-[140px] overflow-y-auto scrollbar-thin">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {availableFromDatabase.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => toggleProjectStation(s.id)}
                                            className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded hover:border-pupr-blue hover:shadow-sm transition-all group text-left"
                                        >
                                            <span className="text-[11px] font-bold text-slate-700 truncate">{s.nama_stasiun}</span>
                                            <Plus className="w-3 h-3 text-slate-300 group-hover:text-pupr-blue" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : searchTerm && (
                            <div className="text-center py-4 bg-slate-50 rounded border border-dashed border-slate-300 text-xs text-slate-400">
                                Stasiun tidak ditemukan atau sudah masuk project
                            </div>
                        )}
                    </div>

                    {/* Selected Analysis Table */}
                    {configs.length > 0 ? (
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-pupr-blue"></div>
                                Konfigurasi Area Thiessen untuk Project Ini
                            </h5>
                            <div className="border border-slate-200 rounded-md overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-[10px] font-black text-slate-500 uppercase tracking-tighter">Nama Stasiun</th>
                                            <th className="px-3 py-2 text-right text-[10px] font-black text-slate-500 uppercase tracking-tighter">Luas Pengaruh (km²)</th>
                                            <th className="px-3 py-2 text-right text-[10px] font-black text-slate-500 uppercase tracking-tighter">Bobot (%)</th>
                                            <th className="w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {configsWithBobot.map(c => (
                                            <tr key={c.stasiunId} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-3 py-2">
                                                    <p className="font-bold text-slate-800 text-xs">{c.namaStasiun}</p>
                                                    {qcStatus?.[c.stasiunId]?.konsisten ? (
                                                        <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-tighter">QC Passed</span>
                                                    ) : (
                                                        <span className="text-[8px] text-slate-400 font-medium uppercase tracking-tighter">Audit Pending</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={c.luasPengaruh || ''}
                                                        onChange={(e) => handleLuasChange(c.stasiunId, e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full text-right px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-pupr-blue outline-none font-bold"
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <span className="text-xs font-black text-pupr-blue tabular-nums">
                                                        {(c.bobot * 100).toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <button
                                                        onClick={() => toggleProjectStation(c.stasiunId)}
                                                        className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                                        title="Keluarkan dari project"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                                        <tr>
                                            <td className="px-3 py-2 text-[10px] text-slate-500 uppercase">Total Parameter</td>
                                            <td className="px-3 py-2 text-right text-xs text-slate-900 tabular-nums">{totalLuas.toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right text-xs text-pupr-blue tabular-nums">
                                                {totalLuas > 0 ? '100.0%' : '—'}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Validation Guard */}
                            {luasDas && totalLuas > 0 && Math.abs(totalLuas - (typeof luasDas === 'string' ? parseFloat(luasDas) : luasDas)) > 0.1 && (
                                <div className="flex items-start gap-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black text-amber-800 uppercase tracking-tighter">Spatial Mismatch Warning</p>
                                        <p className="text-[10px] text-amber-700 leading-tight italic">Total Luas Thiessen ({totalLuas.toFixed(2)} km²) harus sama dengan Luas DAS ({parseFloat(luasDas).toFixed(2)} km²).</p>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleSyncAndCalculate}
                                className="w-full py-3 bg-pupr-blue text-white rounded font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95"
                            >
                                Simpan Seleksi & Lanjut Analisis
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-slate-50 rounded-md border border-dashed border-slate-300">
                            <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-tight">Belum Ada Stasiun Project</p>
                            <p className="text-xs text-slate-400 mt-1">Gunakan search bar di atas untuk memilih stasiun dari database master.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ThiessenCalculator;
