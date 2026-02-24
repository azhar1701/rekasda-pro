import React, { useEffect, useState } from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { Button } from '@/components/ui/Button';
import { CloudRain, Plus, Upload, MapPin, Calendar, Activity, ChevronDown } from 'lucide-react';

export const MasterHidrologiTab: React.FC = () => {
    const {
        stasiunList,
        selectedStasiun,
        dataHujan,
        isLoading,
        fetchStasiun,
        selectStasiun,
        fetchDataHujan
    } = useHydrologyStore();

    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        fetchStasiun();
    }, [fetchStasiun]);

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const year = parseInt(e.target.value, 10);
        setSelectedYear(year);
        if (selectedStasiun) {
            fetchDataHujan(selectedStasiun.id, year);
        }
    };

    return (
        <ModuleLayout
            title="Master Data Hidrologi"
            description="Single Source of Truth untuk Data Curah Hujan RekaSDA"
            icon={<CloudRain className="w-6 h-6" />}
            iconColorClass="bg-teal-50 text-teal-600"
            actions={
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl font-bold bg-white/80 backdrop-blur border-teal-200 text-teal-700 hover:bg-teal-50">
                        <Upload className="w-4 h-4 mr-2" />
                        Import (Excel/CSV)
                    </Button>
                    <Button className="rounded-xl font-bold bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Stasiun
                    </Button>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] min-h-[600px] page-enter py-2">

                {/* KOLOM KIRI: Daftar Stasiun (Span 4) */}
                <div className="lg:col-span-4 lg:col-start-1 flex flex-col h-full overflow-hidden bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-xl shadow-slate-200/50">
                    <div className="p-5 border-b border-slate-200/50 bg-white/40 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-teal-500" />
                            Daftar Stasiun
                        </h3>
                        <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">{stasiunList.length} Total</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {isLoading && stasiunList.length === 0 ? (
                            <div className="flex justify-center items-center h-40">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                            </div>
                        ) : (
                            stasiunList.map((stasiun) => {
                                const isActive = selectedStasiun?.id === stasiun.id;
                                return (
                                    <div
                                        key={stasiun.id}
                                        onClick={() => selectStasiun(stasiun)}
                                        className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 group
                      ${isActive
                                                ? 'bg-gradient-to-br from-teal-500 to-teal-600 border-teal-600 shadow-lg shadow-teal-500/20 text-white transform scale-[1.02]'
                                                : 'bg-white/80 border-slate-200 hover:border-teal-300 hover:shadow-md hover:bg-white text-slate-700'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className={`font-bold text-[15px] ${isActive ? 'text-white' : 'text-slate-800 group-hover:text-teal-700'}`}>
                                                {stasiun.nama_stasiun}
                                            </h4>
                                            <div className={`w-2 h-2 rounded-full mt-1.5 ${isActive ? 'bg-white animate-pulse' : 'bg-transparent'}`}></div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            <div className={`text-xs px-2 py-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-50'}`}>
                                                <span className="block text-[9px] uppercase tracking-wider mb-0.5 opacity-80">Elevasi</span>
                                                <span className="font-semibold font-mono">{stasiun.elevasi} m</span>
                                            </div>
                                            <div className={`text-xs px-2 py-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-50'}`}>
                                                <span className="block text-[9px] uppercase tracking-wider mb-0.5 opacity-80">Koordinat</span>
                                                <span className="font-semibold font-mono truncate" title={`${stasiun.koordinat_y}, ${stasiun.koordinat_x}`}>
                                                    {stasiun.koordinat_y?.toFixed(2)}, {stasiun.koordinat_x?.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* KOLOM KANAN: Tabel Data Runtut Waktu (Span 8) */}
                <div className="lg:col-span-8 flex flex-col h-full overflow-hidden bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-xl shadow-slate-200/50 relative">

                    {!selectedStasiun ? (
                        // EMPTY STATE
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-transparent to-slate-50/50">
                            <div className="w-24 h-24 mb-6 relative">
                                <div className="absolute inset-0 bg-teal-100 rounded-full blur-xl opacity-60"></div>
                                <div className="w-24 h-24 bg-white border border-teal-100 rounded-full shadow-sm flex items-center justify-center relative z-10">
                                    <Activity className="w-10 h-10 text-teal-400" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Stasiun Terpilih</h3>
                            <p className="text-sm text-slate-500 max-w-sm">
                                Silakan pilih salah satu stasiun hujan di panel sebelah kiri untuk melihat detail data curah hujan historis.
                            </p>
                        </div>
                    ) : (
                        // DATA TABLE STATE
                        <>
                            {/* Toolbar Atas Tabel */}
                            <div className="p-5 border-b border-slate-200/50 bg-white/40 flex flex-wrap justify-between items-center shrink-0 gap-4">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                        <CloudRain className="w-5 h-5 text-teal-500" />
                                        Data Curah Hujan
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">Stasiun: <span className="font-bold text-slate-700">{selectedStasiun.nama_stasiun}</span></p>
                                </div>

                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:inline">Tahun</span>
                                    <div className="relative">
                                        <select
                                            value={selectedYear}
                                            onChange={handleYearChange}
                                            className="appearance-none bg-transparent border-none text-sm font-bold text-slate-800 pr-6 pl-1 py-1 focus:ring-0 cursor-pointer outline-none"
                                        >
                                            {[2026, 2025, 2024, 2023, 2022].map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Tabel Container */}
                            <div className="flex-1 overflow-auto bg-slate-50/30 p-4 sm:p-6 custom-scrollbar relative">
                                {isLoading ? (
                                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
                                        <div className="flex flex-col items-center">
                                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-teal-600 mb-4"></div>
                                            <p className="text-sm font-semibold text-slate-600 animate-pulse">Memuat Data...</p>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <th className="py-3 px-4 font-semibold w-16 text-center">No</th>
                                                <th className="py-3 px-4 font-semibold">Tanggal</th>
                                                <th className="py-3 px-4 font-semibold text-right">Curah Hujan (mm)</th>
                                                <th className="py-3 px-4 font-semibold text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {dataHujan.length === 0 && !isLoading ? (
                                                <tr>
                                                    <td colSpan={4} className="py-12 text-center text-slate-500">
                                                        Tidak ada data curah hujan untuk tahun {selectedYear}.
                                                    </td>
                                                </tr>
                                            ) : (
                                                dataHujan.map((row, index) => {
                                                    // Simple UI categorization for rain intensity (mock logic)
                                                    let statusLabel = "Kering";
                                                    let statusColor = "bg-slate-100 text-slate-600";
                                                    if (row.curah_hujan > 0 && row.curah_hujan <= 20) {
                                                        statusLabel = "Ringan";
                                                        statusColor = "bg-blue-50 text-blue-600";
                                                    } else if (row.curah_hujan > 20 && row.curah_hujan <= 50) {
                                                        statusLabel = "Sedang";
                                                        statusColor = "bg-indigo-50 text-indigo-600";
                                                    } else if (row.curah_hujan > 50) {
                                                        statusLabel = "Lebat";
                                                        statusColor = "bg-rose-50 text-rose-600";
                                                    }

                                                    return (
                                                        <tr key={row.id} className="hover:bg-teal-50/30 transition-colors">
                                                            <td className="py-2.5 px-4 text-center text-slate-400 font-mono text-xs">{index + 1}</td>
                                                            <td className="py-2.5 px-4 font-medium text-slate-700">
                                                                {new Date(row.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </td>
                                                            <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                                                                {row.curah_hujan.toFixed(1)}
                                                            </td>
                                                            <td className="py-2.5 px-4 text-center">
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${statusColor}`}>
                                                                    {statusLabel}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </ModuleLayout>
    );
};
