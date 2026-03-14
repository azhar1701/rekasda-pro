import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Area, AreaChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Calculator, Info, Waves, CheckCircle2, AlertCircle, Droplets, Sparkles } from 'lucide-react';
// import { simulateReservoirOperation } from '@/lib/engine/embung';
import { toast } from '@/hooks/useToast';
import { useNeracaAirEmbungMutation } from '@/hooks/api/useEmbungApi';

// Mock Data Defaults
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Des'];

// Setup defaults with realistic units: Inflow/Demand (* 10^3 m^3), Rain/Evap (mm)
const DEFAULT_INPUTS = MONTHS.map((m, i) => ({
 id: String(i),
 month: m,
 inflow: Math.floor(Math.random() * 50) + 20, // x 1000 m3
 demand: 30, // x 1000 m3
 evap: 120, // mm
 rain: Math.floor(Math.random() * 200), // mm
}));

// Mock Reservoir Config
const CONFIG = {
 initialStorage: 300000,
 deadStorage: 50000,
 maxStorage: 350000,
 surfaceArea: 20000, // 2 Ha
 seepageLoss: 0
};

interface OperationPatternTabProps {
 onConsultAI?: (data: any, result: any) => void;
}

export const OperationPatternTab: React.FC<OperationPatternTabProps> = ({ onConsultAI }) => {

 // States
 const [inputs, setInputs] = useState(DEFAULT_INPUTS);
 const [resultData, setResultData] = useState<any[] | null>(null);
 const [summary, setSummary] = useState<{ reliability: number, deficitMonths: number, finalStorage: number } | null>(null);

 const handleInputChange = (index: number, field: keyof typeof DEFAULT_INPUTS[0], value: string) => {
 const newInputs = [...inputs];
 (newInputs[index] as any)[field] = parseFloat(value) || 0;
 setInputs(newInputs);
 setResultData(null);
 setSummary(null);
 };

 const neracaAirMutation = useNeracaAirEmbungMutation();
 const isCalculating = neracaAirMutation.isPending;

 const handleCalculate = async () => {
 setResultData(null);
 setSummary(null);

 try {
 const inflows = inputs.map(i => i.inflow * 1000);
 const demands = inputs.map(i => i.demand * 1000);
 const evaporationVols = inputs.map(i => ((i.evap - i.rain) / 1000) * CONFIG.surfaceArea);
 const infiltrationVols = inputs.map(() => CONFIG.seepageLoss);

 const wbResult = await neracaAirMutation.mutateAsync({
 initialStorage: CONFIG.initialStorage,
 inflows,
 demands,
 evaporation: evaporationVols,
 infiltration: infiltrationVols,
 sMax: CONFIG.maxStorage,
 sMin: CONFIG.deadStorage
 });

 const chartData = wbResult.steps.map((step: any, idx: number) => ({
 month: MONTHS[idx],
 storage: Number((step.finalStorage / 1000).toFixed(1)),
 status: step.status.toUpperCase(),
 deficit: step.deficitVolume > 0 ? Number((step.deficitVolume / 1000).toFixed(1)) : 0,
 spill: step.spillVolume > 0 ? Number((step.spillVolume / 1000).toFixed(1)) : 0
 }));

 setResultData(chartData);

 const deficitMonths = wbResult.steps.filter((s: any) => s.deficitVolume > 0).length;
 const finalStorage = wbResult.steps[wbResult.steps.length - 1].finalStorage / 1000;

 setSummary({
 reliability: Number(wbResult.reliability.toFixed(1)),
 deficitMonths,
 finalStorage: Number(finalStorage.toFixed(1))
 });

 toast.success('Simulasi Pola Operasi Waduk sukses menggunakan FastAPI Engine.');
 } catch (error: any) {
 toast.error(`Terjadi kesalahan: ${error.detail ?? error.message ?? 'Unknown error'}`);
 }
 };

 return (
 <div className="flex flex-col h-full gap-6">
 {/* Header Info */}
 <div className="flex items-start justify-between bg-pupr-surface/50 p-4 rounded-sm border border-pupr-border">
 <div className="flex gap-3">
 <Info className="w-5 h-5 text-pupr-blue shrink-0 mt-0.5" />
 <div>
 <h3 className="text-sm font-semibold text-blue-900">Simulasi Pola Operasi Waduk</h3>
 <p className="text-sm text-pupr-blue/80 mt-1">
 Simulasi neraca air waduk (Water Balance) bulanan mempertimbangkan inflow, evaporasi, curah hujan, dan kebutuhan (demand) untuk menentukan keandalan (reliability).
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <Button
 onClick={handleCalculate}
 disabled={isCalculating}
 className="bg-pupr-blue hover:bg-teal-700 text-white shrink-0"
 >
 {isCalculating ? (
 <div className="flex items-center gap-2">
 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-sm animate-pulse bg-slate-200 rounded-sm" />
 <span>Menghitung...</span>
 </div>
 ) : (
 <>
 <Calculator className="w-4 h-4 mr-2" />
 Simulasi Operasi
 </>
 )}
 </Button>
 {summary && onConsultAI && (
 <Button
 onClick={() => onConsultAI({ inputs, config: CONFIG }, { resultData, summary })}
 className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 border-indigo-200 transition-all group shrink-0"
 >
 <Sparkles className="w-4 h-4 mr-2 text-pupr-blue group- transition-transform" />
 Analisis AI
 </Button>
 )}
 </div>
 </div>

 <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-6">
 {/* KIRI/ATAS: Parameter Input */}
 <Card className="xl:w-5/12 flex flex-col border-slate-200 dark:border-slate-700 min-h-[400px]">
 <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50 dark:bg-slate-800">
 <CardTitle className="text-base text-slate-800 dark:text-slate-200">Data Historis & Kebutuhan</CardTitle>
 <CardDescription className="text-xs">Volume dalam 10³ m³, Iklim dalam mm</CardDescription>
 </CardHeader>
 <CardContent className="flex-1 overflow-auto p-0 border border-slate-200 dark:border-slate-700 border-t-0 rounded-b-xl bg-white dark:bg-slate-900">
 <div className="w-full min-w-[380px]">
 {/* Table Header */}
 <div className="flex w-full sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-wider font-semibold text-slate-500 z-10">
 <div className="w-12 py-2 px-3 text-left">Bln</div>
 <div className="flex-1 py-2 px-1 text-center" title="Inflow (10³ m³)">Inflow</div>
 <div className="flex-1 py-2 px-1 text-center" title="Demand (10³ m³)">Demand</div>
 <div className="flex-1 py-2 px-1 text-center" title="Curah Hujan (mm)">Hujan</div>
 <div className="flex-1 py-2 px-1 text-center" title="Evaporasi (mm)">Evap</div>
 </div>

 {/* Table Body */}
 <div className="w-full pb-2">
 {inputs.map((row, idx) => (
 <div key={row.id} className="flex w-full items-center border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:bg-slate-800 transition-colors">
 <div className="w-12 py-1.5 px-3 font-medium text-xs text-slate-600 dark:text-slate-400">
 {row.month}
 </div>
 <div className="flex-1 py-1 px-1">
 <Input
 type="number"
 value={row.inflow}
 onChange={(e) => handleInputChange(idx, 'inflow', e.target.value)}
 className="h-8 text-xs text-right focus-visible:ring-1 focus-visible:ring-teal-500 border-transparent hover:border-slate-200 dark:border-slate-700 bg-transparent hover:bg-white dark:bg-slate-900"
 />
 </div>
 <div className="flex-1 py-1 px-1">
 <Input
 type="number"
 value={row.demand}
 onChange={(e) => handleInputChange(idx, 'demand', e.target.value)}
 className="h-8 text-xs text-right focus-visible:ring-1 focus-visible:ring-teal-500 border-transparent hover:border-slate-200 dark:border-slate-700 bg-transparent hover:bg-white dark:bg-slate-900"
 />
 </div>
 <div className="flex-1 py-1 px-1">
 <Input
 type="number"
 value={row.rain}
 onChange={(e) => handleInputChange(idx, 'rain', e.target.value)}
 className="h-8 text-xs text-right focus-visible:ring-1 focus-visible:ring-teal-500 border-transparent hover:border-slate-200 dark:border-slate-700 bg-transparent hover:bg-white dark:bg-slate-900"
 />
 </div>
 <div className="flex-1 py-1 px-1">
 <Input
 type="number"
 value={row.evap}
 onChange={(e) => handleInputChange(idx, 'evap', e.target.value)}
 className="h-8 text-xs text-right focus-visible:ring-1 focus-visible:ring-teal-500 border-transparent hover:border-slate-200 dark:border-slate-700 bg-transparent hover:bg-white dark:bg-slate-900"
 />
 </div>
 </div>
 ))}
 </div>
 </div>
 </CardContent>
 </Card>

 {/* KANAN: Visualisasi & Rekap */}
 <div className="xl:w-7/12 flex flex-col gap-4 min-h-0">

 {/* Ringkasan Keandalan */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
 <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
 <CardContent className="p-4 flex flex-col justify-center">
 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Keandalan (Reliability)</p>
 <h3 className={`text-2xl font-bold ${summary?.reliability === 100 ? 'text-pupr-blue' : 'text-amber-500'}`}>
 {summary ? `${summary.reliability}%` : "-"}
 </h3>
 </CardContent>
 </Card>
 <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
 <CardContent className="p-4 flex flex-col justify-center">
 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Bulan Defisit</p>
 <h3 className={`text-2xl font-bold ${(summary?.deficitMonths || 0) > 0 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
 {summary ? `${summary.deficitMonths} Bln` : "-"}
 </h3>
 </CardContent>
 </Card>
 <Card className="col-span-2 bg-slate-800 text-slate-100 border-transparent overflow-hidden relative">
 <Waves className="absolute -right-4 -bottom-4 w-24 h-24 text-slate-700 dark:text-slate-300 opacity-50" />
 <CardContent className="p-4 relative z-10">
 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Storage Akhir Tahun</p>
 <div className="flex items-baseline gap-2">
 <h3 className="text-2xl font-bold text-white">
 {summary ? summary.finalStorage : "-"}
 </h3>
 <span className="text-slate-500 text-xs">×10³ m³</span>
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Grafik Fluktuasi Tampungan */}
 <Card className="flex-1 border-slate-200 dark:border-slate-700 flex flex-col min-h-[300px]">
 <CardHeader className="py-3 px-5 border-b border-slate-100 bg-white dark:bg-slate-900">
 <CardTitle className="text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
 <Droplets className="w-4 h-4 text-pupr-blue" />
 Fluktuasi Tampungan Waduk
 </CardTitle>
 </CardHeader>
 <CardContent className="flex-1 p-4 relative">
 {isCalculating && (
 <div className="absolute inset-0 z-20 flex bg-white dark:bg-slate-900 items-center justify-center rounded-b-xl">
 <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-teal-500 rounded-sm animate-pulse bg-slate-200 rounded-sm" />
 </div>
 )}

 {!resultData && !isCalculating ? (
 <div className="h-full flex items-center justify-center text-slate-500 text-sm font-medium">
 Menunggu simulasi dijalankan...
 </div>
 ) : (
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={resultData || []} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
 <defs>
 <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
 <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.2} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
 <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
 <YAxis domain={[0, 400]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
 <Tooltip
 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
 formatter={(value: number) => [`${value} × 10³ m³`]}
 />
 <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />

 {/* Reference Lines */}
 <ReferenceLine y={CONFIG.maxStorage / 1000} label={{ position: 'top', value: 'MAN (Muka Air Normal)', fill: '#64748b', fontSize: 10 }} stroke="#94a3b8" strokeDasharray="3 3" />
 <ReferenceLine y={CONFIG.deadStorage / 1000} label={{ position: 'bottom', value: 'Tampungan Mati (Dead Storage)', fill: '#ef4444', fontSize: 10 }} stroke="#ef4444" strokeDasharray="3 3" />

 <Area
 type="monotone"
 dataKey="storage"
 name="Volume Tampungan"
 stroke="#0284c7"
 strokeWidth={2}
 fill="url(#colorStorage)"
 activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
 />
 </AreaChart>
 </ResponsiveContainer>
 )}
 </CardContent>
 </Card>

 {/* Tabel Rekap Status */}
 <Card className=" border-slate-200 dark:border-slate-700">
 <CardContent className="p-0">
 {resultData ? (
 <div className="grid grid-cols-6 md:grid-cols-12 gap-[1px] bg-slate-200 rounded-sm overflow-hidden">
 {resultData.map((res, i) => (
 <div key={i} className="bg-white dark:bg-slate-900 p-2 text-center flex flex-col items-center justify-center">
 <span className="text-[10px] font-semibold text-slate-500">{res.month}</span>
 {(res.status === 'NORMAL' || res.status === 'SURPLUS') && <span title="Aman"><CheckCircle2 className="w-5 h-5 text-pupr-blue mt-1" /></span>}
 {res.status === 'DEFICIT' && <span title="Defisit!"><AlertCircle className="w-5 h-5 text-rose-500 mt-1" /></span>}
 {res.status === 'SPILL' && <span title="Melimpas (Spill)"><Waves className="w-5 h-5 text-pupr-blue mt-1" /></span>}
 </div>
 ))}
 </div>
 ) : (
 <div className="h-16 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs rounded-sm">Status Operasi Bulanan</div>
 )}
 </CardContent>
 </Card>

 </div>
 </div>
 </div>
 );
};

