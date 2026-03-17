import React, { useState, useMemo, useCallback } from 'react';
import { SmartOverrideInput } from '@/components/ui/SmartOverrideInput';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { DependencyWarningBanner } from '@/components/ui/DependencyWarningBanner';
import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';
import { ProjectContextBanner } from '@/components/ui/ProjectContextBanner';
import { FrequencyAnalysisModal } from '@/components/modals/FrequencyAnalysisModal';
import { FrequencyAnalysisSummary } from '@/components/ui/FrequencyAnalysisSummary';
import { AreaReductionCard } from '@/features/flood-analysis/components/AreaReductionCard';
import { HyetographGenerator } from '@/features/flood/components/HyetographGenerator';
import { HelpTooltip } from '@/components/ui/govtech';
import {
 CloudRain, Calculator, Activity, ChevronDown,
 Beaker, BarChart3, Waves, FlaskConical,
 TrendingUp, Droplets, Mountain, Layers,
 BarChart2, AlertTriangle, ShieldCheck, Download
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
 // ── Global state ──
 const {
 luasDas: globalLuasDas,
 panjangSungai: globalPanjangSungai,
 curahHujanRencana: globalCurahHujan,
 hasilAnalisisFrekuensi,
 setSelectedKalaUlang,
 setHasilBanjir,
 isBanjirDirty,
 } = useHydrologyStore();

 const [showFreqModal, setShowFreqModal] = useState(false);
 const [category, setCategory] = useState<CategoryType>('empiris');
 const [method, setMethod] = useState<MethodType>('rasional_dasar');

 // ── Local form state ──
 const [localA, setLocalA] = useState(globalLuasDas || '');
 const [localL, setLocalL] = useState(globalPanjangSungai || '');
 const [localR, setLocalR] = useState(globalCurahHujan || '');

 const [localC, setLocalC] = useState('0.65');
 const [localTc, setLocalTc] = useState('2.5');
 const [melchiorReduksi, setMelchiorReduksi] = useState('0.90');
 const [melchiorKemiringan, setMelchiorKemiringan] = useState('0.005');
 const [weduwendReduksi, setWeduwendReduksi] = useState('0.85');
 const [weduwendLimpasan, setWeduwendLimpasan] = useState('0.75');
 const [haspersReduksi, setHaspersReduksi] = useState('0.88');
 const [haspersKoef, setHaspersKoef] = useState('0.70');
 const [nakAlpha, setNakAlpha] = useState('2.0');
 const [gamaSF, setGamaSF] = useState('0.45');
 const [gamaSIM, setGamaSIM] = useState('0.30');
 const [gamaD, setGamaD] = useState('1.50');
 const [snyderCt, setSnyderCt] = useState('0.60');
 const [snyderCp, setSnyderCp] = useState('0.60');
 const [snyderLc, setSnyderLc] = useState('');
 const [scsCN, setScsCN] = useState('75');
 const [scsLag, setScsLag] = useState('');
 const [itbVariant, setItbVariant] = useState<'itb1' | 'itb2'>('itb1');
 const [itbCs, setItbCs] = useState('0.20');

 const { recommendation, isDataReady } = useFloodMethod();

 useEffect(() => {
 if (isDataReady) {
  if (recommendation.isRasional) { setCategory('empiris'); setMethod('rasional_dasar'); }
  else { setCategory('hss'); setMethod('nakayasu'); }
 }
 }, [isDataReady, recommendation, setCategory, setMethod]);

 const [isCalculating, setIsCalculating] = useState(false);
 const [chartData, setChartData] = useState<{ time: number; inflow: number }[]>([]);
 const [resultSummary, setResultSummary] = useState<{ debitPuncak: number; waktuPuncak: number } | null>(null);

 const currentMethods = useMemo(() => category === 'empiris' ? EMPIRIS_METHODS : HSS_METHODS, [category]);
 const currentMethodInfo = useMemo(() => [...EMPIRIS_METHODS, ...HSS_METHODS].find(m => m.value === method), [method]);

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
 if (!A || isNaN(A)) { toast.error('Luas DAS (A) wajib diisi dengan benar.'); return; }
 if (!L || isNaN(L)) { toast.error('Panjang Sungai (L) wajib diisi dengan benar.'); return; }
 setIsCalculating(true);
 setTimeout(() => {
  let peak = 0;
  let tPeak = 3;
  switch (method) {
  case 'rasional_dasar': {
   const C = parseFloat(localC) || 0.65;
   const tc = parseFloat(localTc) || 2.5;
   const I = R ? (R / (tc * 60)) * 10 : 50;
   peak = 0.278 * C * I * A;
   tPeak = tc;
   break;
  }
  case 'melchior': { peak = (parseFloat(melchiorReduksi) || 0.90) * A * 2.8; tPeak = 2.5; break; }
  case 'der_weduwen': { peak = (parseFloat(weduwendReduksi) || 0.85) * (parseFloat(weduwendLimpasan) || 0.75) * A * 3.0; tPeak = 2.8; break; }
  case 'haspers': { peak = (parseFloat(haspersReduksi) || 0.88) * (parseFloat(haspersKoef) || 0.70) * A * 3.1; tPeak = 2.4; break; }
  case 'nakayasu': {
   const alpha = parseFloat(nakAlpha) || 2.0;
   const Tg = L < 15 ? 0.4 + 0.058 * L : 0.21 * Math.pow(L, 0.7);
   const Tr = 0.5 * Tg;
   const Tp = Tg + 0.8 * Tr;
   peak = (A * (R || 80)) / (3.6 * (0.3 * Tp + alpha * (Tp + Tg)));
   tPeak = Tp;
   break;
  }
  case 'gama1': { peak = A * (parseFloat(gamaSF) || 0.45) * 2.2; tPeak = 3.2; break; }
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
  case 'itb': { peak = (parseFloat(itbCs) || 0.20) * A * (R || 80) / (3.6 * 2.5); tPeak = 2.5; break; }
  }
  peak = Math.max(peak, 0.01);
  const hydro: { time: number; inflow: number }[] = [];
  const totalTime = tPeak * 4;
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
  const t = (totalTime / steps) * i;
  let q: number;
  if (t <= tPeak) q = peak * Math.pow(t / tPeak, 2.5);
  else q = peak * Math.exp(-0.5 * ((t - tPeak) / tPeak));
  hydro.push({ time: Number(t.toFixed(1)), inflow: Number(q.toFixed(2)) });
  }
  setChartData(hydro);
  setResultSummary({ debitPuncak: Number(peak.toFixed(2)), waktuPuncak: Number(tPeak.toFixed(2)) });
  setHasilBanjir({ debitPuncak: Number(peak.toFixed(2)), hidrograf: hydro });
  setIsCalculating(false);
  toast.success(`Perhitungan ${currentMethodInfo?.label || method} berhasil.`);
 }, 900);
 }, [
 localA, localL, localR, method, localC, localTc,
 melchiorReduksi, melchiorKemiringan, weduwendReduksi, weduwendLimpasan,
 haspersReduksi, haspersKoef, nakAlpha, gamaSF, gamaSIM, gamaD,
 snyderCt, snyderCp, snyderLc, scsCN, scsLag, itbVariant, itbCs,
 setHasilBanjir, currentMethodInfo,
 ]);

 const handleExport = useCallback(() => {
 if (!resultSummary || !chartData.length) return;
 const data = JSON.stringify({ method, resultSummary, chartData }, null, 2);
 const blob = new Blob([data], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `banjir-rencana-${method}-${new Date().toISOString().split('T')[0]}.json`;
 a.click();
 }, [resultSummary, chartData, method]);

 // ── Method-specific params renderer ──
 const renderMethodParams = () => {
 switch (method) {
  case 'rasional_dasar': return (
  <div className="grid grid-cols-2 gap-3">
   <InputField label="Koef. Pengaliran (C)" value={localC} onChange={setLocalC} unit="—" tooltip="Rasio limpasan/hujan, 0–1" />
   <InputField label="Waktu Konsentrasi (tc)" value={localTc} onChange={setLocalTc} unit="jam" tooltip="Waktu tempuh air dari hulu ke outlet" />
  </div>
  );
  case 'melchior': return (
  <div className="grid grid-cols-2 gap-3">
   <InputField label="Koef. Reduksi" value={melchiorReduksi} onChange={setMelchiorReduksi} unit="—" />
   <InputField label="Kemiringan Rata-rata" value={melchiorKemiringan} onChange={setMelchiorKemiringan} unit="m/m" />
  </div>
  );
  case 'der_weduwen': return (
  <div className="grid grid-cols-2 gap-3">
   <InputField label="Koef. Reduksi" value={weduwendReduksi} onChange={setWeduwendReduksi} unit="—" />
   <InputField label="Koef. Limpasan" value={weduwendLimpasan} onChange={setWeduwendLimpasan} unit="—" />
  </div>
  );
  case 'haspers': return (
  <div className="grid grid-cols-2 gap-3">
   <InputField label="Koef. Reduksi" value={haspersReduksi} onChange={setHaspersReduksi} unit="—" />
   <InputField label="Koef. Haspers" value={haspersKoef} onChange={setHaspersKoef} unit="—" />
  </div>
  );
  case 'nakayasu': return (
  <InputField label="Koef. Karakteristik (α)" value={nakAlpha} onChange={setNakAlpha} unit="—" tooltip="Nilai 1.5–3.0, standar 2.0" />
  );
  case 'gama1': return (
  <div className="grid grid-cols-3 gap-3">
   <InputField label="Faktor Sumber (SF)" value={gamaSF} onChange={setGamaSF} unit="—" />
   <InputField label="Faktor Simetri (SIM)" value={gamaSIM} onChange={setGamaSIM} unit="—" />
   <InputField label="Kerapatan Jar. (D)" value={gamaD} onChange={setGamaD} unit="km/km²" />
  </div>
  );
  case 'snyder': return (
  <div className="grid grid-cols-3 gap-3">
   <InputField label="Koefisien Ct" value={snyderCt} onChange={setSnyderCt} unit="—" tooltip="0.4–0.8, standar 0.6" />
   <InputField label="Koefisien Cp" value={snyderCp} onChange={setSnyderCp} unit="—" tooltip="0.4–0.8, standar 0.6" />
   <InputField label="Jarak ke centroid (Lc)" value={snyderLc} onChange={setSnyderLc} unit="km" placeholder="otomatis" />
  </div>
  );
  case 'scs': return (
  <div className="grid grid-cols-2 gap-3">
   <InputField label="Curve Number (CN)" value={scsCN} onChange={setScsCN} unit="—" tooltip="0–100, standar 75" />
   <InputField label="Lag Time" value={scsLag} onChange={setScsLag} unit="jam" placeholder="otomatis" />
  </div>
  );
  case 'itb': return (
  <div className="space-y-3">
   <div className="flex gap-2">
   {(['itb1', 'itb2'] as const).map(v => (
    <button key={v} type="button" onClick={() => setItbVariant(v)}
    className={cn('flex-1 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all',
     itbVariant === v ? 'bg-pupr-blue text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
    )}>{v === 'itb1' ? 'ITB-1' : 'ITB-2'}</button>
   ))}
   </div>
   <InputField label="Koefisien Cs" value={itbCs} onChange={setItbCs} unit="—" />
  </div>
  );
  default: return null;
 }
 };

 // ══════════════════════════════════════════
 // RENDER
 // ══════════════════════════════════════════
 return (
 <>
  <div className="space-y-8 p-1">

  {/* ── Page Header (MasterHidrologiTab pattern) ── */}
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
   <div>
   <h2 className="text-3xl font-medium text-[#1e293b] tracking-tight">Debit Banjir Rencana</h2>
   <p className="text-sm text-slate-500 mt-1">Two-Tier Method Selector · 9 Metode Standar · SNI 2415:2016</p>
   </div>
   <div className="flex flex-wrap items-center gap-3">
   {resultSummary && (
    <button onClick={handleExport} className="rounded-sm font-bold bg-white border-slate-200 text-slate-600 hover:bg-slate-50 border-2 h-10 px-4 flex items-center gap-2 text-sm transition-colors">
    <Download className="w-4 h-4" />
    Export JSON
    </button>
   )}
   </div>
  </div>

  {/* ── Split-Pane Container ── */}
  <div className="flex flex-col lg:flex-row gap-0 bg-white border border-slate-200 min-h-[600px]">

   {/* ════ Left Column: Configuration Panel ════ */}
   <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col border-r border-slate-200 self-stretch">
   {/* Panel Header */}
   <div className="p-4 border-b border-slate-200 bg-slate-50/50">
    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
    <span className="w-2 h-2 rounded-full bg-pupr-blue"></span>
    KONFIGURASI
    <span className="ml-auto bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] tabular-nums font-bold">
     {category === 'empiris' ? 'EMPIRIS' : 'HSS'}
    </span>
    </h3>
   </div>

   {/* Scrollable Content */}
   <div className="flex-1 overflow-y-auto">
    {/* 1. Category Selector */}
    <div className="p-4 border-b border-slate-100">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 block">KATEGORI METODE</label>
    <div className="flex gap-1 p-1 bg-slate-100/80 rounded-sm">
     {([
     { value: 'empiris' as const, label: 'Empiris', icon: <Beaker className="w-3.5 h-3.5" /> },
     { value: 'hss' as const, label: 'HSS', icon: <Activity className="w-3.5 h-3.5" /> },
     ] as const).map(opt => (
     <button
      key={opt.value}
      type="button"
      onClick={() => !isDataReady ? handleCategoryChange(opt.value) : null}
      disabled={isDataReady}
      className={cn(
      'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-sm text-xs font-bold transition-all',
      category === opt.value ? 'bg-white text-pupr-blue shadow-none' : 'text-slate-500 hover:bg-white/50',
      isDataReady && 'cursor-not-allowed opacity-80'
      )}
     >
      {opt.icon}
      {opt.label}
     </button>
     ))}
    </div>
    </div>

    {/* 2. Method Selector */}
    <div className="p-4 border-b border-slate-100">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 block">METODE SPESIFIK</label>
    <Select.Root value={method} onValueChange={(val) => { setMethod(val as MethodType); setChartData([]); setResultSummary(null); }}>
     <Select.Trigger
     disabled={isDataReady}
     className={cn(
      "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-sm border border-slate-200 bg-white hover:border-pupr-blue/30 transition-colors text-left focus:outline-none focus:ring-1 focus:ring-pupr-blue/30",
      isDataReady && "bg-slate-50 cursor-not-allowed opacity-80"
     )}
     >
     <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-sm bg-pupr-blue/10 flex items-center justify-center text-pupr-blue shrink-0">
      {currentMethodInfo?.icon}
      </div>
      <div>
      <div className="text-xs font-bold text-slate-800"><Select.Value /></div>
      <div className="text-[9px] text-slate-500 font-medium">{currentMethodInfo?.description}</div>
      </div>
     </div>
     <Select.Icon><ChevronDown className="w-3.5 h-3.5 text-slate-400" /></Select.Icon>
     </Select.Trigger>
     <Select.Portal>
     <Select.Content className="bg-white rounded-sm border border-slate-200 overflow-hidden z-[9999] shadow-none" position="popper" sideOffset={4}>
      <Select.Viewport className="p-1">
      {currentMethods.map(m => (
       <Select.Item key={m.value} value={m.value} className="flex items-center gap-2.5 px-3 py-2 rounded-sm cursor-pointer outline-none data-[highlighted]:bg-slate-50 transition-colors">
       <div className="w-6 h-6 rounded-sm bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">{m.icon}</div>
       <div>
        <Select.ItemText>{m.label}</Select.ItemText>
        <p className="text-[9px] text-slate-500 font-medium">{m.description}</p>
       </div>
       </Select.Item>
      ))}
      </Select.Viewport>
     </Select.Content>
     </Select.Portal>
    </Select.Root>
    </div>

    {/* 3. Curah Hujan Rencana */}
    <div className="p-4 border-b border-slate-100">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 block">CURAH HUJAN RENCANA</label>
    {hasilAnalisisFrekuensi ? (
     <div className="space-y-2">
     <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-sm border border-emerald-200">
      <BarChart2 className="w-3 h-3" />
      {hasilAnalisisFrekuensi.metodeTerpilih}
      {hasilAnalisisFrekuensi.lulusUjiKecocokan && ' ✓'}
      </span>
     </div>
     <Select.Root
      value={hasilAnalisisFrekuensi.selectedKalaUlang?.toString() || ''}
      onValueChange={(val) => {
      const ku = parseInt(val);
      setSelectedKalaUlang(ku);
      const match = hasilAnalisisFrekuensi.curahHujanRencana.find((v: any) => v.kalaUlang === ku);
      if (match) setLocalR(String(match.curahHujan));
      }}
     >
      <Select.Trigger className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-sm border border-emerald-200 bg-emerald-50/30 hover:border-emerald-300 transition-colors text-left focus:outline-none focus:ring-1 focus:ring-emerald-200">
      <div className="flex items-center gap-2">
       <CloudRain className="w-3.5 h-3.5 text-emerald-600" />
       <Select.Value placeholder="Pilih Kala Ulang..." />
      </div>
      <Select.Icon><ChevronDown className="w-3.5 h-3.5 text-slate-400" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
      <Select.Content className="bg-white rounded-sm border border-slate-200 overflow-hidden z-[9999]" position="popper" sideOffset={4}>
       <Select.Viewport className="p-1">
       {hasilAnalisisFrekuensi.curahHujanRencana.map((v: any) => (
        <Select.Item key={v.kalaUlang} value={v.kalaUlang.toString()} className="flex items-center justify-between px-3 py-2 rounded-sm cursor-pointer outline-none data-[highlighted]:bg-emerald-50 transition-colors">
        <Select.ItemText>Kala Ulang {v.kalaUlang} Tahun</Select.ItemText>
        <span className="text-xs font-bold text-emerald-600 tabular-nums">{v.curahHujan} mm</span>
        </Select.Item>
       ))}
       </Select.Viewport>
      </Select.Content>
      </Select.Portal>
     </Select.Root>
     <SmartOverrideInput label="" unit="mm" globalValue={globalCurahHujan} value={localR} onChange={setLocalR} placeholder="Curah hujan rencana..." />
     </div>
    ) : (
     <div className="space-y-2">
     <div className="flex items-start gap-2 px-3 py-2 rounded-sm bg-amber-50 border border-amber-200 text-amber-800">
      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <div className="text-[10px] font-medium">
      Analisis Frekuensi belum dilakukan.
      <button onClick={() => setShowFreqModal(true)} className="ml-1 text-pupr-blue hover:underline font-bold">Buka</button>
      </div>
     </div>
     <SmartOverrideInput label="" unit="mm" globalValue={globalCurahHujan} value={localR} onChange={setLocalR} placeholder="Input manual..." tooltip="Curah hujan rencana kala ulang" />
     </div>
    )}
    </div>

    {/* 4. Fundamental Parameters */}
    <div className="p-4 border-b border-slate-100">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 block">PARAMETER FUNDAMENTAL</label>
    <div className="space-y-2">
     <SmartOverrideInput label="Luas DAS (A)" unit="km²" globalValue={globalLuasDas} value={localA} onChange={setLocalA} placeholder="Luas catchment area..." tooltip="Luas DAS hingga titik tinjau" />
     <SmartOverrideInput label="Panjang Sungai (L)" unit="km" globalValue={globalPanjangSungai} value={localL} onChange={setLocalL} placeholder="Panjang sungai utama..." tooltip="Panjang sungai utama dari hulu ke outlet" />
    </div>
    </div>

    {/* 5. Method-Specific Parameters */}
    <div className="p-4 border-b border-slate-100">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 block">
     PARAMETER {currentMethodInfo?.label?.toUpperCase()}
    </label>
    {renderMethodParams()}
    </div>

    {/* 6. ARF */}
    <div className="p-4 border-b border-slate-100">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 block">AREA REDUCTION FACTOR</label>
    <AreaReductionCard />
    </div>

    {/* 7. Calculate Button */}
    <div className="p-4">
    <button
     onClick={handleCalculate}
     disabled={isCalculating || !isDataReady}
     className={cn(
     'w-full py-4 rounded-sm font-bold text-sm flex items-center justify-center gap-2 transition-all',
     !isDataReady
      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
      : isCalculating
      ? 'bg-pupr-blue/80 text-white cursor-wait'
      : 'bg-pupr-blue hover:bg-slate-900 text-white'
     )}
    >
     {isCalculating ? (
     <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</>
     ) : !isDataReady ? (
     <><ShieldCheck className="w-4 h-4 opacity-50" /> Lengkapi Data</>
     ) : (
     <><Calculator className="w-4 h-4" /> Hitung & Simpan Analisis</>
     )}
    </button>
    </div>
   </div>
   </div>

   {/* ════ Right Column: Results Workspace ════ */}
   <div className="w-full lg:w-2/3 xl:w-3/4 flex flex-col self-stretch bg-slate-50/30 overflow-hidden">
   {/* Workspace Header */}
   <div className="p-5 border-b border-slate-200 bg-white flex flex-wrap justify-between items-center gap-4">
    <div>
    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
     <Activity className="w-5 h-5 text-pupr-blue" />
     Hasil Simulasi
    </h3>
    <p className="text-xs text-slate-500 font-medium mt-0.5">
     Metode: <span className="font-bold text-slate-700">{currentMethodInfo?.label || '—'}</span>
     <span className="mx-2 text-slate-300">|</span>
     <span className="font-bold text-slate-700">{category === 'empiris' ? 'Empiris' : 'HSS'}</span>
    </p>
    </div>
    {resultSummary && (
    <div className="flex items-center gap-4">
     <div className="text-right">
     <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">DEBIT PUNCAK</div>
     <div className="text-xl font-black text-pupr-blue tabular-nums tracking-tight">{resultSummary.debitPuncak} <span className="text-xs font-bold text-slate-500">m³/s</span></div>
     </div>
     <div className="w-px h-10 bg-slate-200"></div>
     <div className="text-right">
     <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">WAKTU PUNCAK</div>
     <div className="text-xl font-black text-pupr-blue tabular-nums tracking-tight">{resultSummary.waktuPuncak} <span className="text-xs font-bold text-slate-500">jam</span></div>
     </div>
    </div>
    )}
   </div>

   {/* Workspace Content */}
   <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-6">
    <DependencyWarningBanner module="banjir" />

    {/* Frequency Summary */}
    <FrequencyAnalysisSummary onNavigate={() => setShowFreqModal(true)} />

    {/* Project Context */}
    <ProjectContextBanner />

    {/* Hyetograph */}
    <div className="border border-slate-200 bg-white overflow-hidden">
    <div className="p-4 border-b border-slate-200 bg-slate-50">
     <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
     <span className="w-2 h-2 rounded-full bg-pupr-blue"></span>
     HYETOGRAPH
     </h4>
    </div>
    <div className="p-4">
     <HyetographGenerator />
    </div>
    </div>

    {/* Hydrograph Chart */}
    <div className={cn(
    'border bg-white overflow-hidden transition-all',
    isBanjirDirty ? 'border-amber-200' : 'border-slate-200'
    )}>
    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
     <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
     <span className="w-2 h-2 rounded-full bg-pupr-blue"></span>
     KURVA HIDROGRAF BANJIR
     </h4>
     {currentMethodInfo && (
     <span className="text-[10px] font-black text-slate-500 bg-slate-200 px-2 py-0.5 rounded tabular-nums">{currentMethodInfo.label}</span>
     )}
    </div>
    <div className="p-4 min-h-[350px] relative">
     {chartData.length > 0 ? (
     <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
      <defs>
       <linearGradient id="hydroGradient" x1="0" y1="0" x2="0" y2="1">
       <stop offset="5%" stopColor="#0c3a66" stopOpacity={0.25} />
       <stop offset="95%" stopColor="#0c3a66" stopOpacity={0} />
       </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
      <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false}
       label={{ value: 'Waktu (jam)', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#94A3B8' }} />
      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false}
       label={{ value: 'Q (m³/s)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94A3B8' }} />
      <Tooltip
       contentStyle={{ borderRadius: '2px', border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: '11px' }}
       formatter={(value: number) => [`${value} m³/s`, 'Debit (Q)']}
       labelFormatter={(label) => `Jam ke-${label}`}
      />
      <Area type="monotone" dataKey="inflow" stroke="#0c3a66" strokeWidth={2} fill="url(#hydroGradient)"
       dot={{ r: 2, strokeWidth: 1, fill: '#fff' }} activeDot={{ r: 4, strokeWidth: 0, fill: '#0c3a66' }} animationDuration={1200} />
      </AreaChart>
     </ResponsiveContainer>
     ) : (
     <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-sm flex items-center justify-center mb-4">
      <Activity className="w-8 h-8 text-slate-300" />
      </div>
      <p className="text-sm font-bold text-slate-500">Belum Ada Kalkulasi</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">
      Pilih metode, sesuaikan parameter, lalu klik <strong>"Hitung & Simpan Analisis"</strong>.
      </p>
     </div>
     )}
    </div>
    </div>

    {/* Formula Reference */}
    <div className="border border-slate-200 bg-white overflow-hidden">
    <div className="p-4 border-b border-slate-200 bg-slate-50">
     <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
     <span className="w-2 h-2 rounded-full bg-pupr-blue"></span>
     REFERENSI FORMULA
     </h4>
    </div>
    <div className="p-4">
     <FormulaAccordion
     title="Analisis Banjir Rancangan"
     subtitle="Metode Rasional & Hidrograf Satuan Sintetis (HSS)"
     theme="purple"
     formulas={[
      { label: "Metode Rasional", math: "Q_p = 0.278 \\cdot C \\cdot I \\cdot A" },
      { label: "Intensitas Hujan (Mononobe)", math: "I = \\frac{R_{24}}{24} \\left(\\frac{24}{t_c}\\right)^{2/3}" },
      { label: "Waktu Konsentrasi (Kirpich)", math: "t_c = \\left(\\frac{0.87 \\cdot L^2}{1000 \\cdot S}\\right)^{0.385}" },
      { label: "HSS Nakayasu", math: "Q_p = \\frac{C \\cdot A \\cdot R_o}{3.6 \\cdot (0.3 \\cdot T_p + T_{0.3})}" }
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
    </div>
   </div>
   </div>
  </div>
  </div>

  {/* Frequency Analysis Modal Portal */}
  <FrequencyAnalysisModal isOpen={showFreqModal} onClose={() => setShowFreqModal(false)} />
 </>
 );
};

// ────────────────────────────────────────────
// Helper: Simple input field
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
  {tooltip && <HelpTooltip content={tooltip} />}
 </label>
 <div className="relative">
  <input
  type="number"
  value={value}
  onChange={(e) => onChange(e.target.value)}
  placeholder={placeholder}
  className="w-full rounded-sm px-3 py-2 pr-14 text-sm font-semibold text-slate-700 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-pupr-blue/30 focus:border-pupr-blue/30 transition-all placeholder:text-slate-300 tabular-nums"
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
