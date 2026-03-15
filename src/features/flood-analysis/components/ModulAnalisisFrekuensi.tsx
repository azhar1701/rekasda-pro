import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, CheckCircle2, XCircle, AlertTriangle, Save, Download, Clipboard, TrendingUp, Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { ActionableEmptyState } from '@/components/ui/ActionableEmptyState';
import { WhiteBoxFormula } from '@/components/ui/WhiteBoxFormula';
import { toast } from '@/hooks/useToast';
import { useOnboarding } from '@/providers/OnboardingProvider';
import { SuccessCelebration } from '@/components/ui/feedback/SuccessCelebration';
import { HelpTooltip } from '@/components/ui/govtech';
import {
 calculateStatisticalParams,
 calculateDistributions,
 calculateGoodnessOfFit,
 selectBestMethod,
} from '@/lib/utils/frequencyMath';

const METHOD_LABELS: Record<string, string> = {
 normal: 'Normal',
 lognormal: 'Log Normal',
 gumbel: 'Gumbel',
 logpearson3: 'Log Pearson III'
};

export const ModulAnalisisFrekuensi: React.FC = () => {
 const {
 analisisFrekuensi, setAnalisisFrekuensi, dataHujan, selectedStasiun,
 activeRainfallSource, arealRainfallAlgebraic, arealRainfallThiessen, arealRainfallIsohyet
 } = useHydrologyStore();

 const [dataInput, setDataInput] = useState<number[]>([]);
 const [inputType, setInputType] = useState<'point' | 'areal_algebraic' | 'areal_thiessen' | 'areal_isohyet'>('point');
 const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
 const [isCalculated, setIsCalculated] = useState(false);
 const [showManualInput, setShowManualInput] = useState(false);
 const [showAllData, setShowAllData] = useState(false);
 const [selectedTr, setSelectedTr] = useState<number>(25);
 const [showCelebration, setShowCelebration] = useState(false);
 const { completeStep } = useOnboarding();

 const hasValidData = useMemo(() => {
 const hasEnoughPointData = dataHujan.length >= 10;
 const hasEnoughArealData = (arealRainfallAlgebraic?.length || 0) >= 10 ||
 (arealRainfallThiessen?.length || 0) >= 10 ||
 (arealRainfallIsohyet?.length || 0) >= 10;
 return hasEnoughPointData || hasEnoughArealData;
 }, [dataHujan, arealRainfallAlgebraic, arealRainfallThiessen, arealRainfallIsohyet]);

 // Workflow Sync: Default to saved Spatial Analysis method
 useEffect(() => {
 if (activeRainfallSource === 'thiessen') setInputType('areal_thiessen');
 else if (activeRainfallSource === 'aljabar') setInputType('areal_algebraic');
 else if (activeRainfallSource === 'isohyet') setInputType('areal_isohyet');
 else setInputType('point');
 }, [activeRainfallSource]);

 useEffect(() => {
 if (inputType === 'point' && dataHujan.length > 0) {
 const stasiunData = selectedStasiun
 ? dataHujan.filter(d => d.stasiun_id === selectedStasiun.id)
 : dataHujan;

 if (stasiunData.length > 0) {
 const byYear = new Map<number, number>();
 stasiunData.forEach(d => {
 const year = new Date(d.tanggal).getFullYear();
 const current = byYear.get(year) || 0;
 if (d.curah_hujan > current) byYear.set(year, d.curah_hujan);
 });
 const annualMax = Array.from(byYear.values());
 if (annualMax.length >= 1) setDataInput(annualMax);
 else setDataInput([]);
 } else {
 setDataInput([]);
 }
 } else if (inputType === 'areal_thiessen') {
 setDataInput(arealRainfallThiessen?.map(d => d.curah_hujan) || []);
 } else if (inputType === 'areal_algebraic') {
 setDataInput(arealRainfallAlgebraic?.map(d => d.curah_hujan) || []);
 } else if (inputType === 'areal_isohyet') {
 setDataInput(arealRainfallIsohyet?.map(d => d.curah_hujan) || []);
 }
 }, [dataHujan, selectedStasiun, inputType, arealRainfallAlgebraic, arealRainfallThiessen, arealRainfallIsohyet]);

 useEffect(() => {
 if (analisisFrekuensi) {
 setDataInput(analisisFrekuensi.dataHujanInput);
 setSelectedMethod(analisisFrekuensi.metodeTerpilih);
 setIsCalculated(true);
 }
 }, [analisisFrekuensi]);

 const { paramsAsli, paramsLog, distributions, goodnessOfFit, recommendedMethod } = useMemo(() => {
 if (dataInput.length < 10) {
 return { paramsAsli: null, paramsLog: null, distributions: null, goodnessOfFit: null, recommendedMethod: null };
 }

 // Gunakan consolidated module (single source of truth)
 const asli = calculateStatisticalParams(dataInput);
 const logData = dataInput.map(x => Math.log10(Math.max(x, 1e-10)));
 const log = calculateStatisticalParams(logData);

 // Hitung semua distribusi sekaligus (log-transform sudah di-handle internal)
 const dist = calculateDistributions(dataInput);

 // Goodness-of-Fit menggunakan tabel SNI lengkap
 const gof = calculateGoodnessOfFit(dataInput, dist);
 const recommended = selectBestMethod(gof);

 return {
 paramsAsli: { mean: asli.mean, stdDev: asli.stdDev, cv: asli.cv, cs: asli.cs, ck: asli.ck },
 paramsLog: { mean: log.mean, stdDev: log.stdDev, cv: log.cv, cs: log.cs, ck: log.ck },
 distributions: dist,
 goodnessOfFit: gof,
 recommendedMethod: recommended
 };
 }, [dataInput]);

 useEffect(() => {
 if (recommendedMethod && !selectedMethod) {
 setSelectedMethod(recommendedMethod);
 }
 }, [recommendedMethod, selectedMethod]);

 const handlePasteFromExcel = async () => {
 try {
 const text = await navigator.clipboard.readText();
 const lines = text.trim().split('\n');
 const values = lines
 .map(line => parseFloat(line.split('\t')[0]))
 .filter(v => !isNaN(v));
 if (values.length >= 10) {
 setDataInput(values);
 }
 } catch (err) {
 toast.error('Gagal membaca clipboard. Pastikan Anda sudah menyalin data dari Excel.');
 }
 };

 const handleCalculate = () => {
 if (!paramsAsli || !paramsLog || !distributions || !goodnessOfFit || !selectedMethod) return;

 const selectedDist = distributions.find(d => d.method === selectedMethod);
 if (!selectedDist) return;

 const curahHujanRencana = selectedDist.values.map(v => ({
 kalaUlang: v.Tr,
 curahHujan: v.R24,
 Tr: v.Tr,
 R24: v.R24
 }));

 setAnalisisFrekuensi({
 parameterStatistik: { asli: paramsAsli, log: paramsLog },
 hasilDistribusi: distributions,
 ujiKecocokan: goodnessOfFit,
 metodeTerpilih: selectedMethod,
 dataHujanInput: dataInput
 });

 const { setHasilAnalisisFrekuensi, setSelectedKalaUlang } = useHydrologyStore.getState();
 setHasilAnalisisFrekuensi({
 metodeTerpilih: selectedMethod,
 lulusUjiKecocokan: goodnessOfFit.find(g => g.method === selectedMethod)?.chiSquare.accepted || false,
 curahHujanRencana,
 selectedKalaUlang: 25
 });
 setSelectedKalaUlang(25);

 setIsCalculated(true);
 setShowCelebration(true);
 completeStep('frekuensi');
 toast.success('Hasil analisis frekuensi berhasil disimpan');
 };

 const handleExport = () => {
 if (!analisisFrekuensi) return;
 const data = JSON.stringify(analisisFrekuensi, null, 2);
 const blob = new Blob([data], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `analisis-frekuensi-${new Date().toISOString().split('T')[0]}.json`;
 a.click();
 };

 const getWhiteBoxFormula = (method: string, tr: number, value: number) => {
 if (!paramsAsli) return null;

 if (method === 'gumbel') {
 const yn = 0.5236;
 const sn = 1.128;
 const ytr = tr === 2 ? 0.3665 : tr === 5 ? 1.4999 : tr === 10 ? 2.2504 : tr === 25 ? 3.1985 : tr === 50 ? 3.9019 : 4.6001;

 return {
 title: `Gumbel - Kala Ulang ${tr} Tahun`,
 theoretical: `X_T = \\bar{X} + \\frac{Y_T - Y_n}{S_n} \\cdot S`,
 substituted: `X_{${tr}} = ${paramsAsli.mean.toFixed(2)} + \\frac{${ytr.toFixed(4)} - ${yn.toFixed(4)}}{${sn.toFixed(3)}} \\cdot ${paramsAsli.stdDev.toFixed(2)}`,
 result: `= ${value.toFixed(2)} \\text{ mm}`,
 variables: {
 '\\bar{X}': parseFloat(paramsAsli.mean.toFixed(2)),
 'S': parseFloat(paramsAsli.stdDev.toFixed(2)),
 'Y_T': parseFloat(ytr.toFixed(4)),
 'Y_n': parseFloat(yn.toFixed(4)),
 'S_n': parseFloat(sn.toFixed(3))
 }
 };
 }

 return null;
 };

 if (!hasValidData) {
 return (
 <ModuleLayout
 title="Analisis Frekuensi Hujan Ekstrem"
 description="Perhitungan probabilitas hujan rencana (SNI 2415:2016)"
 icon={<BarChart3 className="w-6 h-6" />}
 
 >
 <ActionableEmptyState
 title="Data Belum Lengkap"
 description="Lengkapi Data Master terlebih dahulu: (1) Data Curah Hujan minimal 10 tahun untuk setiap stasiun, (2) Morfometri DAS, (3) Tutupan Lahan."
 />
 </ModuleLayout>
 );
 }

 return (
 <ModuleLayout
 title="Analisis Frekuensi Hujan Ekstrem"
 description="Perhitungan probabilitas hujan rencana (SNI 2415:2016)"
 icon={<BarChart3 className="w-6 h-6" />}
 
 actions={
 isCalculated && (
 <button
 onClick={handleExport}
 className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-sm font-semibold hover:bg-slate-50 dark:bg-slate-800 transition-colors"
 >
 <Download className="w-4 h-4" />
 Export JSON
 </button>
 )
 }
 >
 <div className="space-y-5 py-2 animate-in fade-in slide-in-from-bottom-2 duration-75">
 {showCelebration && (
 <SuccessCelebration
 message="Analisis Frekuensi Hujan Ekstrem (SNI 2415:2016) berhasil diselesaikan!"
 onComplete={() => setShowCelebration(false)}
 />
 )}
 {/* TAHAP 1: Smart Data Context - Compressed Input */}
 <div className="rounded-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 ">
 <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3">
 <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Input Data Hujan</h3>
 </div>
 <div className="p-4">
 <div className="flex items-center gap-3 mb-4">
 <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sumber Data:</label>
 <div className="flex gap-2">
 {[
 { id: 'point', label: 'Data Titik (Stasiun)' },
 { id: 'areal_algebraic', label: 'Rata-rata Aljabar' },
 { id: 'areal_thiessen', label: 'Poligon Thiessen' },
 { id: 'areal_isohyet', label: 'Garis Isohyet' }
 ].map(opt => (
 <button
 key={opt.id}
 onClick={() => setInputType(opt.id as any)}
 className={`px-3 py-1 text-[10px] font-bold rounded-sm border transition-all ${inputType === opt.id
 ? 'bg-pupr-blue text-white border-pupr-blue'
 : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800'
 }`}
 >
 {opt.label}
 </button>
 ))}
 </div>
 </div>
 {inputType.startsWith('areal') && (
 <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-sm flex items-center gap-2">
 <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
 <span className="text-[10px] text-amber-800 font-medium">
 <b>Peringatan SNI:</b> Data gabungan (Areally averaged) tidak direkomendasikan untuk Analisis Frekuensi di beberapa standar. Pastikan metodologi sesuai dengan kerangka desain Anda.
 </span>
 </div>
 )}
 {dataInput.length >= 10 && !showManualInput ? (
 <div className="space-y-3">
 {/* Data Summary Card */}
 <div className="flex items-start justify-between p-3 bg-pupr-blue text-white rounded-sm border border-pupr-blue overflow-hidden ">
 <div className="flex items-start gap-3">
 <div className="p-2 bg-white dark:bg-slate-900 rounded-sm">
 <CheckCircle2 className="w-5 h-5 text-pupr-yellow" />
 </div>
 <div>
 <p className="text-sm font-semibold text-white mb-1">
 {dataInput.length} Tahun Data Hujan Maksimum
 </p>
 <p className="text-sm text-slate-300">
 Sumber: {
 inputType === 'areal_thiessen' ? 'Hujan Wilayah (Poligon Thiessen)' :
 inputType === 'areal_algebraic' ? 'Hujan Wilayah (Rata-rata Aljabar)' :
 inputType === 'areal_isohyet' ? 'Hujan Wilayah (Garis Isohyet)' :
 selectedStasiun ? `Stasiun ${selectedStasiun.nama_stasiun}` : 'Data Master'
 }
 </p>
 <div className="flex items-center gap-4 mt-2">
 <div className="flex items-center gap-1.5">
 <span className="text-xs font-medium text-slate-300">Min:</span>
 <span className="text-sm font-medium text-white font-mono tabular-nums">{Math.min(...dataInput).toFixed(1)} mm</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className="text-xs font-medium text-slate-300">Max:</span>
 <span className="text-sm font-medium text-white font-mono tabular-nums">{Math.max(...dataInput).toFixed(1)} mm</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className="text-xs font-medium text-slate-300">Rata-rata:</span>
 <span className="text-sm font-medium text-white font-mono tabular-nums">{(dataInput.reduce((a, b) => a + b, 0) / dataInput.length).toFixed(1)} mm</span>
 </div>
 </div>
 </div>
 </div>
 <button
 onClick={() => setShowManualInput(true)}
 className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm transition-colors"
 >
 ✏️ Edit
 </button>
 </div>

 {/* Quick Preview Grid */}
 <div>
 <div className="grid grid-cols-5 gap-2">
 {dataInput.slice(0, showAllData ? dataInput.length : 10).map((val, idx) => (
 <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm text-center p-3">
 <div className="text-xs text-slate-500">Tahun {idx + 1}</div>
 <div className="text-lg font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{val.toFixed(1)}</div>
 </div>
 ))}
 </div>
 {dataInput.length > 10 && (
 <button
 onClick={() => setShowAllData(!showAllData)}
 className="w-full mt-2 px-3 py-2 text-xs font-semibold text-pupr-blue hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-sm transition-colors"
 >
 {showAllData ? '▲ Sembunyikan' : `▼ Tampilkan Semua (${dataInput.length} data)`}
 </button>
 )}
 </div>
 </div>
 ) : (
 <div className="space-y-3">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
 <div>
 <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Input Data Hujan Maksimum Tahunan</h3>
 <p className="text-xs text-slate-600 dark:text-slate-500 mt-0.5">Masukkan minimal 10 tahun data untuk analisis frekuensi</p>
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <button
 onClick={handlePasteFromExcel}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-pupr-blue hover:bg-pupr-blue text-white text-xs font-semibold rounded-sm transition-colors"
 >
 <Clipboard className="w-3.5 h-3.5" />
 Paste Excel
 </button>
 {/* Automatic load happens via useEffect now */}

 {dataInput.length >= 10 && (
 <button
 onClick={() => setShowManualInput(false)}
 className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm transition-colors"
 >
 Selesai
 </button>
 )}
 </div>
 </div>
 <div className="relative">
 <textarea
 value={dataInput.map(v => v.toFixed(2)).join('\n')}
 onChange={(e) => setDataInput(e.target.value.split('\n').map(v => parseFloat(v.trim())).filter(v => !isNaN(v)))}
 className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm font-mono text-xs focus:border-pupr-blue focus:ring-1 focus:ring-pupr-blue focus:outline-none"
 rows={10}
 placeholder="Masukkan deret data hujan maksimum tahunan (satu nilai per baris)"
 />
 <div className="absolute bottom-2 right-2 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold">
 <span className={dataInput.length >= 10 ? 'text-green-600' : 'text-amber-600'}>
 {dataInput.length}/10
 </span>
 </div>
 </div>

 {dataInput.length > 0 && dataInput.length < 10 && (
 <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-sm flex items-center gap-2">
 <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
 <span className="text-xs text-amber-800">
 Tambahkan {10 - dataInput.length} data lagi untuk memulai analisis
 </span>
 </div>
 )}

 {dataInput.length >= 10 && (
 <div className="p-2.5 bg-green-50 border border-green-200 rounded-sm flex items-center gap-2">
 <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
 <span className="text-xs text-green-800 font-semibold">
 Data cukup! Klik "Selesai" untuk melanjutkan analisis
 </span>
 </div>
 )}
 </div>
 )}
 </div>
 </div>

 {/* TAHAP 2: Grid 2 Kolom - Parameter Statistik & Uji Kecocokan */}
 {dataInput.length >= 10 && paramsAsli && paramsLog && goodnessOfFit && (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
 {/* Kolom Kiri: Parameter Statistik */}
 <div className="rounded-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 ">
 <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3">
 <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">1. Parameter Statistik</h3>
 </div>
 <div className="p-4">
 <div className="overflow-x-auto">
 <table className="w-full text-xs">
 <thead>
 <tr className="bg-pupr-blue text-white">
 <th className="px-3 py-2 text-left font-semibold text-sm">Parameter</th>
 <th className="px-3 py-2 text-right font-semibold text-sm">Asli</th>
 <th className="px-3 py-2 text-right font-semibold text-sm">Log</th>
 </tr>
 </thead>
 <tbody>
 <tr className="border-b border-slate-100 even:bg-slate-50 dark:bg-slate-800">
 <td className="px-3 py-2 font-medium flex items-center gap-1 tabular-nums tracking-tight">
 Mean (X̄)
 <div className="opacity-0 group-hover:opacity-100 transition-opacity">
 <div className="relative inline-block">
 <Info className="w-3 h-3 text-slate-500 cursor-help" />
 <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
 Rata-rata data
 </span>
 </div>
 </div>
 </td>
 <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsAsli.mean.toFixed(2)}</td>
 <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsLog.mean.toFixed(4)}</td>
 </tr>
 <tr className="border-b border-slate-100 even:bg-slate-50 dark:bg-slate-800">
 <td className="px-3 py-2 font-medium tabular-nums tracking-tight">Std Dev (S)</td>
 <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsAsli.stdDev.toFixed(2)}</td>
 <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsLog.stdDev.toFixed(4)}</td>
 </tr>
 <tr className="border-b border-slate-100 even:bg-slate-50 dark:bg-slate-800">
 <td className="px-3 py-2 font-medium tabular-nums tracking-tight">CV</td>
 <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsAsli.cv.toFixed(3)}</td>
 <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsLog.cv.toFixed(3)}</td>
 </tr>
 <tr className="border-b border-slate-100 even:bg-slate-50 dark:bg-slate-800">
 <td className="px-3 py-2 font-medium tabular-nums tracking-tight">Skewness (Cs)</td>
 <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsAsli.cs.toFixed(3)}</td>
 <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsLog.cs.toFixed(3)}</td>
 </tr>
 <tr className="even:bg-slate-50 dark:bg-slate-800">
 <td className="px-3 py-2 font-medium tabular-nums tracking-tight">Kurtosis (Ck)</td>
 <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsAsli.ck.toFixed(3)}</td>
 <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{paramsLog.ck.toFixed(3)}</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* Kolom Kanan: Uji Kecocokan */}
 <div className="rounded-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 ">
 <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3">
 <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">2. Uji Kecocokan</h3>
 </div>
 <div className="p-4">
 <div className="overflow-x-auto">
 <table className="w-full text-xs">
 <thead>
 <tr className="bg-pupr-blue text-white">
 <th className="px-3 py-2 text-left font-semibold text-sm">Metode</th>
 <th className="px-3 py-2 text-center font-semibold text-sm">Chi-Sq</th>
 <th className="px-3 py-2 text-center font-semibold text-sm">K-S</th>
 <th className="px-3 py-2 text-center font-semibold text-sm">Status</th>
 </tr>
 </thead>
 <tbody>
 {goodnessOfFit.map((gof) => {
 const bothPassed = gof.chiSquare.accepted && gof.kolmogorovSmirnov.accepted;
 const isRecommended = gof.method === recommendedMethod;
 return (
 <tr
 key={gof.method}
 className={`border-b border-slate-100 even:bg-slate-50 dark:bg-slate-800 transition-all cursor-pointer hover:bg-pupr-surface ${isRecommended ? 'bg-pupr-surface/30' : ''
 }`}
 onClick={() => bothPassed && setSelectedMethod(gof.method)}
 title={bothPassed ? 'Klik untuk memilih metode ini' : 'Metode ditolak'}
 >
 <td className="px-3 py-2 font-semibold flex items-center gap-1 tabular-nums tracking-tight">
 {METHOD_LABELS[gof.method]}
 {isRecommended && <span className="text-[9px] bg-pupr-blue text-white px-1 rounded">★</span>}
 </td>
 <td className="px-3 py-2 text-center tabular-nums tracking-tight">
 {gof.chiSquare.accepted ? (
 <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mx-auto" />
 ) : (
 <XCircle className="w-3.5 h-3.5 text-red-600 mx-auto" />
 )}
 </td>
 <td className="px-3 py-2 text-center tabular-nums tracking-tight">
 {gof.kolmogorovSmirnov.accepted ? (
 <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mx-auto" />
 ) : (
 <XCircle className="w-3.5 h-3.5 text-red-600 mx-auto" />
 )}
 </td>
 <td className="px-3 py-2 text-center tabular-nums tracking-tight">
 <span className={`px-2 py-0.5 text-xs font-bold rounded border ${bothPassed ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
 }`}>
 {bothPassed ? 'PASS' : 'FAIL'}
 </span>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* TAHAP 4: Tabel Hasil dengan Visual Hierarchy */}
 {distributions && (
 <div className="rounded-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 ">
 <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">3. Hujan Rencana (R₂₄)</h3>
 <div className="flex items-center gap-2">
 <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300">
 Metode:
 <HelpTooltip content="Sistem merekomendasikan metode terbaik berdasarkan Uji Kecocokan (Goodness-of-Fit) Chi-Square dan Kolmogorov-Smirnov." />
 </label>
 <select
 value={selectedMethod || ''}
 onChange={(e) => setSelectedMethod(e.target.value)}
 className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-sm text-xs font-semibold bg-white dark:bg-slate-900 focus:border-pupr-blue focus:ring-1 focus:ring-pupr-blue focus:outline-none"
 >
 {distributions.map(d => (
 <option key={d.method} value={d.method}>
 {METHOD_LABELS[d.method]}
 {d.method === recommendedMethod ? ' ⭐' : ''}
 </option>
 ))}
 </select>
 {/* TAHAP 5: CTA Standardization - Tombol Simpan di Header */}
 <button
 onClick={handleCalculate}
 disabled={!selectedMethod}
 className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-xs font-semibold transition-all ${!selectedMethod
 ? 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-50'
 : isCalculated
 ? 'bg-green-600 hover:bg-green-700 text-white '
 : 'bg-pupr-blue hover:bg-pupr-blue text-white '
 }`}
 >
 <Save className="w-3.5 h-3.5" />
 {isCalculated ? 'Tersimpan ✓' : 'Simpan'}
 </button>
 </div>
 </div>
 </div>
 <div className="p-4">

 {selectedMethod !== recommendedMethod && (
 <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-sm flex items-center gap-2">
 <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
 <span className="text-xs text-amber-800">
 Metode berbeda dari rekomendasi sistem ({METHOD_LABELS[recommendedMethod || '']})
 </span>
 </div>
 )}

 {/* Interactive Comparison Bar */}
 <div className="mb-6 p-5 bg-slate-900 text-white rounded-sm border border-slate-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-32 h-32 bg-white dark:bg-slate-900/5 rounded-sm -mr-16 -mt-16 group-hover:bg-white dark:bg-slate-900 transition-all duration-75"></div>
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-white dark:bg-slate-900 rounded-sm border border-white/10">
 <TrendingUp className="w-5 h-5 text-yellow-400" />
 </div>
 <div>
 <span className="text-base font-bold text-white block">Perbandingan Kala Ulang</span>
 <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Visualisasi Hujan Rencana (mm)</span>
 </div>
 </div>
 <div className="flex flex-wrap gap-1.5 p-1 bg-black/20 rounded-sm border border-white/5">
 {[2, 5, 10, 25, 50, 100].map(tr => (
 <button
 key={tr}
 onClick={() => setSelectedTr(tr)}
 className={`px-3 py-1.5 text-[11px] font-extrabold rounded-sm transition-all duration-75 ${selectedTr === tr
 ? 'bg-yellow-400 text-pupr-blue scale-105'
 : 'text-slate-300 hover:text-white hover:bg-white dark:bg-slate-900'
 }`}
 >
 Q{tr}
 </button>
 ))}
 </div>
 </div>
 <div className="space-y-4 relative z-10">
 {distributions.map(d => {
 const value = d.values.find(v => v.Tr === selectedTr)?.R24 || 0;
 const maxValue = Math.max(...distributions.map(dist => dist.values.find(v => v.Tr === selectedTr)?.R24 || 0));
 const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
 const isSelected = d.method === selectedMethod;
 const isFailed = goodnessOfFit?.find(g => g.method === d.method) &&
 !(goodnessOfFit.find(g => g.method === d.method)!.chiSquare.accepted &&
 goodnessOfFit.find(g => g.method === d.method)!.kolmogorovSmirnov.accepted);

 return (
 <div key={d.method} className="space-y-1.5">
 <div className="flex justify-between items-end px-1">
 <span className={`text-xs font-bold tracking-tight ${isSelected ? 'text-yellow-400' : isFailed ? 'text-slate-500 line-through' : 'text-slate-200'
 }`}>
 {METHOD_LABELS[d.method]}
 {isFailed && <span className="ml-1 text-[9px] uppercase font-extrabold px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded">Fail</span>}
 {isSelected && <span className="ml-1 text-[9px] uppercase font-extrabold px-1.5 py-0.5 bg-yellow-400/20 text-yellow-400 rounded">Selected</span>}
 </span>
 <span className={`text-xs font-mono font-bold tracking-wider ${isSelected ? 'text-yellow-400' : 'text-slate-300'}`}>
 {value.toFixed(1)} <span className="text-[10px] opacity-70">mm</span>
 </span>
 </div>
 <div className="relative bg-white dark:bg-slate-900/5 rounded-sm h-2.5 overflow-hidden border border-white/5 p-[1px]">
 <div
 className={`h-full rounded-sm transition-all duration-75 cubic-bezier(0.4, 0, 0.2, 1) relative overflow-hidden ${isSelected ? 'bg-yellow-500' :
 isFailed ? 'bg-slate-600' : 'bg-slate-500'
 }`}
 style={{ width: `${percentage}%` }}
 >
 <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-xs">
 <thead>
 <tr className="bg-pupr-blue text-white">
 <th className="px-3 py-2 text-center font-semibold text-sm">Tr</th>
 {distributions.map(d => {
 const isSelected = d.method === selectedMethod;
 const isFailed = goodnessOfFit?.find(g => g.method === d.method) &&
 !(goodnessOfFit.find(g => g.method === d.method)!.chiSquare.accepted &&
 goodnessOfFit.find(g => g.method === d.method)!.kolmogorovSmirnov.accepted);
 return (
 <th key={d.method} className={`px-3 py-2 text-right font-semibold text-sm transition-colors ${isSelected ? 'bg-pupr-blue text-white' : isFailed ? 'text-slate-300' : 'text-white'
 }`}>
 {METHOD_LABELS[d.method]}
 </th>
 );
 })}
 </tr>
 </thead>
 <tbody>
 {[2, 5, 10, 25, 50, 100].map(tr => (
 <tr
 key={tr}
 className={`border-b border-slate-100 even:bg-slate-50 dark:bg-slate-800 transition-all cursor-pointer ${selectedTr === tr ? 'bg-pupr-surface/30' : ''
 }`}
 onClick={() => setSelectedTr(tr)}
 >
 <td className={`px-3 py-2 text-center font-bold tabular-nums tracking-tight transition-colors ${selectedTr === tr ? 'text-pupr-blue' : 'text-slate-700 dark:text-slate-300'
 }`}>
 Q{tr}
 </td>
 {distributions.map(d => {
 const value = d.values.find(v => v.Tr === tr);
 const isSelected = d.method === selectedMethod;
 const isFailed = goodnessOfFit?.find(g => g.method === d.method) &&
 !(goodnessOfFit.find(g => g.method === d.method)!.chiSquare.accepted &&
 goodnessOfFit.find(g => g.method === d.method)!.kolmogorovSmirnov.accepted);
 const formula = isSelected ? getWhiteBoxFormula(d.method, tr, value?.R24 || 0) : null;

 return (
 <td key={d.method} className={`px-3 py-2 text-right font-mono tabular-nums tracking-tight transition-all ${isSelected ? 'bg-pupr-surface/50 font-bold text-pupr-blue' : isFailed ? 'opacity-50 text-slate-500' : ''
 }`}>
 <div className="flex items-center justify-end gap-2">
 <span>{value?.R24.toFixed(2)}</span>
 {formula && <WhiteBoxFormula {...formula} />}
 </div>
 </td>
 );
 })}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {dataInput.length < 10 && (
 <Card className="p-4 bg-amber-50 border border-amber-200">
 <div className="flex items-center gap-3">
 <AlertTriangle className="w-5 h-5 text-amber-600" />
 <div>
 <p className="font-semibold text-amber-900 text-sm">Data Tidak Cukup</p>
 <p className="text-xs text-amber-800">Minimal 10 tahun data hujan diperlukan untuk analisis frekuensi yang valid.</p>
 </div>
 </div>
 </Card>
 )}
 </div>
 </ModuleLayout>
 );
};
