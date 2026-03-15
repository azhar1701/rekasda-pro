import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X, CheckCircle, Download, Save, AlertTriangle, Activity } from 'lucide-react';
import { DataInputTable } from './FrequencyAnalysisModal/DataInputTable';
import { Metric } from '@/components/ui/Metric';
import { AnnualMaxGrid } from './FrequencyAnalysisModal/AnnualMaxGrid';
import { calculateStatistics, performFrequencyAnalysis, type DistributionMethod } from '@/lib/engine/statistics/frequency';
import { validateDistributionFit } from '@/lib/engine/statistics/goodnessOfFit';
import { useHydrologyStore, type HasilAnalisisFrekuensi } from '@/stores/useHydrologyStore';
import { DataQualityDashboard } from '@/components/ui/DataQualityDashboard';
import { QCDetailsPanel } from '@/components/ui/QCDetailsPanel';
import { useDataQualityControl } from '@/hooks/useDataQualityControl';
import type { QCResult } from '@/lib/utils/qc/dataQualityMath';
import { extractAnnualMaximums } from '@/utils/rainfallSeriesUtils';

export interface RainfallDataPoint {
 year: number;
 value: number;
}

export type { DistributionMethod };

interface FrequencyAnalysisModalProps {
 isOpen: boolean;
 onClose: () => void;
 onSelectValue?: (period: number, value: number) => void;
}

