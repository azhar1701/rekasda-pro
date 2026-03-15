import React, { useState, useMemo, useCallback } from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { SmartOverrideInput } from '@/components/ui/SmartOverrideInput';
import { MasterDataSelector } from '@/features/master-data/components/MasterDataSelector';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { DependencyWarningBanner } from '@/components/ui/DependencyWarningBanner';
import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';
import { ProjectContextBanner } from '@/components/ui/ProjectContextBanner';
import { FrequencyAnalysisModal } from '@/components/modals/FrequencyAnalysisModal';
import { FrequencyAnalysisSummary } from '@/components/ui/FrequencyAnalysisSummary';
import { AreaReductionCard } from '@/features/flood-analysis/components/AreaReductionCard';
import { HyetographGenerator } from '@/features/flood/components/HyetographGenerator';
import { Button } from '@/components/ui/Button';
import { HelpTooltip } from '@/components/ui/govtech';
import {
 CloudRain, Calculator, Activity, ChevronDown,
 Beaker, BarChart3, Waves, FlaskConical,
 TrendingUp, Droplets, Mountain, Layers,
 BarChart2, AlertTriangle, ShieldCheck
} from 'lucide-react';
import {
 XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { toast } from '@/hooks/useToast';
import * as Select from '@radix-ui/react-select';
import { cn } from '@/lib/utils';
import { useFloodMethod } from '@/hooks/useFloodMethod';
import { useEffect } from 'react';

// ────────────────────────────────────────────
// Types & Constants
// ────────────────────────────────────────────

type CategoryType = 'empiris' | 'hss';

type EmpirisMethod = 'rasional_dasar' | 'melchior' | 'der_weduwen' | 'haspers';
type HSSMethod = 'nakayasu' | 'gama1' | 'snyder' | 'scs' | 'itb';
type MethodType = EmpirisMethod | HSSMethod;

interface MethodOption {
 value: MethodType;
 label: string;
 icon: React.ReactNode;
 description: string;
}

const EMPIRIS_METHODS: MethodOption[] = [
 { value: 'rasional_dasar', label: 'Rasional Dasar', icon: <TrendingUp className="w-4 h-4" />, description: 'SNI 2415:2016 Pasal 5' },
 { value: 'melchior', label: 'Melchior', icon: <Beaker className="w-4 h-4" />, description: 'Metode Empiris DAS Menengah' },
 { value: 'der_weduwen', label: 'Der Weduwen', icon: <Waves className="w-4 h-4" />, description: 'Metode Empiris Tropis' },
 { value: 'haspers', label: 'Haspers', icon: <FlaskConical className="w-4 h-4" />, description: 'Metode Empiris Klassik' },
];

const HSS_METHODS: MethodOption[] = [
 { value: 'nakayasu', label: 'HSS Nakayasu', icon: <Activity className="w-4 h-4" />, description: 'SNI 2415:2016 Pasal 6.3' },
 { value: 'gama1', label: 'HSS Gama-1', icon: <BarChart3 className="w-4 h-4" />, description: 'Sri Harto, 1993' },
 { value: 'snyder', label: 'HSS Snyder', icon: <Mountain className="w-4 h-4" />, description: 'Snyder, 1938' },
 { value: 'scs', label: 'HSS SCS', icon: <Droplets className="w-4 h-4" />, description: 'Soil Conservation Service' },
 { value: 'itb', label: 'HSS ITB-1 / ITB-2', icon: <Layers className="w-4 h-4" />, description: 'Natakusumah et al.' },
];

interface ModulBanjirRencanaProps {
 onSave?: (type: any, inputs: any, outputs: any) => void;
 onConsultAI?: () => void;
}

// ────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────

export const ModulBanjirRencana: React.FC<ModulBanjirRencanaProps> = ({ onConsultAI: _onConsultAI, onSave: _onSave }) => {
 // ── Global state (read-only reference) ──
 const {
 luasDas: globalLuasDas,
 panjangSungai: globalPanjangSungai,
 curahHujanRencana: globalCurahHujan,
 hasilAnalisisFrekuensi,
 setSelectedKalaUlang,
 setHasilBanjir,
 isBanjirDirty,
 } = useHydrologyStore();

 // ── Frequency Analysis Modal ──
 const [showFreqModal, setShowFreqModal] = useState(false);

 // ── Tier-1 category ──
 const [category, setCategory] = useState<CategoryType>('empiris');

 // ── Tier-2 method ──
 const [method, setMethod] = useState<MethodType>('rasional_dasar');

 // ── Local form state (never touches global store until submit) ──
 const [localA, setLocalA] = useState(globalLuasDas || '');
 const [localL, setLocalL] = useState(globalPanjangSungai || '');
 const [localR, setLocalR] = useState(globalCurahHujan || '');

 // Rasional Dasar
 const [localC, setLocalC] = useState('0.65');
 const [localTc, setLocalTc] = useState('2.5');

 // Melchior
 const [melchiorReduksi, setMelchiorReduksi] = useState('0.90');
 const [melchiorKemiringan, setMelchiorKemiringan] = useState('0.005');

 // Der Weduwen
 const [weduwendReduksi, setWeduwendReduksi] = useState('0.85');
 const [weduwendLimpasan, setWeduwendLimpasan] = useState('0.75');

 // Haspers
 const [haspersReduksi, setHaspersReduksi] = useState('0.88');
 const [haspersKoef, setHaspersKoef] = useState('0.70');

 // Nakayasu
 const [nakAlpha, setNakAlpha] = useState('2.0');

 // Gama-1
 const [gamaSF, setGamaSF] = useState('0.45');
 const [gamaSIM, setGamaSIM] = useState('0.30');
 const [gamaD, setGamaD] = useState('1.50');

 // Snyder
 const [snyderCt, setSnyderCt] = useState('0.60');
 const [snyderCp, setSnyderCp] = useState('0.60');
 const [snyderLc, setSnyderLc] = useState('');

 // SCS
 const [scsCN, setScsCN] = useState('75');
 const [scsLag, setScsLag] = useState('');

 // ITB
 const [itbVariant, setItbVariant] = useState<'itb1' | 'itb2'>('itb1');
 const [itbCs, setItbCs] = useState('0.20');

 // ── Recommender Engine ──
 const { recommendation, isDataReady } = useFloodMethod();

 // Auto-sync category & method with recommendation
 useEffect(() => {
 if (isDataReady) {
 if (recommendation.isRasional) {
 setCategory('empiris');
 setMethod('rasional_dasar');
 } else {
 setCategory('hss');
 setMethod('nakayasu');
 }
 }
 }, [isDataReady, recommendation, setCategory, setMethod]);

 // ── Calculation state ──
 const [isCalculating, setIsCalculating] = useState(false);
 const [chartData, setChartData] = useState<{ time: number; inflow: number }[]>([]);
 const [resultSummary, setResultSummary] = useState<{ debitPuncak: number; waktuPuncak: number } | null>(null);

 // ── Derived ──
 const currentMethods = useMemo(() => category === 'empiris' ? EMPIRIS_METHODS : HSS_METHODS, [category]);
 const currentMethodInfo = useMemo(() => [...EMPIRIS_METHODS, ...HSS_METHODS].find(m => m.value === method), [method]);

 // ── Handlers ──
 const handleCategoryChange = useCallback((newCat: CategoryType) => {
 setCategory(newCat);
 setMethod(newCat === 'empiris' ? 'rasional_dasar' : 'nakayasu');
 setChartData([]);
 setResultSummary(null);
 }, []);

 const handleCalculate = useCallback(() => {
 const A = parseFloat(localA);
 const L = parseFloat(localL);
 const R = parseFloat(localR);

 if (!A || isNaN(A)) {
 toast.error('Luas DAS (A) wajib diisi dengan benar.');
 return;
 }
 if (!L || isNaN(L)) {
 toast.error('Panjang Sungai (L) wajib diisi dengan benar.');
 return;
 }

 setIsCalculating(true);

 setTimeout(() => {
 // ── Mock calculations per method ──
 let peak = 0;
 let tPeak = 3;

 switch (method) {
 case 'rasional_dasar': {
 const C = parseFloat(localC) || 0.65;
 const tc = parseFloat(localTc) || 2.5;
 const I = R ? (R / (tc * 60)) * 10 : 50; // mock intensity
 peak = 0.278 * C * I * A;
 tPeak = tc;
 break;
 }
 case 'melchior': {
 const red = parseFloat(melchiorReduksi) || 0.90;
 peak = red * A * 2.8;
 tPeak = 2.5;
 break;
 }
 case 'der_weduwen': {
 const red = parseFloat(weduwendReduksi) || 0.85;
 const limp = parseFloat(weduwendLimpasan) || 0.75;
 peak = red * limp * A * 3.0;
 tPeak = 2.8;
 break;
 }
 case 'haspers': {
 const red = parseFloat(haspersReduksi) || 0.88;
 const koef = parseFloat(haspersKoef) || 0.70;
 peak = red * koef * A * 3.1;
 tPeak = 2.4;
 break;
 }
 case 'nakayasu': {
 const alpha = parseFloat(nakAlpha) || 2.0;
 const Tg = L < 15 ? 0.4 + 0.058 * L : 0.21 * Math.pow(L, 0.7);
 const Tr = 0.5 * Tg;
 const Tp = Tg + 0.8 * Tr;
 peak = (A * (R || 80)) / (3.6 * (0.3 * Tp + alpha * (Tp + Tg)));
 tPeak = Tp;
 break;
 }
 case 'gama1': {
 const SF = parseFloat(gamaSF) || 0.45;
 peak = A * SF * 2.2;
 tPeak = 3.2;
 break;
 }
 case 'snyder': {
 const Ct = parseFloat(snyderCt) || 0.60;
 const Cp = parseFloat(snyderCp) || 0.60;
 const LcVal = parseFloat(snyderLc) || L * 0.5;
 const tp = Ct * Math.pow(L * LcVal, 0.3);
 peak = (2.78 * Cp * A) / tp;
 tPeak = tp;
 break;
 }
 case 'scs': {
 const CN = parseFloat(scsCN) || 75;
 const S = (25400 / CN) - 254;
 const Pe = R ? Math.pow(R - 0.2 * S, 2) / (R + 0.8 * S) : 40;
 peak = (Pe * A * 2.08) / (Math.sqrt(A) + 1.5);
 tPeak = 2.7;
 break;
 }
 case 'itb': {
 const Cs = parseFloat(itbCs) || 0.20;
 peak = Cs * A * (R || 80) / (3.6 * 2.5);
 tPeak = 2.5;
 break;
 }
 }

 peak = Math.max(peak, 0.01);

 // Generate mock hydrograph
 const hydro: { time: number; inflow: number }[] = [];
 const totalTime = tPeak * 4;
 const steps = 20;
 for (let i = 0; i <= steps; i++) {
 const t = (totalTime / steps) * i;
 let q: number;
 if (t <= tPeak) {
 q = peak * Math.pow(t / tPeak, 2.5);
 } else {
 q = peak * Math.exp(-0.5 * ((t - tPeak) / tPeak));
 }
 hydro.push({ time: Number(t.toFixed(1)), inflow: Number(q.toFixed(2)) });
 }

 setChartData(hydro);
 setResultSummary({ debitPuncak: Number(peak.toFixed(2)), waktuPuncak: Number(tPeak.toFixed(2)) });

 // Commit to global state
 setHasilBanjir({
 debitPuncak: Number(peak.toFixed(2)),
 hidrograf: hydro,
 });

 setIsCalculating(false);
 toast.success(`Perhitungan ${currentMethodInfo?.label || method} berhasil. Data disinkronisasikan.`);
 }, 900);
 }, [
 localA, localL, localR, method, localC, localTc,
 melchiorReduksi, melchiorKemiringan,
 weduwendReduksi, weduwendLimpasan,
 haspersReduksi, haspersKoef,
 nakAlpha, gamaSF, gamaSIM, gamaD,
 snyderCt, snyderCp, snyderLc,
 scsCN, scsLag, itbVariant, itbCs,
 setHasilBanjir, currentMethodInfo,
 ]);

 // ────────────────────────────────────────
 // Render helpers
 // ────────────────────────────────────────

 /** Render method-specific parameter fields */
 const renderMethodParams = () => {
 switch (method) {
 case 'rasional_dasar':
 return (
 <>
 <div className="grid grid-cols-2 gap-3">
 <InputField label="Koef. Pengaliran (C)" value={localC} onChange={setLocalC} unit="—" tooltip="Rasio limpasan/hujan, 0–1" />
 <InputField label="Waktu Konsentrasi (tc)" value={localTc} onChange={setLocalTc} unit="jam" tooltip="Waktu tempuh air dari hulu ke outlet" />
 </div>
 </>
 );

 case 'melchior':
 return (
 <div className="grid grid-cols-2 gap-3">
 <InputField label="Koef. Reduksi" value={melchiorReduksi} onChange={setMelchiorReduksi} unit="—" />
 <InputField label="Kemiringan Rata-rata" value={melchiorKemiringan} onChange={setMelchiorKemiringan} unit="m/m" />
 </div>
 );

 case 'der_weduwen':
 return (
 <div className="grid grid-cols-2 gap-3">
 <InputField label="Koef. Reduksi" value={weduwendReduksi} onChange={setWeduwendReduksi} unit="—" />
 <InputField label="Koef. Limpasan" value={weduwendLimpasan} onChange={setWeduwendLimpasan} unit="—" />
 </div>
 );

 case 'haspers':
 return (
 <div className="grid grid-cols-2 gap-3">
 <InputField label="Koef. Reduksi" value={haspersReduksi} onChange={setHaspersReduksi} unit="—" />
 <InputField label="Koef. Haspers" value={haspersKoef} onChange={setHaspersKoef} unit="—" />
 </div>
 );

 case 'nakayasu':
 return (
 <InputField label="Koef. Karakteristik (α)" value={nakAlpha} onChange={setNakAlpha} unit="—" tooltip="Nilai 1.5–3.0, standar 2.0" />
 );

 case 'gama1':
 return (
 <div className="grid grid-cols-3 gap-3">
 <InputField label="Faktor Sumber (SF)" value={gamaSF} onChange={setGamaSF} unit="—" />
 <InputField label="Faktor Simetri (SIM)" value={gamaSIM} onChange={setGamaSIM} unit="—" />
 <InputField label="Kerapatan Jar. (D)" value={gamaD} onChange={setGamaD} unit="km/km²" />
 </div>
 );

 case 'snyder':
 return (
 <div className="grid grid-cols-3 gap-3">
 <InputField label="Koefisien Ct" value={snyderCt} onChange={setSnyderCt} unit="—" tooltip="0.4–0.8, standar 0.6" />
 <InputField label="Koefisien Cp" value={snyderCp} onChange={setSnyderCp} unit="—" tooltip="0.4–0.8, standar 0.6" />
 <InputField label="Jarak ke centroid (Lc)" value={snyderLc} onChange={setSnyderLc} unit="km" placeholder="otomatis" />
 </div>
 );

 case 'scs':
 return (
 <div className="grid grid-cols-2 gap-3">
 <InputField label="Curve Number (CN)" value={scsCN} onChange={setScsCN} unit="—" tooltip="0–100, standar 75" />
 <InputField label="Lag Time" value={scsLag} onChange={setScsLag} unit="jam" placeholder="otomatis" />
 </div>
 );

 case 'itb':
 return (
 <div className="space-y-3">
 {/* ITB sub-variant selector */}
 <div className="flex gap-2">
 {(['itb1', 'itb2'] as const).map(v => (
 <button
 key={v}
 type="button"
 onClick={() => setItbVariant(v)}
 className={cn(
 'flex-1 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all',
 itbVariant === v
 ? 'bg-pupr-blue text-white'
 : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
 )}
 >
 {v === 'itb1' ? 'ITB-1' : 'ITB-2'}
 </button>
 ))}
 </div>
 <InputField label="Koefisien Cs" value={itbCs} onChange={setItbCs} unit="—" />
 </div>
 );

 default: return null;
 }
 };

 // ────────────────────────────────────────
 // JSX
 // ────────────────────────────────────────

 return (
 <>
 <ModuleLayout
 title="Debit Banjir Rencana"
 description="Two-Tier Method Selector · Hybrid Input System · 9 Metode Standar"
 icon={<CloudRain className="w-6 h-6" />}
 
 >
 <div className="h-full relative grid grid-cols-1 md:grid-cols-12 gap-6 pt-2 page-enter">
 {/* ═══════════════════════════════ LEFT COLUMN ═══════════════════════ */}
 <div className="md:col-span-5 flex flex-col gap-5">
 <div className="bg-white dark:bg-slate-900 border border-white/60 rounded-sm p-5 space-y-5">

 {/* Project Banner (SSOT) */}
 <ProjectContextBanner />

 <div className="mb-2">
 <FormulaAccordion
 title="Analisis Banjir Rancangan"
 subtitle="Metode Rasional & Hidrograf Satuan Sintetis (HSS)"
 theme="purple"
 formulas={[
 { label: "Metode Rasional", math: "Q_p = 0.278 \cdot C \cdot I \cdot A" },
 { label: "Intensitas Hujan (Mononobe)", math: "I = \frac{R_{24}}{24} \left(\frac{24}{t_c}\right)^{2/3}" },
 { label: "Waktu Konsentrasi (Kirpich)", math: "t_c = \left(\frac{0.87 \cdot L^2}{1000 \cdot S}\right)^{0.385}" },
 { label: "HSS Nakayasu", math: "Q_p = \frac{C \cdot A \cdot R_o}{3.6 \cdot (0.3 \cdot T_p + T_{0.3})}" }
 ]}
 parameters={[
 { symbol: "Q_p", description: "Debit puncak banjir rancangan", unit: "m³/s" },
 { symbol: "C", description: "Koefisien pengaliran / limpasan", unit: "-" },
 { symbol: "I", description: "Intensitas curah hujan", unit: "mm/jam" },
 { symbol: "A", description: "Luas Daerah Aliran Sungai (DAS)", unit: "km²" },
 { symbol: "t_c", description: "Waktu konsentrasi", unit: "jam" },
 { symbol: "R_{24}", description: "Curah hujan rancangan 24 jam", unit: "mm" },
 { symbol: "L", description: "Panjang sungai utama", unit: "km" },
 { symbol: "S", description: "Kemiringan sungai", unit: "m/m" }
 ]}
 reference="SNI 2415:2016 (Tata Cara Perhitungan Debit Banjir Rencana)"
 />
 </div>

 {/* Master Data Selector */}
 <MasterDataSelector />

 {/* Frequency Analysis Summary */}
 <FrequencyAnalysisSummary onNavigate={() => setShowFreqModal(true)} />

 <hr className="border-slate-100" />

 {/* ─── TIER 1: Category Selector ─── */}
 <div>
 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
 Tingkat 1 — Kategori Metode
 </label>
 <div className="flex gap-2 p-1 bg-slate-100/80 rounded-sm">
 {([
 { value: 'empiris' as const, label: 'Metode Empiris', icon: <Beaker className="w-4 h-4" /> },
 { value: 'hss' as const, label: 'Metode HSS', icon: <Activity className="w-4 h-4" /> },
 ] as const).map(opt => (
 <button
 key={opt.value}
 type="button"
 onClick={() => !isDataReady ? handleCategoryChange(opt.value) : null}
 disabled={isDataReady}
 className={cn(
 'flex-1 flex items-center justify-center gap-2 py-3 rounded-sm text-sm font-bold transition-all duration-200',
 category === opt.value
 ? 'bg-white dark:bg-slate-900 text-pupr-blue'
 : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 hover:bg-white dark:bg-slate-900',
 isDataReady && 'cursor-not-allowed opacity-80'
 )}
 >
 {opt.icon}
 {opt.label}
 </button>
 ))}
 </div>
 </div>

 {/* ─── TIER 2: Method Dropdown ─── */}
 <div>
 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
 Tingkat 2 — Metode Spesifik
 </label>
 <Select.Root value={method} onValueChange={(val) => { setMethod(val as MethodType); setChartData([]); setResultSummary(null); }}>
 <Select.Trigger
 disabled={isDataReady}
 className={cn(
 "w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-200",
 isDataReady && "bg-slate-50 dark:bg-slate-800 cursor-not-allowed opacity-80"
 )}
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-sm bg-pupr-surface flex items-center justify-center text-pupr-blue">
 {currentMethodInfo?.icon}
 </div>
 <div>
 <Select.Value />
 <p className="text-[10px] text-slate-500 font-medium mt-0.5">{currentMethodInfo?.description}</p>
 </div>
 </div>
 <Select.Icon>
 <ChevronDown className="w-4 h-4 text-slate-500" />
 </Select.Icon>
 </Select.Trigger>

 <Select.Portal>
 <Select.Content
 className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden z-[9999]"
 position="popper"
 sideOffset={4}
 >
 <Select.Viewport className="p-1.5">
 {currentMethods.map(m => (
 <Select.Item
 key={m.value}
 value={m.value}
 className="flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer outline-none data-[highlighted]:bg-pupr-surface transition-colors"
 >
 <div className="w-7 h-7 rounded-sm bg-slate-100 flex items-center justify-center text-slate-600 dark:text-slate-500">
 {m.icon}
 </div>
 <div>
 <Select.ItemText>{m.label}</Select.ItemText>
 <p className="text-[10px] text-slate-500 font-medium">{m.description}</p>
 </div>
 </Select.Item>
 ))}
 </Select.Viewport>
 </Select.Content>
 </Select.Portal>
 </Select.Root>
 </div>

 <hr className="border-slate-100" />

 {/* ─── FUNDAMENTAL PARAMETERS (Smart Override) ─── */}
 <div className="border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-900 overflow-hidden">
 <details className="group" open>
 <summary className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 cursor-pointer list-none select-none">
 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
 Parameter Fundamental
 </span>
 <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
 </summary>
 <div className="p-4 space-y-3 border-t border-slate-200 dark:border-slate-700">
 <SmartOverrideInput
 label="Luas DAS (A)"
 unit="km²"
 globalValue={globalLuasDas}
 value={localA}
 onChange={setLocalA}
 placeholder="Masukkan luas catchment area..."
 tooltip="Luas daerah tangkapan air hingga titik tinjau"
 />
 <SmartOverrideInput
 label="Panjang Sungai (L)"
 unit="km"
 globalValue={globalPanjangSungai}
 value={localL}
 onChange={setLocalL}
 placeholder="Panjang sungai utama..."
 tooltip="Panjang sungai utama dari hulu hingga outlet"
 />
 {/* ─── CURAH HUJAN RENCANA (with Kala Ulang dropdown) ─── */}
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
 Curah Hujan Rencana
 <span
 className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-slate-100 text-slate-500 text-[9px] font-bold cursor-help"
 title="Curah hujan rencana sesuai kala ulang terpilih"
 >?</span>
 </label>

 {/* Kala Ulang Dropdown + Value */}
 {hasilAnalisisFrekuensi ? (
 <div className="space-y-2">
 {/* Source badge */}
 <div className="flex items-center gap-2">
 <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-sm border border-emerald-200">
 <BarChart2 className="w-3 h-3" />
 {hasilAnalisisFrekuensi.metodeTerpilih}
 {hasilAnalisisFrekuensi.lulusUjiKecocokan && ' ✓'}
 </span>
 </div>

 {/* Kala Ulang Selector */}
 <Select.Root
 value={hasilAnalisisFrekuensi.selectedKalaUlang?.toString() || ''}
 onValueChange={(val) => {
 const ku = parseInt(val);
 setSelectedKalaUlang(ku);
 // Also sync to localR
 const match = hasilAnalisisFrekuensi.curahHujanRencana.find((v: any) => v.kalaUlang === ku);
 if (match) setLocalR(String(match.curahHujan));
 }}
 >
 <Select.Trigger className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-sm border border-emerald-200 bg-emerald-50/30 hover:border-emerald-300 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-emerald-200">
 <div className="flex items-center gap-2">
 <CloudRain className="w-4 h-4 text-emerald-600" />
 <Select.Value placeholder="Pilih Kala Ulang..." />
 </div>
 <Select.Icon>
 <ChevronDown className="w-4 h-4 text-slate-500" />
 </Select.Icon>
 </Select.Trigger>
 <Select.Portal>
 <Select.Content
 className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden z-[9999]"
 position="popper"
 sideOffset={4}
 >
 <Select.Viewport className="p-1.5">
 {hasilAnalisisFrekuensi.curahHujanRencana.map((v: any) => (
 <Select.Item
 key={v.kalaUlang}
 value={v.kalaUlang.toString()}
 className="flex items-center justify-between px-3 py-2.5 rounded-sm cursor-pointer outline-none data-[highlighted]:bg-emerald-50 transition-colors"
 >
 <Select.ItemText>Kala Ulang {v.kalaUlang} Tahun</Select.ItemText>
 <span className="text-xs font-bold text-emerald-600">{v.curahHujan} mm</span>
 </Select.Item>
 ))}
 </Select.Viewport>
 </Select.Content>
 </Select.Portal>
 </Select.Root>

 {/* Value display (still overrideable) */}
 <SmartOverrideInput
 label=""
 unit="mm"
 globalValue={globalCurahHujan}
 value={localR}
 onChange={setLocalR}
 placeholder="Curah hujan rencana..."
 />
 </div>
 ) : (
 <div className="space-y-2">
 {/* Warning: not yet analyzed */}
 <div className="flex items-start gap-2 px-3 py-2.5 rounded-sm bg-amber-50 border border-amber-200 text-amber-800">
 <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
 <div className="text-xs font-medium">
 Analisis Frekuensi Hujan belum dilakukan.
 <button
 onClick={() => setShowFreqModal(true)}
 className="ml-1 text-pupr-blue hover:text-pupr-blue underline font-bold"
 >
 Buka Analisis Frekuensi
 </button>
 {' '}atau input manual di bawah.
 </div>
 </div>

 {/* Manual input fallback */}
 <SmartOverrideInput
 label=""
 unit="mm"
 globalValue={globalCurahHujan}
 value={localR}
 onChange={setLocalR}
 placeholder="Curah hujan rencana kala ulang..."
 tooltip="Curah hujan rencana sesuai kala ulang terpilih"
 />
 </div>
 )}
 </div>
 </div>
 </details>
 </div>

 <hr className="border-slate-100" />

 {/* ─── AREA REDUCTION FACTOR (ARF) ─── */}
 <div className="border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-900 overflow-hidden">
 <details className="group" open>
 <summary className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 cursor-pointer list-none select-none">
 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
 Area Reduction Factor (ARF)
 </span>
 <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
 </summary>
 <div className="p-4 border-t border-slate-200 dark:border-slate-700">
 <AreaReductionCard />
 </div>
 </details>
 </div>

 <hr className="border-slate-100" />

 {/* ─── METHOD-SPECIFIC PARAMETERS ─── */}
 <div className="border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-900 overflow-hidden">
 <details className="group" open>
 <summary className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 cursor-pointer list-none select-none">
 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
 Parameter {currentMethodInfo?.label}
 </span>
 <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
 </summary>
 <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
 {renderMethodParams()}
 </div>
 </details>
 </div>

 {/* ─── ACTION BUTTON ─── */}
 <div className="pt-1">
 <Button
 className="w-full py-6 rounded-sm font-bold text-base shadow-none bg-pupr-blue hover:bg-blue-700 transition-all"
 onClick={handleCalculate}
 disabled={isCalculating || !isDataReady}
 >
 {isCalculating ? (
 <div className="flex items-center gap-2">
 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-sm animate-pulse bg-slate-200 rounded-sm" />
 Memproses Simulasi...
 </div>
 ) : !isDataReady ? (
 <div className="flex items-center gap-2">
 <ShieldCheck className="w-5 h-5 opacity-50" />
 Lengkapi Data Spasial/Frekuensi
 </div>
 ) : (
 <div className="flex items-center gap-2">
 <Calculator className="w-5 h-5" />
 Hitung & Simpan Analisis
 </div>
 )}
 </Button>
 </div>
 </div>
 </div>

 {/* ═══════════════════════════════ RIGHT COLUMN ══════════════════════ */}
 <div className="md:col-span-7 flex flex-col gap-5 min-h-[400px]">
 <DependencyWarningBanner module="banjir" />

 {/* Hyetograph Generator (Mononobe + ABM) */}
 <HyetographGenerator />

 {/* Result Summary Cards */}
 {resultSummary && (
 <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-75">
 <div className="bg-white dark:bg-slate-900 border border-white/60 rounded-sm p-5">
 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Debit Puncak (Qp)</p>
 <div className="flex items-baseline gap-2">
 <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{resultSummary.debitPuncak}</span>
 <span className="text-sm font-bold text-slate-500">m³/s</span>
 </div>
 <p className="text-[10px] text-slate-500 mt-2 font-medium">Metode: {currentMethodInfo?.label}</p>
 </div>
 <div className="bg-white dark:bg-slate-900 border border-white/60 rounded-sm p-5">
 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Waktu Puncak (Tp)</p>
 <div className="flex items-baseline gap-2">
 <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{resultSummary.waktuPuncak}</span>
 <span className="text-sm font-bold text-slate-500">jam</span>
 </div>
 <p className="text-[10px] text-slate-500 mt-2 font-medium">Kategori: {category === 'empiris' ? 'Empiris' : 'HSS'}</p>
 </div>
 </div>
 )}

 {/* Hydrograph Chart */}
 <div className={cn(
 'flex-1 bg-white dark:bg-slate-900 border rounded-sm p-5 flex flex-col transition-all duration-75',
 isBanjirDirty ? 'border-amber-200' : 'border-white/60'
 )}>
 <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg flex items-center gap-2 mb-4">
 <Activity className="w-5 h-5 text-blue-500" />
 Kurva Hidrograf Banjir
 {currentMethodInfo && (
 <span className="ml-auto text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-sm">
 {currentMethodInfo.label}
 </span>
 )}
 </h3>

 <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-sm border border-slate-100 p-4 border-dashed relative min-h-[300px]">
 {chartData.length > 0 ? (
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
 <defs>
 <linearGradient id="hydroGradient" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
 <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
 <XAxis
 dataKey="time"
 tick={{ fontSize: 11, fill: '#64748B' }}
 tickLine={false}
 axisLine={false}
 label={{ value: 'Waktu (jam)', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#94A3B8' }}
 />
 <YAxis
 tick={{ fontSize: 11, fill: '#64748B' }}
 tickLine={false}
 axisLine={false}
 label={{ value: 'Q (m³/s)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94A3B8' }}
 />
 <Tooltip
 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
 formatter={(value: number) => [`${value} m³/s`, 'Debit (Q)']}
 labelFormatter={(label) => `Jam ke-${label}`}
 />
 <Area
 type="monotone"
 dataKey="inflow"
 stroke="#3B82F6"
 strokeWidth={3}
 fill="url(#hydroGradient)"
 dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
 activeDot={{ r: 5, strokeWidth: 0, fill: '#2563EB' }}
 animationDuration={1200}
 />
 </AreaChart>
 </ResponsiveContainer>
 ) : (
 <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
 <div className="w-16 h-16 bg-pupr-surface rounded-sm flex items-center justify-center mb-4">
 <Activity className="w-8 h-8 text-blue-300" />
 </div>
 <p className="text-slate-500 font-medium">Belum ada kalkulasi.</p>
 <p className="text-sm text-slate-500 mt-1 max-w-xs">
 Pilih metode, sesuaikan parameter, lalu klik <strong>"Hitung & Simpan Analisis"</strong> untuk melihat hidrograf.
 </p>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 </ModuleLayout>

 {/* Frequency Analysis Modal Portal */}
 <FrequencyAnalysisModal
 isOpen={showFreqModal}
 onClose={() => setShowFreqModal(false)}
 />
 </>
 );
};



// ────────────────────────────────────────────
// Helper: Simple input field (for method-specific params)
// ────────────────────────────────────────────

interface InputFieldProps {
 label: string;
 value: string;
 onChange: (v: string) => void;
 unit?: string;
 tooltip?: string;
 placeholder?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, unit, tooltip, placeholder }) => (
 <div className="space-y-1">
 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
 {label}
 {tooltip && (
 <HelpTooltip content={tooltip} />
 )}
 </label>
 <div className="relative">
 <input
 type="number"
 value={value}
 onChange={(e) => onChange(e.target.value)}
 placeholder={placeholder}
 className="w-full rounded-sm px-3 py-2.5 pr-14 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all placeholder:text-slate-300"
 />
 {unit && (
 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 select-none">
 {unit}
 </span>
 )}
 </div>
 </div>
);

export default ModulBanjirRencana;
