import React, { useState, useMemo } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import {
 calculateHSSNakayasu,
 calculateHSSGamma1,
 calculateHSSSnyder,
 calculateHSSSCS,
 calculateHSSClark,
 calculateMelchior,
 calculateHaspers,
 calculateWeduwen as calculateDerWeduwen,
 calculateRational
} from '@/lib/engine/flood';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from '@/hooks/useToast';
import {
 Waves,
 Calculator,
 Settings2,
 TrendingUp,
 Activity,
 Star,
 Info,
 Droplets,
 Mountain,
 Layers,
 BarChart3,
 FlaskConical,
 Beaker,
 BarChart2
} from 'lucide-react';
import { useFrequencyAnalysis } from '@/hooks/useFrequencyAnalysis';

interface StepMetodeBanjirProps {
 onComplete: (method: string, hydrograph: any[], peak: number) => void;
 isCompleted: boolean;
}

const METHODS = [
 // HSS CATEGORY
 { id: 'scs', label: 'SCS UH', type: 'hss', color: '#6366f1', icon: Droplets, desc: 'Sangat Disarankan (SNI)', recommended: 'das_any' },
 { id: 'gama1', label: 'Gama-I', type: 'hss', color: '#10b981', icon: BarChart3, desc: 'SNI - Standard Sri Harto', recommended: 'das_any' },
 { id: 'nakayasu', label: 'Nakayasu', type: 'hss', color: '#3b82f6', icon: Activity, desc: 'Populer di Indonesia', recommended: 'das_any' },
 { id: 'snyder', label: 'Snyder', type: 'hss', color: '#f59e0b', icon: Mountain, desc: 'Standard Internasional', recommended: 'das_any' },
 { id: 'clark', label: 'Clark', type: 'hss', color: '#8b5cf6', icon: Layers, desc: 'Metode Routing Linear', recommended: 'das_any' },

 // EMPIRIS / RASIONAL CATEGORY
 { id: 'rational', label: 'Rasional', type: 'empiris', color: '#64748b', icon: Calculator, desc: 'DAS < 300 ha', recommended: 'das_small' },
 { id: 'melchior', label: 'Melchior', type: 'empiris', color: '#ec4899', icon: Beaker, desc: 'DAS > 100 km²', recommended: 'das_large' },
 { id: 'haspers', label: 'Haspers', type: 'empiris', color: '#0ea5e9', icon: FlaskConical, desc: 'DAS < 100 km²', recommended: 'das_medium' },
 { id: 'der_weduwen', label: 'Der Weduwen', type: 'empiris', color: '#f43f5e', icon: BarChart2, desc: 'DAS < 100 km² (Tropis)', recommended: 'das_medium' },
];

