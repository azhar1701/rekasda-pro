import React, { useState, useEffect, useMemo } from 'react';
import { CloudRain, Edit, ChevronDown, ChevronUp, AlertCircle, Wand2, Satellite } from 'lucide-react';
import { useHydrologyStore, type DataHujan } from '@/stores/useHydrologyStore';

import { useDebounce } from '@/hooks/useDebounce';
import { infillMissingData } from '@/lib/utils/spatialMath';
import { fetchSatelliteRainfall } from '@/services/satelliteRainfallService';
import { toast } from '@/hooks/useToast';
export const DataHujanInputCard: React.FC = () => {
 const { dataHujan, updateDataHujanManual, selectedStasiun, stasiunList } = useHydrologyStore();
 const [isExpanded, setIsExpanded] = useState(false);
 const [localData, setLocalData] = useState<DataHujan[]>(dataHujan);
 const [isInfilling, setIsInfilling] = useState(false);
 const [isFetchingSatellite, setIsFetchingSatellite] = useState(false);
 const debouncedData = useDebounce(localData, 700);

 useEffect(() => {
 setLocalData(dataHujan);
 }, [dataHujan]);

 useEffect(() => {
 if (debouncedData.length > 0) {
 const cleanedData = debouncedData.map(d => ({
 ...d,
 curah_hujan: typeof d.curah_hujan === 'string' ? (d.curah_hujan === '' ? 0 : parseFloat(d.curah_hujan) || 0) : d.curah_hujan
 }));
 if (JSON.stringify(cleanedData) !== JSON.stringify(dataHujan)) {
 updateDataHujanManual(cleanedData);
 }
 }

 }, [debouncedData]);

 const stats = useMemo(() => {
 const values = localData.map(d => typeof d.curah_hujan === 'number' ? d.curah_hujan : parseFloat(String(d.curah_hujan)) || 0);
 const min = Math.min(...values);
 const max = Math.max(...values);
 const avg = values.reduce((a, b) => a + b, 0) / values.length;
 return { min, max, avg, count: values.length };
 }, [localData]);

 const handleValueChange = (id: string, value: string) => {
 setLocalData(prev => prev.map(d => d.id === id ? { ...d, curah_hujan: value as unknown as number } : d));
 };

 const handleInfillData = async () => {
 if (!selectedStasiun) return;
 setIsInfilling(true);

 try {
 const allData = dataHujan;
 await new Promise(resolve => setTimeout(resolve, 500));

 const filledData = localData.map(item => {
 const value = typeof item.curah_hujan === 'number' ? item.curah_hujan : parseFloat(String(item.curah_hujan)) || 0;
 if (value === 0) {
          const infillResult = infillMissingData(
            selectedStasiun,
            stasiunList,
            allData,
            item.tanggal,
            'idw'
          ) as { value: number; method: string; metadata?: string };
          
          return {
            ...item,
            curah_hujan: infillResult.value > 0 ? parseFloat(infillResult.value.toFixed(1)) : 0,
            is_infilled: infillResult.value > 0,
            keterangan: infillResult.value > 0 ? `Infilled via ${infillResult.method}${infillResult.metadata ? ` (${infillResult.metadata})` : ''}` : item.keterangan
          };
 }
 return item;
 });

 setLocalData(filledData);
 } finally {
 setIsInfilling(false);
 }
 };

 const handleFetchSatelliteData = async () => {
 if (!selectedStasiun || selectedStasiun.koordinat_x === null || selectedStasiun.koordinat_y === null) {
 toast.warning('Stasiun tidak memiliki koordinat (X, Y). Silakan lengkapi data stasiun terlebih dahulu.');
 return;
 }

 setIsFetchingSatellite(true);
 try {
 // Fetch satellite data (mock CHIRPS/GPM)
 const satelliteData = await fetchSatelliteRainfall(
 selectedStasiun.koordinat_y, // lat
 selectedStasiun.koordinat_x, // lon
 2010,
 2024
 );

 // Update local data with satellite data
 // We map the satellite data to the current station ID
 const mappedData = satelliteData.map(d => ({
 ...d,
 stasiun_id: selectedStasiun.id
 }));

 setLocalData(mappedData);
 updateDataHujanManual(mappedData);
 } catch (error) {
 console.error('Error fetching satellite data:', error);
 toast.error('Gagal mengambil data satelit. Silakan coba lagi.');
 } finally {
 setIsFetchingSatellite(false);
 }
 };


 return (
 <div className="border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-900">
 {/* Header */}
 <div className="border-b border-slate-200 dark:border-slate-700 bg-pupr-surface px-4 py-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-pupr-blue rounded-sm">
 <CloudRain className="w-5 h-5 text-white" />
 </div>
 <div>
 <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">15 Tahun Data Hujan Maksimum</h3>
 <p className="text-xs text-slate-600 dark:text-slate-500">
 Sumber: {selectedStasiun?.nama_stasiun || 'Stasiun Stasiun Cikampak'}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={handleFetchSatelliteData}
 disabled={isFetchingSatellite || !selectedStasiun || selectedStasiun.koordinat_x === null}
 className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm hover:bg-slate-50 dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 title="Tarik data curah hujan historis dari satelit (CHIRPS/GPM)"
 >
 <Satellite className={`w-4 h-4 text-pupr-blue ${isFetchingSatellite ? 'animate-spin' : ''}`} />
 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
 {isFetchingSatellite ? 'Menarik...' : 'Tarik Data Satelit'}
 </span>
 </button>
 <button
 onClick={handleInfillData}
 disabled={isInfilling || !selectedStasiun}
 className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm hover:bg-slate-50 dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 title="Isi data kosong (0) menggunakan metode IDW/Normal Ratio"
 >
 <Wand2 className={`w-4 h-4 text-pupr-blue ${isInfilling ? 'animate-pulse' : ''}`} />
 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
 {isInfilling ? 'Memproses...' : 'Isi Data Kosong'}
 </span>
 </button>
 <button
 onClick={() => setIsExpanded(!isExpanded)}
 className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm hover:bg-slate-50 dark:bg-slate-800 transition-colors"
 >
 <Edit className="w-4 h-4 text-pupr-blue" />
 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Edit</span>
 </button>
 </div>
 </div>

 {/* Body - Preview Mode */}
 <div className="p-4">
 {/* Statistics */}
 <div className="flex items-center gap-6 mb-4 text-sm">
 <div>
 <span className="text-slate-300">Min: </span>
 <span className="font-medium text-white tabular-nums">{stats.min.toFixed(1)}</span>
 <span className="text-slate-300 ml-1">mm</span>
 </div>
 <div>
 <span className="text-slate-300">Max: </span>
 <span className="font-medium text-white tabular-nums">{stats.max.toFixed(1)}</span>
 <span className="text-slate-300 ml-1">mm</span>
 </div>
 <div>
 <span className="text-slate-300">Rata-rata: </span>
 <span className="font-medium text-white tabular-nums">{stats.avg.toFixed(1)}</span>
 <span className="text-slate-300 ml-1">mm</span>
 </div>
 </div>

 {/* Grid Preview - First 10 */}
 <div className="grid grid-cols-5 gap-3 mb-3">
 {localData.slice(0, 10).map((item, idx) => {
 // const year = item.tanggal ? new Date(item.tanggal).getFullYear() : idx + 1;
 const value = typeof item.curah_hujan === 'number' ? item.curah_hujan : parseFloat(String(item.curah_hujan)) || 0;
 const isOutlier = value > 300;
 return (
 <div key={item.id} className={`border rounded-sm p-3 ${isOutlier ? 'border-red-300 bg-red-50' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'}`}>
 <div className="flex items-center justify-between mb-1">
 <div className="text-xs text-slate-600 dark:text-slate-500">Tahun {idx + 1}</div>
 {isOutlier && (
 <span title="Outlier (>300 mm)">
 <AlertCircle className="w-3.5 h-3.5 text-red-500" />
 </span>
 )}
 </div>
 <div className={`text-lg font-bold tabular-nums ${isOutlier ? 'text-red-700' : 'text-slate-900 dark:text-slate-100'}`}>{value.toFixed(1)}</div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Expand Button */}
 {localData.length > 10 && (
 <button
 onClick={() => setIsExpanded(!isExpanded)}
 className="w-full py-2 text-sm text-pupr-blue font-medium hover:bg-slate-50 dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-colors"
 >
 {isExpanded ? (
 <>
 <ChevronUp className="w-4 h-4" />
 Sembunyikan
 </>
 ) : (
 <>
 <ChevronDown className="w-4 h-4" />
 +{localData.length - 10} data lainnya
 </>
 )}
 </button>
 )}

 {/* Expanded Table */}
 {isExpanded && (
 <div className="mt-4 border border-slate-300 dark:border-slate-600 rounded-sm overflow-hidden">
 <table className="w-full text-sm">
 <thead className="bg-pupr-blue text-white">
 <tr>
 <th className="px-3 py-2 text-left font-semibold">Tahun</th>
 <th className="px-3 py-2 text-left font-semibold">Tanggal</th>
 <th className="px-3 py-2 text-right font-semibold">Curah Hujan (mm)</th>
 </tr>
 </thead>
 <tbody>
 {localData.map((item, idx) => {
 const value = typeof item.curah_hujan === 'number' ? item.curah_hujan : parseFloat(String(item.curah_hujan)) || 0;
 const isOutlier = value > 300;
 return (
 <tr key={item.id} className={`border-b border-slate-200 dark:border-slate-700 ${isOutlier ? 'bg-red-50/50' : 'even:bg-slate-50 dark:bg-slate-800'}`}>
 <td className="px-3 py-2 text-slate-700 dark:text-slate-300 tabular-nums tracking-tight">Tahun {idx + 1}</td>
 <td className="px-3 py-2 tabular-nums tracking-tight">
 <input
 type="date"
 value={item.tanggal}
 onChange={(e) => setLocalData(prev => prev.map(d => d.id === item.id ? { ...d, tanggal: e.target.value } : d))}
 className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-sm focus:border-pupr-blue focus:ring-1 focus:ring-pupr-blue focus:outline-none"
 />
 </td>
 <td className="px-3 py-2 tabular-nums tracking-tight relative">
 <div className="relative">
 <input
 type="number"
 value={item.curah_hujan === 0 ? 0 : (item.curah_hujan ?? '')}
 onChange={(e) => handleValueChange(item.id, e.target.value)}
 className={`w-full px-2 py-1 text-right tabular-nums border rounded-sm focus:ring-1 focus:outline-none ${isOutlier
 ? 'border-red-300 text-red-700 focus:border-red-500 focus:ring-red-500'
 : 'border-slate-300 dark:border-slate-600 focus:border-pupr-blue focus:ring-pupr-blue'
 }`}
 placeholder="0.0"
 step="0.1"
 />
 {isOutlier && (
 <div className="absolute left-2 top-1/2 -translate-y-1/2">
 <AlertCircle className="w-4 h-4 text-red-500" />
 </div>
 )}
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 );
};
