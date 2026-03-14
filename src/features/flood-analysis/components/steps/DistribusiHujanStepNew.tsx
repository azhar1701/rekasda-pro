import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { CloudRain, Droplets, Calculator, Info } from 'lucide-react';
import { useFrequencyAnalysis } from '@/hooks/useFrequencyAnalysis';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generateABMTable, calculateEffectiveRainfall } from '@/lib/utils/hydrologyMath';

interface DistribusiHujanStepProps {
 onComplete: (hujanEfektif: number[], durasi: number) => void;
 isCompleted: boolean;
}

export const DistribusiHujanStep: React.FC<DistribusiHujanStepProps> = ({ onComplete, isCompleted }) => {
 const { getR24 } = useFrequencyAnalysis();
 const { tutupanLahan, setEffectiveRainfall } = useHydrologyStore();

 const [returnPeriod, setReturnPeriod] = useState(25);
 const [durasi, setDurasi] = useState(6);
 const [lossMethod, setLossMethod] = useState<'C' | 'CN'>('C');
 const [calculated, setCalculated] = useState(false);

 const R24 = getR24(returnPeriod) || 0;
 const C = tutupanLahan?.koefisienPengaliranGabungan || 0.65;
 const CN = tutupanLahan?.curveNumberGabungan || 75;

 // Generate ABM Table
 const abmTable = useMemo(() => {
 if (!calculated || R24 <= 0) return [];
 return generateABMTable(R24, durasi, 1);
 }, [calculated, R24, durasi]);

 // Calculate Effective Rainfall
 const { hyetograph, effectiveRainfall, losses } = useMemo(() => {
 if (abmTable.length === 0) return { hyetograph: [], effectiveRainfall: [], losses: [] };

 const hyet = abmTable.map(row => row.hyetograph);
 let effective: number[] = [];

 if (lossMethod === 'C') {
 effective = calculateEffectiveRainfall(hyet, C);
 } else {
 // CN Method (SCS)
 const S = (25400 / CN) - 254;
 effective = hyet.map(rain => {
 const Pe = rain > 0.2 * S ? Math.pow(rain - 0.2 * S, 2) / (rain + 0.8 * S) : 0;
 return Pe;
 });
 }

 const loss = hyet.map((total, i) => total - effective[i]);

 return { hyetograph: hyet, effectiveRainfall: effective, losses: loss };
 }, [abmTable, lossMethod, C, CN]);

 // Chart Data
 const chartData = useMemo(() => {
 return hyetograph.map((total, i) => ({
 jam: i + 1,
 total: Number(total.toFixed(2)),
 efektif: Number(effectiveRainfall[i]?.toFixed(2) || 0),
 losses: Number(losses[i]?.toFixed(2) || 0)
 }));
 }, [hyetograph, effectiveRainfall, losses]);

 const handleCalculate = () => {
 setCalculated(true);
 };

 const handleComplete = () => {
 setEffectiveRainfall({
 totalRainfall: hyetograph.reduce((a, b) => a + b, 0),
 effectiveRainfall: effectiveRainfall.reduce((a, b) => a + b, 0),
 losses: losses.reduce((a, b) => a + b, 0),
 method: lossMethod === 'C' ? `Koef. C = ${C.toFixed(3)}` : `CN = ${CN}`,
 hourlyDistribution: effectiveRainfall
 });

 
 onComplete(effectiveRainfall, durasi);
 };

 return (
 <div className="space-y-6">
 {/* TAHAP 2: Contextual Header - Data Upstream dari Analisis Frekuensi */}
 {R24 > 0 && (
 <div className="bg-pupr-surface border border-pupr-border rounded-sm p-3">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-2 h-2 rounded-sm bg-pupr-blue" />
 <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Hujan Rencana dari Analisis Frekuensi (Read-Only)</p>
 </div>
 <div className="text-xs">
 <span className="text-slate-600 dark:text-slate-400">R24 (Q{returnPeriod}):</span>
 <span className="ml-2 font-bold text-blue-900 tabular-nums tracking-tight">{R24.toFixed(2)} mm</span>
 </div>
 </div>
 )}

 <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm">
 <div className="flex items-center gap-3 mb-4">
 <div className="p-2 bg-pupr-surface rounded-sm">
 <CloudRain className="w-5 h-5 text-pupr-blue" />
 </div>
 <div>
 <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Distribusi Hujan Jam-jaman</h3>
 <p className="text-xs text-slate-600 dark:text-slate-400">Mononobe + Alternating Block Method</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
 <div>
 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kala Ulang (Tr)</label>
 <select
 value={returnPeriod}
 onChange={(e) => setReturnPeriod(Number(e.target.value))}
 className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm focus:ring-1 focus:ring-pupr-blue focus:border-pupr-blue focus:outline-none"
 >
 {[2, 5, 10, 25, 50, 100].map(tr => (
 <option key={tr} value={tr}>Q{tr} - {getR24(tr)?.toFixed(2) || 0} mm</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Durasi Hujan (jam)</label>
 <input
 type="number"
 value={durasi}
 onChange={(e) => setDurasi(Number(e.target.value))}
 className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm tabular-nums tracking-tight focus:ring-1 focus:ring-pupr-blue focus:border-pupr-blue focus:outline-none"
 min="2"
 max="24"
 />
 </div>
 <div>
 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Metode Losses</label>
 <select
 value={lossMethod}
 onChange={(e) => setLossMethod(e.target.value as 'C' | 'CN')}
 className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm focus:ring-1 focus:ring-pupr-blue focus:border-pupr-blue focus:outline-none"
 >
 <option value="C">Koef. C = {C.toFixed(3)}</option>
 <option value="CN">Curve Number = {CN.toFixed(0)}</option>
 </select>
 </div>
 </div>

 <button
 onClick={handleCalculate}
 className="w-full px-4 py-3 bg-pupr-blue hover:bg-pupr-blue text-white font-semibold rounded-sm transition-colors flex items-center justify-center gap-2"
 >
 <Calculator className="w-5 h-5" />
 Hitung Distribusi & Losses
 </button>
 </Card>

 {calculated && abmTable.length > 0 && (
 <>
 {/* Tabel ABM High-Density */}
 <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm">
 <div className="flex items-center justify-between mb-4">
 <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Tabel Alternating Block Method</h4>
 <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
 <Info className="w-3 h-3" />
 <span>Mononobe IDF → ABM Distribution</span>
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-xs">
 <thead>
 <tr className="bg-pupr-blue text-white">
 <th className="px-3 py-2 text-center font-semibold text-sm">t (jam)</th>
 <th className="px-3 py-2 text-right font-semibold text-sm">I (mm/jam)</th>
 <th className="px-3 py-2 text-right font-semibold text-sm">X (mm)</th>
 <th className="px-3 py-2 text-right font-semibold text-sm">ΔX (mm)</th>
 <th className="px-3 py-2 text-right font-semibold text-sm">ΔX (%)</th>
 <th className="px-3 py-2 text-right font-semibold text-sm">Hietograf (mm)</th>
 </tr>
 </thead>
 <tbody>
 {abmTable.map((row, idx) => (
 <tr key={idx} className="border-b border-slate-100 even:bg-slate-50 dark:bg-slate-800">
 <td className="px-3 py-2 text-center font-bold tabular-nums tracking-tight tabular-nums tracking-tight">{row.t}</td>
 <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{row.I.toFixed(2)}</td>
 <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{row.X.toFixed(2)}</td>
 <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{row.deltaX.toFixed(2)}</td>
 <td className="px-3 py-2 text-right font-mono tabular-nums tracking-tight tabular-nums tracking-tight">{row.deltaXPercent.toFixed(1)}</td>
 <td className="px-3 py-2 text-right font-bold text-pupr-blue tabular-nums tracking-tight tabular-nums tracking-tight">{row.hyetograph.toFixed(2)}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </Card>

 {/* Grafik Hyetograph & Hujan Efektif */}
 <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm">
 <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Hyetograph & Hujan Efektif</h4>
 <ResponsiveContainer width="100%" height={300}>
 <BarChart data={chartData}>
 <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
 <XAxis
 dataKey="jam"
 label={{ value: 'Jam ke-', position: 'insideBottom', offset: -5, style: { fontSize: 12, fontWeight: 600 } }}
 tick={{ fontSize: 11 }}
 />
 <YAxis
 label={{ value: 'Intensitas (mm)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fontWeight: 600 } }}
 tick={{ fontSize: 11 }}
 tickFormatter={(value) => value.toFixed(1)}
 />
 <Tooltip itemStyle={{ fontVariantNumeric: "tabular-nums" }}
 contentStyle={{ fontSize: 12, fontFamily: 'monospace' }}
 formatter={(value: any) => value?.toFixed(2)}
 />
 <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
 <Bar dataKey="losses" stackId="a" fill="#94a3b8" name="Losses" />
 <Bar dataKey="efektif" stackId="a" fill="#0c3a66" name="Hujan Efektif" />
 </BarChart>
 </ResponsiveContainer>
 </Card>

 {/* Summary & Complete Button */}
 <Card className="p-6 bg-green-50 border border-green-200 rounded-sm">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <Droplets className="w-6 h-6 text-green-600" />
 <div>
 <p className="text-sm font-semibold text-green-900">Total Hujan Efektif</p>
 <p className="text-xs text-green-700 tabular-nums tracking-tight">
 {effectiveRainfall.reduce((a, b) => a + b, 0).toFixed(2)} mm dari {durasi} jam
 </p>
 </div>
 </div>
 <button
 onClick={handleComplete}
 disabled={isCompleted}
 className={`px-6 py-3 rounded-sm font-semibold transition-colors ${isCompleted
 ? 'bg-green-600 text-white cursor-default'
 : 'bg-green-600 hover:bg-green-700 text-white'
 }`}
 >
 {isCompleted ? '✓ Selesai' : 'Lanjut ke HSS →'}
 </button>
 </div>
 </Card>
 </>
 )}
 </div>
 );
};