export const FrequencyAnalysisModal: React.FC<FrequencyAnalysisModalProps> = ({
 isOpen,
 onClose,
 onSelectValue
}) => {
 const [data, setData] = useState<RainfallDataPoint[]>([
 { year: 2014, value: 80 },
 { year: 2015, value: 95 },
 { year: 2016, value: 110 },
 { year: 2017, value: 125 },
 { year: 2018, value: 140 },
 { year: 2019, value: 155 },
 { year: 2020, value: 170 },
 { year: 2021, value: 185 }
 ]);
 const [method, setMethod] = useState<DistributionMethod>('gumbel');
 const [statistics, setStatistics] = useState<any>(null);
 const [goodnessOfFit, setGoodnessOfFit] = useState<any>(null);
 const [results, setResults] = useState<any>(null);
 const [qcResult, setQcResult] = useState<QCResult | null>(null);
 const [showQCDetails, setShowQCDetails] = useState(false);
 const [editedRows, setEditedRows] = useState<Set<number>>(new Set());
 const [isAutofilled, setIsAutofilled] = useState(false);

 const {
 dataHujan, selectedStasiun, setHasilAnalisisFrekuensi, qcStatus, isQCOverridden,
 activeRainfallSource, setActiveRainfallSource,
 arealRainfallAlgebraic, arealRainfallThiessen, arealRainfallIsohyet
 } = useHydrologyStore();

 const { runQC } = useDataQualityControl();

 // ── Dynamic Data Routing ──
 const activeSeries = useMemo(() => {
 switch (activeRainfallSource) {
 case 'aljabar': return arealRainfallAlgebraic;
 case 'thiessen': return arealRainfallThiessen;
 case 'isohyet': return arealRainfallIsohyet;
 default: return dataHujan;
 }
 }, [activeRainfallSource, dataHujan, arealRainfallAlgebraic, arealRainfallThiessen, arealRainfallIsohyet]);

 const annualMaxData = useMemo(() => {
 if (!activeSeries || activeSeries.length === 0) return [];
 return extractAnnualMaximums(activeSeries).sort((a, b) => a.year - b.year);
 }, [activeSeries]);

 const isSourceMissing = activeRainfallSource !== 'titik' && (!activeSeries || activeSeries.length === 0);

 const sourceName = useMemo(() => {
 switch (activeRainfallSource) {
 case 'aljabar': return 'Rata-rata Aljabar';
 case 'thiessen': return 'Poligon Thiessen';
 case 'isohyet': return 'Garis Isohyet';
 default: return selectedStasiun ? `Stasiun: ${selectedStasiun.nama_stasiun}` : 'Data Titik';
 }
 }, [activeRainfallSource, selectedStasiun]);

 const canAutofill = annualMaxData.length > 0 && (selectedStasiun !== null || activeRainfallSource !== 'titik');

 // ── Auto-Sync Logic (SUPER PROMPT Implementation) ──
 useEffect(() => {
 if (annualMaxData.length > 0) {
 setData(annualMaxData);
 setEditedRows(new Set());
 setIsAutofilled(true);

 // Auto-run QC if enough data
 if (annualMaxData.length >= 10) {
 try {
 const result = runQC(annualMaxData.map(d => ({ tahun: d.year, hujan: d.value })));
 setQcResult(result);
 } catch (error) {
 console.error('QC auto-run failed:', error);
 }
 }
 } else {
 if (activeRainfallSource !== 'titik') {
 setData([]);
 setIsAutofilled(false);
 setQcResult(null);
 }
 }
 }, [annualMaxData, activeRainfallSource, runQC]);

 const handleAutofill = useCallback(() => {
 if (annualMaxData.length === 0) return;
 setData(annualMaxData);
 setEditedRows(new Set());
 setIsAutofilled(true);

 if (annualMaxData.length >= 10) {
 try {
 const result = runQC(annualMaxData.map(d => ({ tahun: d.year, hujan: d.value })));
 setQcResult(result);
 } catch (error) {
 console.error('QC failed:', error);
 }
 }
 }, [annualMaxData, runQC]);

 const handleDataChange = useCallback((newData: RainfallDataPoint[]) => {
 if (isAutofilled) {
 const newEdited = new Set(editedRows);
 newData.forEach((row, i) => {
 const original = annualMaxData.find(d => d.year === row.year);
 if (original && original.value !== row.value) newEdited.add(i);
 });
 setEditedRows(newEdited);
 }
 setData(newData);
 }, [isAutofilled, editedRows, annualMaxData]);

 const handleRunQC = useCallback(() => {
 if (data.length < 10) return;
 try {
 const result = runQC(data.map(d => ({ tahun: d.year, hujan: d.value })));
 setQcResult(result);
 } catch (error) {
 console.error('QC failed:', error);
 }
 }, [data, runQC]);

 const canProceedToAnalysis = qcStatus && (qcStatus.konsisten && qcStatus.bebasOutlier && qcStatus.homogen || isQCOverridden);

 useEffect(() => {
 if (data.length >= 3 && canProceedToAnalysis) {
 try {
 const values = data.map(d => d.value);
 const stats = calculateStatistics(values);
 const fit = validateDistributionFit(values, method);
 const analysis = performFrequencyAnalysis({ data: values, returnPeriods: [2, 5, 10, 25, 50, 100] }, method);
 setStatistics(stats);
 setGoodnessOfFit(fit);
 setResults(analysis);
 } catch (error) {
 const values = data.map(d => d.value);
 const stats = calculateStatistics(values);
 setStatistics(stats);
 setGoodnessOfFit(null);
 setResults(null);
 }
 }
 }, [data, method, canProceedToAnalysis]);

 const handleSaveToStore = useCallback(() => {
 if (!results || !goodnessOfFit) return;
 const hasil: HasilAnalisisFrekuensi = {
 metodeTerpilih: method === 'logpearson3' ? 'Log-Pearson III' : method === 'gumbel' ? 'Gumbel' : method === 'lognormal' ? 'Log-Normal' : 'Normal',
 lulusUjiKecocokan: goodnessOfFit.isValid,
 curahHujanRencana: results.designValues.map((item: any) => ({
 kalaUlang: item.returnPeriod,
 curahHujan: Number(item.designValue.toFixed(2)),
 })),
 selectedKalaUlang: null,
 };
 setHasilAnalisisFrekuensi(hasil);
 onClose();
 }, [results, goodnessOfFit, method, setHasilAnalisisFrekuensi, onClose]);

 if (!isOpen) return null;

 const modalContent = (
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
 <div className="absolute inset-0 bg-black/50 " onClick={onClose}></div>
 <div className="bg-white dark:bg-[#0f172a] rounded-sm w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto relative z-10 shadow-none border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
 <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 bg-slate-50 dark:bg-slate-900">
 <div>
 <div className="flex items-center gap-3">
 <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Analisis Frekuensi Hujan</h2>
 <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded-sm tracking-widest uppercase border border-slate-200 dark:border-slate-700 shadow-none">SNI 2415:2016</span>
 </div>
 <p className="text-[10px] font-extrabold uppercase tracking-widest text-pupr-blue mt-1.5 flex items-center gap-1.5">
 <span className="w-2 h-2 rounded-none bg-emerald-500 animate-pulse"></span>
 Sumber: {sourceName}
 </p>
 </div>
 <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-sm group">
 <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-4">
 {/* Source Selection Pills (GovTech style) */}
 <div className="mb-6 p-1 bg-slate-100 rounded-sm flex items-center gap-1 border border-slate-200 dark:border-slate-700">
 {[
 { id: 'titik', label: 'Data Titik' },
 { id: 'aljabar', label: 'Rata-rata Aljabar' },
 { id: 'thiessen', label: 'Poligon Thiessen' },
 { id: 'isohyet', label: 'Garis Isohyet' },
 ].map((source) => (
 <button
 key={source.id}
 onClick={() => {
 setActiveRainfallSource(source.id as any);
 setIsAutofilled(false); // Reset autofill if source changes
 }}
 className={cn(
 "flex-1 py-2 text-xs font-bold uppercase tracking-tight rounded-sm transition-all",
 activeRainfallSource === source.id
 ? "bg-pupr-blue text-white shadow-blue-900/10"
 : "text-slate-500 hover:text-slate-700 dark:text-slate-300 hover:bg-white dark:bg-slate-900"
 )}
 >
 {source.label}
 </button>
 ))}
 </div>

 <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
 <div className="col-span-12 md:col-span-5 space-y-4">
 {isSourceMissing ? (
 <div className="p-5 bg-red-50 border-2 border-red-200 rounded-sm flex flex-col gap-3 animate-in zoom-in-95 duration-75">
 <div className="flex items-center gap-2">
 <div className="bg-red-100 p-2 rounded-sm">
 <AlertTriangle className="w-5 h-5 text-red-600" />
 </div>
 <h4 className="text-sm font-extrabold text-red-900 uppercase tracking-tight">Data Belum Tersedia</h4>
 </div>
 <p className="text-xs leading-relaxed text-red-800 font-bold italic">
 Data Hujan Wilayah <span className="underline decoration-red-400 decoration-2 underline-offset-2">{sourceName}</span> belum dihitung. Silakan kembali ke Modul Maestro/Master Data (Hujan Wilayah).
 </p>
 </div>
 ) : (
 <div className="space-y-4 animate-in fade-in duration-75">
 {isAutofilled && (
 <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-3 ">
 <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
 <CheckCircle className="w-3 h-3 text-emerald-500" />
 Summary Puncak Tahunan ({sourceName})
 </h4>
 <AnnualMaxGrid data={data} />
 </div>
 )}

 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm p-1 overflow-hidden">
 <DataInputTable data={data} onChange={handleDataChange} editedRows={editedRows} />
 </div>

 {canAutofill && !isAutofilled && (
 <button onClick={handleAutofill} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-sm text-xs font-bold transition-all bg-pupr-blue text-white hover:bg-blue-800 ">
 <Download className="w-4 h-4" />
 Tarik Data Maksimum Tahunan
 </button>
 )}
 </div>
 )}
 </div>

 <div className="col-span-12 md:col-span-7 flex flex-col gap-4">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 <Metric label="Jumlah Data" value={data.length} density="compact" variant="slate" />
 <Metric label="Rata-rata" value={statistics?.mean || 0} density="compact" variant="slate" />
 <Metric label="Std Deviasi" value={statistics?.stdDev || 0} density="compact" variant="slate" />
 <Metric label="Skewness (Cs)" value={statistics?.cs || 0} density="compact" variant="slate" />
 </div>

 {data.length >= 10 && (
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
 <Activity className="w-4 h-4 text-pupr-blue" />
 Quality Control Data
 </h3>
 <button onClick={handleRunQC} className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-sm transition-colors">
 Jalankan QC
 </button>
 </div>
 <DataQualityDashboard />
 {qcResult && (
 <button onClick={() => setShowQCDetails(!showQCDetails)} className="w-full text-xs text-pupr-blue hover:text-pupr-blue font-medium py-2">
 {showQCDetails ? 'Sembunyikan' : 'Tampilkan'} Detail Uji Statistik
 </button>
 )}
 {showQCDetails && qcResult && <QCDetailsPanel result={qcResult} />}
 </div>
 )}

 {data.length < 10 && (
 <div className="bg-amber-50 border border-amber-200 rounded-sm p-3">
 <div className="flex items-center gap-2">
 <span className="text-amber-600 font-medium text-sm">⚠️</span>
 <span className="text-amber-800 text-sm font-medium">
 Data minimal 10 tahun untuk QC. Saat ini: {data.length} tahun.
 </span>
 </div>
 </div>
 )}

 {canProceedToAnalysis && goodnessOfFit && (
 <div className={`border rounded-sm p-3 ${goodnessOfFit.isValid ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <CheckCircle className={`w-4 h-4 ${goodnessOfFit.isValid ? 'text-emerald-600' : 'text-amber-600'}`} />
 <span className={`text-sm font-medium ${goodnessOfFit.isValid ? 'text-emerald-900' : 'text-amber-900'}`}>
 Uji Kecocokan: {goodnessOfFit.isValid ? 'LULUS' : 'PERINGATAN'}
 </span>
 </div>
 <div className="flex gap-2 text-xs">
 <span className={`px-2 py-1 rounded ${goodnessOfFit.chiSquare.isAccepted ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
 χ²: {goodnessOfFit.chiSquare.isAccepted ? '✓' : '✗'}
 </span>
 <span className={`px-2 py-1 rounded ${goodnessOfFit.kolmogorovSmirnov.isAccepted ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
 KS: {goodnessOfFit.kolmogorovSmirnov.isAccepted ? '✓' : '✗'}
 </span>
 </div>
 </div>
 </div>
 )}

 {canProceedToAnalysis && (
 <div className="xl:col-span-2 space-y-6">
 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm p-4">
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Metode Distribusi</h3>
 <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
 {method === 'logpearson3' ? 'Log-Pearson III' : method === 'gumbel' ? 'Gumbel' : method === 'lognormal' ? 'Log-Normal' : 'Normal'}
 </span>
 </div>
 <div className="flex gap-1 p-1 bg-slate-100 rounded-sm">
 {[
 { display: 'Log-Pearson III', value: 'logpearson3' as DistributionMethod },
 { display: 'Gumbel', value: 'gumbel' as DistributionMethod },
 { display: 'Normal', value: 'normal' as DistributionMethod }
 ].map((methodOption) => (
 <button key={methodOption.value} onClick={() => setMethod(methodOption.value)} className={`flex-1 px-3 py-2 text-xs font-medium rounded-sm transition-all ${method === methodOption.value ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 hover:bg-white dark:bg-slate-900'}`}>
 {methodOption.display}
 </button>
 ))}
 </div>
 </div>

 {results && (
 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden">
 <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Hasil Analisis Frekuensi</h3>
 <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{results.designValues.length} nilai</span>
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-xs">
 <thead className="bg-slate-50 dark:bg-slate-800">
 <tr>
 <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300 border-b">Kala Ulang</th>
 <th className="px-3 py-2 text-right font-medium text-slate-700 dark:text-slate-300 border-b">Intensitas (mm)</th>
 <th className="px-3 py-2 text-center font-medium text-slate-700 dark:text-slate-300 border-b">Aksi</th>
 </tr>
 </thead>
 <tbody>
 {results.designValues.map((item: any) => (
 <tr key={item.returnPeriod} className="border-b border-slate-100 hover:bg-slate-50 dark:bg-slate-800">
 <td className="px-3 py-2">
 <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">Q{item.returnPeriod}</span>
 </td>
 <td className="px-3 py-2 text-right">
 <span className="font-semibold text-teal-600">{item.designValue.toFixed(2)}</span>
 <span className="text-slate-500 ml-1">mm</span>
 </td>
 <td className="px-3 py-2 text-center">
 <button onClick={() => { onSelectValue?.(item.returnPeriod, item.designValue); onClose(); }} className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-teal-600 hover:bg-teal-50 rounded border border-teal-200 hover:border-teal-300">
 <CheckCircle className="w-3 h-3 mr-1" />
 Pilih
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex-shrink-0">
 <div className="flex items-center justify-between">
 <div className="text-xs text-slate-500">Pilih nilai untuk digunakan dalam perhitungan</div>
 <div className="flex items-center gap-3">
 <button onClick={handleSaveToStore} disabled={!canProceedToAnalysis || !results || !goodnessOfFit} className={`flex items-center gap-2 px-5 py-2.5 font-bold rounded-sm text-sm transition-all ${canProceedToAnalysis && results && goodnessOfFit ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/40' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`}>
 <Save className="w-4 h-4" />
 Simpan & Gunakan untuk Modul Banjir
 </button>
 <button onClick={onClose} className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-sm transition-colors text-sm">
 Tutup
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 );

 return createPortal(modalContent, document.body);
};