export const StepMetodeBanjir: React.FC<StepMetodeBanjirProps> = ({ onComplete }) => {
 const { getR24, selectedKalaUlang } = useFrequencyAnalysis();
 const { morfometriDAS, setHasilBanjirEmpiris, setHasilBanjirHSS } = useHydrologyStore();
 const [selectedMethod, setSelectedMethod] = useState<string>('scs');
 const [isAdvanced, setIsAdvanced] = useState(false);

 // Params Tuning
 const [alpha, setAlpha] = useState(2.0);
 const [ct, setCt] = useState(1.4);    // Snyder: more realistic default (was 0.8)
 const [cp, setCp] = useState(0.62);
 const [storageR, setStorageR] = useState(1.5);
 const [cCoefficient, setCCoefficient] = useState(0.65);

 // Expert Overrides
 const [baseflow, setBaseflow] = useState(0);
 const [tcOverride, setTcOverride] = useState(0);
 const [biasFactor, setBiasFactor] = useState(1.0);

 // Gama-I Morfometri
 const [sf, setSf] = useState(0.45);
 const [sim, setSim] = useState(0.3);
 const [jn, setJn] = useState(3);
 const [sn, setSn] = useState(0.1);
 const [rua, setRua] = useState(0.2);

 const A = morfometriDAS?.luasDAS || 0;
 const L = morfometriDAS?.panjangSungai || 0;
 const S = morfometriDAS?.kemiringanSungai || 0.01;

 const R24 = getR24(selectedKalaUlang || 25) || 0;
 const isHighReturnPeriod = (selectedKalaUlang || 0) >= 1000;

 // Compute Clark Tc from DAS parameters instead of hardcoding
 const clarkTc = useMemo(() => {
  if (!L || !S) return 1.0;
  // Kirpich formula: tc = 0.0195 * (L*1000)^0.77 * S^-0.385 / 60
  return Math.max(0.5, 0.0195 * Math.pow(L * 1000, 0.77) * Math.pow(S, -0.385) / 60);
 }, [L, S]);

 const results = useMemo(() => {
  if (!A || !L) return {};

  const hss: any = {};
  const emp: any = {};

  // Apply Tc Override if provided
  const effectiveSCS_Tc = tcOverride > 0 ? tcOverride : undefined;
  const effectiveClark_Tc = tcOverride > 0 ? tcOverride : clarkTc;

  hss.scs = calculateHSSSCS({ Ro: 1, A, L, S, Tc: effectiveSCS_Tc });
  hss.gama1 = calculateHSSGamma1({ Ro: 1, A, L, S, SF: sf, SIM: sim, JN: jn, SN: sn, RUA: rua });
  hss.nakayasu = calculateHSSNakayasu({ Ro: 1, Alpha: alpha, A, L });
  hss.snyder = calculateHSSSnyder({ Ro: 1, A, L, Lc: L * 0.5, Ct: ct, Cp: cp });
  hss.clark = calculateHSSClark({ Ro: 1, A, Tc: effectiveClark_Tc, R: storageR });

  emp.rational = calculateRational({ C: cCoefficient, A, L, S, R24 });
  emp.melchior = calculateMelchior({ A, L, S, R24 });
  emp.haspers = calculateHaspers({ A, L, S, R24 });
  emp.der_weduwen = calculateDerWeduwen({ A, L, S, R24 });

  // Apply Global Bias Factor to all peak values
  Object.keys(hss).forEach(key => {
   hss[key].Qp *= biasFactor;
   hss[key].hydrograph = hss[key].hydrograph.map((pt: any) => ({ ...pt, discharge: pt.discharge * biasFactor }));
  });
  Object.keys(emp).forEach(key => {
   emp[key].Qp *= biasFactor;
  });

  return { hss, emp };
 }, [A, L, S, R24, alpha, ct, cp, storageR, cCoefficient, sf, sim, jn, sn, rua, clarkTc, tcOverride, biasFactor]);

 const recommendation = useMemo(() => {
  if (A <= 0) return null;
  if (A > 100) return 'DAS Besar (>100 km²): Melchior & HSS (SCS/Gama I) sangat disarankan.';
  if (A < 3) return 'DAS Sangat Kecil (<300 ha): Metode Rasional (Mononobe-Kirpich) adalah pilihan standar.';
  return 'DAS Menengah: Haspers/Der Weduwen & HSS (SCS/Gama I/Nakayasu) disarankan.';
 }, [A]);

 const chartData = useMemo(() => {
  if (!results.hss) return [];
  const data: any[] = [];
  const activeUH = results.hss[selectedMethod] || results.hss.scs;
  const maxTime = Math.min(activeUH.hydrograph?.[activeUH.hydrograph.length - 1]?.time || 24, 48);

  for (let t = 0; t <= maxTime; t += 0.5) {
  const point: any = { time: t };
  Object.entries(results.hss).forEach(([id, hss]: [string, any]) => {
   const match = hss.hydrograph.find((p: any) => Math.abs(p.time - t) < 0.25);
   point[id] = match ? match.discharge : null;
  });
  data.push(point);
  }
  return data;
 }, [results, selectedMethod]);

 const handleCalculate = () => {
  setHasilBanjirHSS(results.hss);
  setHasilBanjirEmpiris(results.emp);
  toast.success(`Analisis Multi-Metode selesai (Q${selectedKalaUlang})`);
 };

 const handleComplete = () => {
  const method = METHODS.find(m => m.id === selectedMethod);
  if (!method) return;
  if (method.type === 'hss') {
  const selected = results.hss[selectedMethod];
  onComplete(selectedMethod, selected.hydrograph, selected.Qp);
  } else {
  const selected = results.emp[selectedMethod];
  onComplete(selectedMethod, [], selected.Qp);
  }
 };

 const activeMethodInfo = METHODS.find(m => m.id === selectedMethod);

 return (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-75">
  {/* Recommendation Header */}
  <div className="bg-slate-50 border border-slate-200 p-4">
   <div className="flex items-center justify-between mb-4">
   <div className="flex items-start gap-3">
    <div className="p-2 bg-pupr-blue/10 border border-pupr-blue/20">
    <Star className="w-4 h-4 text-pupr-blue" />
    </div>
    <div>
    <p className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
     Rekomendasi Pemilihan Metode
     {isHighReturnPeriod && (
     <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 animate-pulse">
      BMB / PMF Detected
     </span>
     )}
    </p>
    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{recommendation}</p>
    </div>
   </div>
   <button
    onClick={() => setIsAdvanced(!isAdvanced)}
    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${isAdvanced ? 'bg-pupr-blue text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
   >
    <Settings2 className="w-3 h-3" />
    {isAdvanced ? 'Tuning: ON' : 'Tuning'}
   </button>
   </div>

   {/* Method Selection Grid (each with unique icon and color) */}
   <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
   {METHODS.map(m => {
    const Icon = m.icon;
    const isSelected = selectedMethod === m.id;
    return (
    <button
     key={m.id}
     onClick={() => setSelectedMethod(m.id)}
     className={`flex flex-col items-center justify-center p-3 border transition-all group relative
     ${isSelected
      ? 'border-pupr-blue bg-white -translate-y-0.5'
      : 'border-transparent bg-white/50 hover:bg-white'
     }`}
    >
     <div className={`w-8 h-8 mb-2 flex items-center justify-center transition-all
     ${isSelected ? 'text-white' : 'bg-slate-100 text-slate-500'}
     `} style={isSelected ? { backgroundColor: m.color } : undefined}>
     <Icon className="w-4 h-4" />
     </div>
     <p className={`text-[9px] font-extrabold text-center uppercase leading-tight ${isSelected ? 'text-pupr-blue' : 'text-slate-500'}`}>
     {m.label}
     </p>
    </button>
    );
   })}
   </div>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-slate-200">
   {/* Custom Tuning Panel */}
   <div className="p-5 bg-white border-r border-slate-200 lg:col-span-4 flex flex-col min-h-[400px]">
   <div className="flex-1 space-y-6">
    <section>
    <div className="flex items-center justify-between mb-4">
     <h3 className="text-[11px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em]">
     <span className="w-2 h-2 bg-pupr-blue"></span>
     Tuning: {activeMethodInfo?.label}
     </h3>
    </div>

    <div className="space-y-4 animate-in fade-in duration-75">
     {selectedMethod === 'rational' && (
     <div className="p-4 bg-slate-50 border-l-4 border-l-slate-400">
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Koefisien Limpasan (C)</label>
      <input type="range" min="0" max="1" step="0.01" value={cCoefficient} onChange={(e) => setCCoefficient(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-200 appearance-none cursor-pointer accent-pupr-blue" />
      <div className="flex justify-between mt-1"><span className="text-[10px] font-bold text-slate-500">0.0</span><span className="text-xs font-extrabold text-pupr-blue tabular-nums">{cCoefficient}</span><span className="text-[10px] font-bold text-slate-500">1.0</span></div>
      <p className="text-[9px] text-slate-500 mt-2">Standar SNI: urban ~0.7-0.9, perhutanan ~0.1-0.3.</p>
     </div>
     )}

     {selectedMethod === 'nakayasu' && (
     <div className="p-4 bg-slate-50 border-l-4 border-l-blue-400">
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Parameter Alpha (α)</label>
      <input type="range" min="1.0" max="4.0" step="0.1" value={alpha} onChange={(e) => setAlpha(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-200 appearance-none cursor-pointer accent-pupr-blue" />
      <div className="flex justify-between mt-1"><span className="text-[10px] font-bold text-slate-500">1.0</span><span className="text-xs font-extrabold text-pupr-blue tabular-nums">{alpha}</span><span className="text-[10px] font-bold text-slate-500">4.0</span></div>
      <p className="text-[9px] text-slate-500 mt-2">Alpha 2.0 (Standard), 1.5 (Tajam), 3.0 (Tumpul).</p>
     </div>
     )}

     {selectedMethod === 'snyder' && (
     <div className="space-y-3">
      <div className="p-4 bg-slate-50 border-l-4 border-l-amber-400">
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Koefisien Ct</label>
      <input type="number" min="0.3" max="6.5" value={ct} onChange={(e) => setCt(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-slate-200 text-sm font-bold tabular-nums" step="0.1" />
      <p className="text-[9px] text-slate-500 mt-2">Range: 0.3–6.5. Standar tropis: 1.2–2.0.</p>
      </div>
      <div className="p-4 bg-slate-50 border-l-4 border-l-amber-400">
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Koefisien Cp</label>
      <input type="number" min="0.15" max="0.85" value={cp} onChange={(e) => setCp(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-slate-200 text-sm font-bold tabular-nums" step="0.01" />
      <p className="text-[9px] text-slate-500 mt-2">Range: 0.15–0.85. Standar: 0.56–0.69.</p>
      </div>
     </div>
     )}

     {selectedMethod === 'gama1' && (
     <div className="p-4 bg-slate-50 border-l-4 border-l-emerald-400">
      <p className="text-[9px] font-bold text-emerald-600 uppercase mb-3">Parameter Morfometri Sri Harto</p>
      <div className="grid grid-cols-2 gap-3">
      <div>
       <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">SF (Faktor Sumber)</label>
       <input type="number" min="0" value={sf} onChange={(e) => setSf(parseFloat(e.target.value))} className="w-full min-h-[44px] px-2 py-2.5 border border-slate-200 text-xs font-bold tabular-nums" step="0.1" />
      </div>
      <div>
       <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">SIM (Simetri)</label>
       <input type="number" min="0" value={sim} onChange={(e) => setSim(parseFloat(e.target.value))} className="w-full min-h-[44px] px-2 py-2.5 border border-slate-200 text-xs font-bold tabular-nums" step="0.01" />
      </div>
      </div>
      {isAdvanced && (
      <div className="grid grid-cols-3 gap-2 mt-3 animate-in fade-in slide-in-from-top-1">
       <div><label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">JN</label><input type="number" min="0" value={jn} onChange={(e) => setJn(parseFloat(e.target.value))} className="w-full px-1 py-1 border border-slate-200 text-[10px] font-bold tabular-nums" step="1" /></div>
       <div><label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">SN</label><input type="number" min="0" value={sn} onChange={(e) => setSn(parseFloat(e.target.value))} className="w-full px-1 py-1 border border-slate-200 text-[10px] font-bold tabular-nums" step="0.01" /></div>
       <div><label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">RUA</label><input type="number" min="0" value={rua} onChange={(e) => setRua(parseFloat(e.target.value))} className="w-full px-1 py-1 border border-slate-200 text-[10px] font-bold tabular-nums" step="0.01" /></div>
      </div>
      )}
     </div>
     )}

     {/* Expert Calibration Panel */}
     <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
       <h3 className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2 uppercase tracking-widest">
         <span className="w-2 h-2 bg-red-500"></span>
         Expert Calibration
       </h3>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div>
           <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Baseflow (Q-base)</label>
           <div className="relative">
             <input
               type="number"
               step="0.01"
               value={baseflow}
               onChange={(e) => setBaseflow(Number(e.target.value))}
               className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 font-bold tabular-nums focus:ring-1 focus:ring-pupr-blue focus:outline-none"
             />
             <span className="absolute right-3 top-2 text-[10px] text-slate-400">m³/s</span>
           </div>
         </div>
         <div>
           <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tc Override (Manual)</label>
           <div className="relative">
             <input
               type="number"
               step="0.1"
               value={tcOverride}
               onChange={(e) => setTcOverride(Number(e.target.value))}
               className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 font-bold tabular-nums focus:ring-1 focus:ring-pupr-blue focus:outline-none"
             />
             <span className="absolute right-3 top-2 text-[10px] text-slate-400">Jam</span>
           </div>
         </div>
         <div>
           <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Global Bias Factor</label>
           <input
             type="number"
             step="0.05"
             value={biasFactor}
             onChange={(e) => setBiasFactor(Number(e.target.value))}
             className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 font-bold tabular-nums focus:ring-1 focus:ring-pupr-blue focus:outline-none"
           />
         </div>
       </div>
       <p className="text-[9px] text-slate-500 mt-2 font-medium">
         * Bias factor akan mengalikan seluruh nilai debit pada hietograf dan debit puncak final.
       </p>
     </div>

     {selectedMethod === 'clark' && (
     <div className="space-y-3">
      <div className="p-4 bg-slate-50 border-l-4 border-l-purple-400">
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Storage Coefficient (R)</label>
      <input type="number" min="0" value={storageR} onChange={(e) => setStorageR(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-slate-200 text-sm font-bold tabular-nums" step="0.1" />
      </div>
      <div className="p-3 bg-slate-50 border border-slate-200">
      <p className="text-[9px] font-bold text-slate-500 uppercase">Tc (Computed)</p>
      <p className="text-sm font-bold text-pupr-blue tabular-nums">{clarkTc.toFixed(2)} jam</p>
      <p className="text-[9px] text-slate-400 mt-1">Dihitung dari L={L}km, S={S} m/m (Kirpich)</p>
      </div>
     </div>
     )}

     {selectedMethod === 'scs' && (
     <div className="p-4 bg-slate-50 border-l-4 border-l-indigo-400">
      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Metode SCS Unit Hydrograph (SNI) menggunakan kurva tak berdimensi standar. Parameter diturunkan langsung dari Luas DAS, Panjang Sungai, dan Kemiringan.</p>
     </div>
     )}

     {(selectedMethod === 'melchior' || selectedMethod === 'haspers' || selectedMethod === 'der_weduwen') && (
     <div className="p-4 bg-slate-50 border-l-4 border-l-slate-300">
      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Metode empiris — parameter dihitung otomatis dari karakteristik DAS (A, L, S) dan curah hujan rencana (R24).</p>
     </div>
     )}
    </div>
    </section>

    <div className="p-4 bg-slate-900">
    <h4 className="text-[9px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Live Summary: {activeMethodInfo?.label}</h4>
    <div className="flex items-end justify-between">
     <div>
     <p className="text-[10px] text-slate-500 font-bold uppercase">Debit Puncak (m³/s)</p>
     <p className="text-3xl font-extrabold text-white tabular-nums tracking-tighter">
      {(results[activeMethodInfo?.type === 'hss' ? 'hss' : 'emp']?.[selectedMethod]?.Qp || 0).toFixed(3)}
     </p>
     </div>
     <div className="text-right">
     <div className="flex items-center gap-1 text-pupr-blue text-[10px] font-extrabold uppercase mb-1">
      <TrendingUp className="w-3 h-3" /> Q{selectedKalaUlang}
     </div>
     <p className="text-[9px] text-slate-500 font-bold tabular-nums">R24: {R24} mm</p>
     </div>
    </div>
    </div>
   </div>

   <button
    onClick={handleCalculate}
    className="w-full py-3 bg-pupr-blue hover:bg-slate-900 text-white font-bold transition-all flex items-center justify-center gap-2 mt-6 uppercase text-xs tracking-tighter"
   >
    <Calculator className="w-4 h-4" /> Simpan Konfigurasi Tuning
   </button>
   </div>

   {/* Charts and Comparison */}
   <div className="p-5 bg-white lg:col-span-8">
   <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-2">
    <Waves className="w-5 h-5 text-pupr-blue" />
    <div>
     <h3 className="text-sm font-bold text-slate-900">Visualisasi Hidrograf Satuan</h3>
     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Metode Aktif: {activeMethodInfo?.label}</p>
    </div>
    </div>
   </div>

   <div className="h-[350px] w-full">
    <ResponsiveContainer width="100%" height="100%">
    <LineChart data={chartData}>
     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
     <XAxis dataKey="time" label={{ value: 'Waktu (jam)', position: 'insideBottomRight', offset: -5, fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
     <YAxis label={{ value: 'UH Ordinat', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
     <Tooltip
      cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
      contentStyle={{ border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: '11px' }}
     />
     <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 800, paddingTop: '15px' }} />
     {METHODS.filter(m => m.type === 'hss').map(m => (
      <Line
      key={m.id}
      type="monotone"
      dataKey={m.id}
      stroke={selectedMethod === m.id ? m.color : '#cbd5e1'}
      strokeWidth={selectedMethod === m.id ? 4 : 1.5}
      dot={false}
      name={m.label}
      opacity={selectedMethod === m.id ? 1 : 0.2}
      animationDuration={500}
      />
     ))}
    </LineChart>
    </ResponsiveContainer>
   </div>

   {/* Multi-metode Comparison Footer */}
   <div className="mt-8 pt-6 border-t border-slate-100">
    <p className="text-[11px] font-black text-slate-500 uppercase mb-4 tracking-[0.2em] flex items-center gap-2">
    <span className="w-2 h-2 bg-pupr-blue"></span>
    Komparasi Debit Puncak (Q{selectedKalaUlang})
    </p>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <div className={`p-3 border-l-4 transition-all ${selectedMethod === 'scs' ? 'bg-indigo-50 border-l-[#6366f1]' : 'bg-slate-50 border-l-slate-200 opacity-60'}`}>
     <p className="text-[8px] font-bold text-slate-500 uppercase">SCS UH</p>
     <p className="text-sm font-extrabold text-slate-900 tabular-nums">{(results.hss?.scs?.Qp || 0).toFixed(2)}</p>
    </div>
    <div className={`p-3 border-l-4 transition-all ${selectedMethod === 'gama1' ? 'bg-emerald-50 border-l-[#10b981]' : 'bg-slate-50 border-l-slate-200 opacity-60'}`}>
     <p className="text-[8px] font-bold text-slate-500 uppercase">HSS Gama-I</p>
     <p className="text-sm font-extrabold text-slate-900 tabular-nums">{(results.hss?.gama1?.Qp || 0).toFixed(2)}</p>
    </div>
    <div className={`p-3 border-l-4 transition-all ${selectedMethod === 'nakayasu' ? 'bg-pupr-surface border-l-[#3b82f6]' : 'bg-slate-50 border-l-slate-200 opacity-60'}`}>
     <p className="text-[8px] font-bold text-slate-500 uppercase">HSS Nakayasu</p>
     <p className="text-sm font-extrabold text-slate-900 tabular-nums">{(results.hss?.nakayasu?.Qp || 0).toFixed(2)}</p>
    </div>
    <div className={`p-3 border-l-4 transition-all ${selectedMethod === 'rational' ? 'bg-slate-100 border-l-[#64748b]' : 'bg-slate-50 border-l-slate-200 opacity-60'}`}>
     <p className="text-[8px] font-bold text-slate-500 uppercase">Metode Rasional</p>
     <p className="text-sm font-extrabold text-slate-900 tabular-nums">{(results.emp?.rational?.Qp || 0).toFixed(2)}</p>
    </div>
    </div>
   </div>
   </div>
  </div>

  <div className="flex justify-end pt-4 gap-4 items-center">
   <div className="flex items-center gap-2 text-[10px] text-slate-500">
   <Info className="w-4 h-4" />
   <span>Konfirmasi pilihan metode ({selectedMethod.toUpperCase()}) untuk lanjut.</span>
   </div>
   <button
   onClick={handleComplete}
   className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all text-sm uppercase tracking-tighter"
   >
   Pakai {activeMethodInfo?.label} & Lanjut →
   </button>
  </div>
  </div>
 );
};
