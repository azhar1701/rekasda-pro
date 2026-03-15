import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { useEmbungStore } from '../../../hooks/useEmbungStore';
import { calculateSequentPeak } from '@/lib/engine/embungEngine';
import { Calculator, Info, Spline, Waves, Sparkles, Table as TableIcon } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, Line } from 'recharts';

export const StepCapacity: React.FC = () => {
 const { state, dispatch } = useEmbungStore();
 const [data, setData] = useState(state.capacityData);

 const handleInputChange = (id: string, field: 'inflow' | 'outflow', value: string) => {
 const numValue = parseFloat(value) || 0;
 const newData = data.map(row => row.id === id ? { ...row, [field]: numValue } : row);
 setData(newData);
 dispatch({ type: 'SET_CAPACITY_DATA', payload: newData });
 };

 const handleCalculate = () => {
 try {
 const result = calculateSequentPeak({
 inflow: data.map(r => r.inflow),
 outflow: data.map(r => r.outflow)
 });
 dispatch({ type: 'SET_CAPACITY_RESULT', payload: result });
 toast.success(`Kalkulasi Selesai. Tampungan Efektif: ${result.maxStorageRequired.toFixed(2)} Juta m³`);
 } catch (error: any) {
 toast.error(`Gagal menghitung: ${error.message}`);
 }
 };

 const chartData = state.capacityResult?.massCurveData ?? null;

 return (
 <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-75">
 {/* Header Description */}
 <div className="flex items-start gap-3 bg-pupr-surface p-4 rounded-sm border border-pupr-border">
 <Info className="w-5 h-5 text-pupr-blue mt-1 shrink-0" />
 <div>
 <h3 className="text-sm font-bold text-blue-900">Analisis Kapasitas (Metode Rippl)</h3>
 <p className="text-xs text-blue-800/80 mt-1 leading-relaxed">
 Metode ini menentukan volume tampungan efektif berdasarkan selisih kumulatif terbesar antara inflow dan outflow (demand).
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* Left: Table Input */}
 <Card className="lg:col-span-5 border-slate-200 dark:border-slate-700">
 <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50 dark:bg-slate-800 flex flex-row items-center justify-between">
 <div className="flex items-center gap-2">
 <TableIcon className="w-4 h-4 text-slate-500" />
 <CardTitle className="text-sm">Inflow & Demand Bulanan</CardTitle>
 </div>
 <Button size="sm" onClick={handleCalculate} className="bg-pupr-blue hover:bg-teal-700 text-white h-8 text-xs">
 <Calculator className="w-3 h-3 mr-2" /> Kalkulasi
 </Button>
 </CardHeader>
 <CardContent className="p-0 overflow-auto max-h-[500px]">
 <table className="w-full text-xs text-left">
 <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold sticky top-0 z-10">
 <tr>
 <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Bulan</th>
 <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-right">Inflow (Juta m³)</th>
 <th className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-right">Demand (Juta m³)</th>
 </tr>
 </thead>
 <tbody>
 {data.map((row) => (
 <tr key={row.id} className="hover:bg-slate-50 dark:bg-slate-800 border-b border-slate-100 last:border-0 transition-colors">
 <td className="px-4 py-2 font-medium text-slate-600 dark:text-slate-500">{row.month}</td>
 <td className="px-2 py-2">
 <Input
 type="number"
 value={row.inflow}
 className="h-8 text-xs text-right border-transparent hover:border-slate-200 dark:border-slate-700 bg-transparent focus:bg-white dark:bg-slate-900"
 onChange={(e) => handleInputChange(row.id, 'inflow', e.target.value)}
 />
 </td>
 <td className="px-2 py-2">
 <Input
 type="number"
 value={row.outflow}
 className="h-8 text-xs text-right border-transparent hover:border-slate-200 dark:border-slate-700 bg-transparent focus:bg-white dark:bg-slate-900"
 onChange={(e) => handleInputChange(row.id, 'outflow', e.target.value)}
 />
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </CardContent>
 </Card>

 {/* Right: Result & Graph */}
 <div className="lg:col-span-7 flex flex-col gap-6">
 {/* Big Metric */}
 <Card className="bg-gradient-to-br from-pupr-blue to-teal-600 text-white border-none shadow-none ">
 <CardContent className="p-6 relative overflow-hidden">
 <Waves className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 opacity-30" />
 <div className="relative z-10">
 <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-2">Volume Tampungan Efektif</p>
 <div className="flex items-baseline gap-2">
 <h1 className="text-5xl font-extrabold tracking-tight">
 {state.capacityResult?.maxStorageRequired.toLocaleString('id-ID', { maximumFractionDigits: 2 }) ?? '0.00'}
 </h1>
 <span className="text-xl font-medium text-blue-100">Juta m³</span>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Chart */}
 <Card className="flex-1 border-slate-200 dark:border-slate-700 overflow-hidden min-h-[300px]">
 <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50 dark:bg-slate-800 flex flex-row items-center justify-between">
 <div className="flex items-center gap-2">
 <Spline className="w-4 h-4 text-slate-500" />
 <CardTitle className="text-sm">Grafik Kumulatif (Mass Curve)</CardTitle>
 </div>
 {state.capacityResult && (
 <Button size="sm" variant="secondary" className="h-7 text-[10px] bg-indigo-50 text-indigo-700 border-indigo-100">
 <Sparkles className="w-3 h-3 mr-1" /> Analisis AI
 </Button>
 )}
 </CardHeader>
 <CardContent className="p-6 flex-1">
 {!chartData ? (
 <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 opacity-50">
 <Spline className="w-12 h-12" />
 <p className="text-xs font-medium uppercase tracking-wider">Klik Kalkulasi untuk analisa</p>
 </div>
 ) : (
 <ResponsiveContainer width="100%" height="100%">
 <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
 <XAxis
 dataKey="month"
 axisLine={false}
 tickLine={false}
 tick={{ fontSize: 10, fill: '#64748b' }}
 dy={10}
 />
 <YAxis
 axisLine={false}
 tickLine={false}
 tick={{ fontSize: 10, fill: '#64748b' }}
 />
 <Tooltip
 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }}
 />
 <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px' }} iconType="circle" />
 <Area
 type="monotone"
 dataKey="cumulativeInflow"
 name="Kumulatif Inflow"
 fill="#0EA5E9"
 stroke="#0284C7"
 fillOpacity={0.1}
 strokeWidth={2}
 />
 <Line
 type="monotone"
 dataKey="cumulativeOutflow"
 name="Kumulatif Demand"
 stroke="#DC2626"
 strokeWidth={2}
 dot={false}
 />
 </ComposedChart>
 </ResponsiveContainer>
 )}
 </CardContent>
 </Card>
 </div>
 </div>
 </div>
 );
};
