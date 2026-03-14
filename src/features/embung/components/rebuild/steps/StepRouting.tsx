import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { useEmbungStore } from '../../../hooks/useEmbungStore';
import { calculateFloodRouting } from '@/lib/engine/embungEngine';
import { Activity, ArrowDownRight, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { toast } from '@/hooks/useToast';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area } from 'recharts';

const DEFAULT_HYDROGRAPH = [
 { time: 0, discharge: 0 },
 { time: 1, discharge: 15 },
 { time: 2, discharge: 45 },
 { time: 3, discharge: 120 },
 { time: 4, discharge: 85 },
 { time: 5, discharge: 50 },
 { time: 6, discharge: 25 },
 { time: 7, discharge: 10 },
 { time: 8, discharge: 0 },
];

export const StepRouting: React.FC = () => {
 const { state, dispatch } = useEmbungStore();
 const { hasilBanjir } = useHydrologyStore();

 const [hydrograph, setHydrograph] = useState(
 state.routingInput?.inflowHydrograph ??
 (hasilBanjir?.hidrograf?.length ?
 hasilBanjir.hidrograf.map(h => ({ time: h.time, discharge: h.inflow })) :
 DEFAULT_HYDROGRAPH)
 );

 const isAutoFilled = Boolean(hasilBanjir?.hidrograf?.length);

 const handleInflowChange = (index: number, val: string) => {
 const newHydro = [...hydrograph];
 newHydro[index].discharge = parseFloat(val) || 0;
 setHydrograph(newHydro);
 };

 const handleCalculate = () => {
 if (!state.stageStorageCurve) {
 toast.error("Lengkapi data Geometri (Langkah 1) terlebih dahulu!");
 return;
 }

 try {
 const spillwayCrest = state.stageStorageCurve.elevation[0];
 const stageDischargeCurve = {
 elevation: state.stageStorageCurve.elevation,
 discharge: state.stageStorageCurve.elevation.map((e) => {
 const h = e - spillwayCrest;
 return h > 0 ? 2.0 * Math.pow(h, 1.5) * 10 : 0; // Simplified weir formula Q = C*L*H^1.5
 })
 };

 const result = calculateFloodRouting({
 inflowHydrograph: hydrograph,
 stageStorageCurve: state.stageStorageCurve,
 stageDischargeCurve: stageDischargeCurve,
 deltaT: 3600,
 initialElevation: spillwayCrest
 });

 dispatch({ type: 'SET_ROUTING_RESULT', payload: result });
 dispatch({ type: 'SET_ROUTING_INPUT', payload: { inflowHydrograph: hydrograph } });
 toast.success('Simulasi Routing Berhasil.');
 } catch (error: any) {
 toast.error(`Kalkulasi Gagal: ${error.message}`);
 }
 };

 const chartData = state.routingResult?.steps.map(s => ({
 time: s.time,
 inflow: s.inflowAvg,
 outflow: s.outflow,
 elevation: s.elevation
 })) ?? null;

 return (
 <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-75">
 <div className="flex items-start gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-sm border border-slate-200 dark:border-slate-700">
 <Info className="w-5 h-5 text-slate-500 mt-1 shrink-0" />
 <div>
 <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Penelusuran Banjir (Safety Check)</h3>
 <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
 Verifikasi keamanan embung terhadap debit banjir rencana. Grafik di bawah memperlihatkan bagaimana waduk meredam (attenuation) puncak banjir.
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* Input Inflow */}
 <Card className="lg:col-span-4 border-slate-200 dark:border-slate-700 flex flex-col h-full">
 <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50 dark:bg-slate-800 flex flex-row items-center justify-between">
 <div className="flex items-center gap-2">
 <Activity className="w-4 h-4 text-slate-500" />
 <CardTitle className="text-sm">Inflow Hydrograph</CardTitle>
 </div>
 <Button size="sm" onClick={handleCalculate} className="bg-pupr-blue hover:bg-teal-700 text-white h-8 text-xs">
 Simulasi
 </Button>
 </CardHeader>
 <CardContent className="p-0 overflow-auto flex-1">
 {isAutoFilled && (
 <div className="p-3 bg-teal-50 border-b border-teal-100 text-[10px] text-teal-800 font-medium">
 <CheckCircle className="w-3 h-3 inline mr-1" /> Data Tersinkronisasi dari Modul Banjir
 </div>
 )}
 <table className="w-full text-xs text-left">
 <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold sticky top-0 z-10">
 <tr>
 <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">Jam</th>
 <th className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 text-right">Debit (m³/s)</th>
 </tr>
 </thead>
 <tbody>
 {hydrograph.map((row, idx) => (
 <tr key={idx} className="hover:bg-slate-50 dark:bg-slate-800 border-b border-slate-50 last:border-0 transition-colors">
 <td className="px-4 py-1.5 font-medium text-slate-500">t = {row.time}</td>
 <td className="px-2 py-1.5">
 <Input
 type="number"
 value={row.discharge}
 className="h-7 text-xs text-right border-transparent hover:border-slate-200 dark:border-slate-700 bg-transparent focus:bg-white dark:bg-slate-900"
 onChange={(e) => handleInflowChange(idx, e.target.value)}
 readOnly={isAutoFilled}
 />
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </CardContent>
 </Card>

 {/* Metrics & Graph */}
 <div className="lg:col-span-8 flex flex-col gap-4">
 <div className="grid grid-cols-3 gap-4">
 <Card className="p-4 border-slate-200 dark:border-slate-700">
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Peak Inflow</p>
 <div className="flex items-baseline gap-1">
 <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300">{state.routingResult?.peakInflow.toFixed(2) ?? '-'}</h3>
 <span className="text-xs text-slate-500">m³/s</span>
 </div>
 </Card>
 <Card className="p-4 border-pupr-blue/30 bg-pupr-surface/20">
 <p className="text-[10px] font-bold text-pupr-blue uppercase tracking-wider mb-1">Peak Outflow</p>
 <div className="flex items-baseline gap-1">
 <h3 className="text-2xl font-bold text-pupr-blue">{state.routingResult?.peakOutflow.toFixed(2) ?? '-'}</h3>
 <span className="text-xs text-slate-500">m³/s</span>
 </div>
 </Card>
 <Card className="p-4 border-indigo-200 bg-indigo-50/30">
 <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Reduksi Puncak</p>
 <div className="flex items-baseline gap-1 text-indigo-700">
 <h3 className="text-2xl font-bold">{(state.routingResult?.attenuationRatio ?? 0 * 100).toFixed(1)}%</h3>
 <ArrowDownRight className="w-4 h-4" />
 </div>
 </Card>
 </div>

 <Card className="flex-1 border-slate-200 dark:border-slate-700 min-h-[350px] relative overflow-hidden">
 <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between z-10 relative bg-white dark:bg-slate-900 ">
 <CardTitle className="text-sm">Inflow vs Outflow Hydrograph</CardTitle>
 </CardHeader>
 <CardContent className="p-6 h-full flex flex-col">
 {!chartData ? (
 <div className="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-50">
 <Activity className="w-16 h-16" />
 <p className="text-xs font-bold mt-2">SIMULASI UNTUK VISUALISASI</p>
 </div>
 ) : (
 <ResponsiveContainer width="100%" height="100%">
 <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
 <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
 <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
 <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
 <Area
 type="monotone"
 dataKey="inflow"
 name="Inflow (Masuk)"
 fill="#94a3b8"
 stroke="#64748b"
 fillOpacity={0.1}
 strokeDasharray="5 5"
 />
 <Area
 type="monotone"
 dataKey="outflow"
 name="Outflow (Keluar)"
 fill="#0ea5e9"
 stroke="#0ea5e9"
 fillOpacity={0.2}
 strokeWidth={3}
 />
 </ComposedChart>
 </ResponsiveContainer>
 )}
 </CardContent>
 {state.routingResult && state.routingResult.peakOutflow > state.routingResult.peakInflow && (
 <div className="absolute top-16 right-6 z-20">
 <AlertCircle className="w-12 h-12 text-rose-500 opacity-50" />
 </div>
 )}
 </Card>
 </div>
 </div>
 </div>
 );
};
