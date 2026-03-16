import React, { useState, useMemo } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { Layers, Plus, Trash2, Search, CheckCircle2, Database } from 'lucide-react';
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



 const handleSyncAndCalculate = async () => {
 if (projectStationIds.length === 0) {
 toast.error('Pilih minimal satu stasiun untuk project ini.');
 return;
 }
 
 await fetchMultipleStationsData(projectStationIds);
 toast.success(`${projectStationIds.length} stasiun berhasil didaftarkan ke project.`);
 };

 return (
 <div className="border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-900 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-75">
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
 className="text-[10px] font-bold bg-white dark:bg-slate-900 hover:bg-white dark:bg-slate-900 px-2 py-1 rounded transition-colors"
 >
 {isExpanded ? 'Minimize' : 'Buka Tool'}
 </button>
 </div>
 </div>

 {isExpanded && (
 <div className="p-4 space-y-4">
 {/* Database Search (Available Stations) */}
 <div className="space-y-2">
 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Database Master (Klik stasiun untuk memasukkan ke Project)</label>
 <div className="flex flex-col md:flex-row gap-3">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
 <input 
 type="text"
 placeholder="Cari stasiun di database master..."
 className="min-h-[44px] w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-sm focus:ring-2 focus:ring-pupr-blue/20 outline-none"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 <button 
 onClick={() => setFilterHealthy(!filterHealthy)}
 className={cn(
 "flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-bold transition-all whitespace-nowrap",
 filterHealthy ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 dark:text-slate-500 hover:bg-slate-200"
 )}
 >
 <CheckCircle2 className="w-3.5 h-3.5" />
 Hanya Data QC
 </button>
 </div>

 {availableFromDatabase.length > 0 ? (
 <div className="bg-slate-50 dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 p-2 max-h-[140px] overflow-y-auto scrollbar-thin">
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
 {availableFromDatabase.map(s => (
 <button
 key={s.id}
 onClick={() => toggleProjectStation(s.id)}
 className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded hover:border-pupr-blue hover: transition-all group text-left"
 >
 <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{s.nama_stasiun}</span>
 <Plus className="w-3 h-3 text-slate-300 group-hover:text-pupr-blue" />
 </button>
 ))}
 </div>
 </div>
 ) : searchTerm && (
 <div className="text-center py-4 bg-slate-50 dark:bg-slate-800 rounded border border-dashed border-slate-300 dark:border-slate-600 text-xs text-slate-500">
 Stasiun tidak ditemukan atau sudah masuk project
 </div>
 )}
 </div>

 {/* Selected Analysis Table - Simplified to just list */}
 {projectStationIds.length > 0 ? (
 <div className="space-y-3 pt-2 border-t border-slate-100">
 <div className="flex justify-between items-center px-1">
 <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-sm bg-pupr-blue"></div>
 Stasiun Project Terpilih
 </h5>
 </div>

 <div className="border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden">
 <table className="w-full text-sm">
 <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
 <tr>
 <th className="px-3 py-2 text-left text-[10px] font-black text-slate-500 uppercase tracking-tighter">Nama Stasiun</th>
 <th className="px-3 py-2 text-center text-[10px] font-black text-slate-500 uppercase tracking-tighter">Status Data</th>
 <th className="w-10"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {projectStationIds.map(id => {
 const stasiun = stasiunList.find(s => s.id === id);
 return (
 <tr key={id} className="hover:bg-slate-50 dark:bg-slate-800 transition-colors">
 <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200 text-xs">
 {stasiun?.nama_stasiun || 'Unknown'}
 </td>
 <td className="px-3 py-2 text-center">
 {qcStatus?.[id]?.konsisten ? (
 <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-tighter">QC Passed</span>
 ) : (
 <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold bg-slate-100 text-slate-500 uppercase tracking-tighter">Pending Audit</span>
 )}
 </td>
 <td className="px-3 py-2 text-center">
 <button
 onClick={() => toggleProjectStation(id)}
 className="p-1 text-slate-300 hover:text-red-500 transition-colors"
 title="Keluarkan dari project"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>

 <button
 onClick={handleSyncAndCalculate}
 className="w-full py-3 bg-pupr-blue text-white rounded font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all "
 >
 Simpan Seleksi Stasiun
 </button>
 </div>
 ) : (
 <div className="text-center py-10 bg-slate-50 dark:bg-slate-800 rounded-sm border border-dashed border-slate-300 dark:border-slate-600">
 <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
 <p className="text-sm text-slate-500 font-bold uppercase tracking-tight">Belum Ada Stasiun Project</p>
 <p className="text-xs text-slate-500 mt-1">Gunakan search bar di atas untuk memilih stasiun dari database master.</p>
 </div>
 )}
 </div>
 )}
 </div>
 );
};

export default ThiessenCalculator;
