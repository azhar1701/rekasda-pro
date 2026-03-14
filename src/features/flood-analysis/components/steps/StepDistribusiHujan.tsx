import React, { useState, useEffect } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
// import { generateHyetograph } from '@/lib/engine/flood/mononobe';
import { HyetographChart } from '@/components/ui/HyetographChart';
import { IDFChart } from '@/components/ui/IDFChart';
import { Calculator, CloudRain } from 'lucide-react';
import { useAbmMutation } from '@/hooks/api/useHujanApi';

export const StepDistribusiHujan: React.FC = () => {
 const {
 hasilAnalisisFrekuensi,
 tutupanLahan,
 durasiHujan,
 distribusiHujanJamJaman,
 setDurasiHujan,
 setDistribusiHujanJamJaman,
 setHujanEfektif
 } = useHydrologyStore();

 const [calculated, setCalculated] = useState(false);

 useEffect(() => {
 if (distribusiHujanJamJaman && distribusiHujanJamJaman.length > 0) {
 setCalculated(true);
 } else {
 setCalculated(false);
 }
 }, [distribusiHujanJamJaman]);

 // Reset calculated state when R24 or durasi changes to force re-calculation
 useEffect(() => {
 setCalculated(false);
 setDistribusiHujanJamJaman(null);
 setHujanEfektif(null);
 }, [hasilAnalisisFrekuensi?.selectedKalaUlang, durasiHujan, setDistribusiHujanJamJaman, setHujanEfektif]);

 const R24 = hasilAnalisisFrekuensi?.curahHujanRencana.find(
 (v: any) => v.kalaUlang === hasilAnalisisFrekuensi.selectedKalaUlang
 )?.curahHujan || 0;

 const C = tutupanLahan?.koefisienPengaliranGabungan || 0.65;

 const [hyetographResult, setHyetographResult] = useState<any>(null);
 const abmMutation = useAbmMutation();
 const isCalculatingABM = abmMutation.isPending;

 useEffect(() => {
 if (R24 === 0) {
 setHyetographResult(null);
 return;
 }
 abmMutation
 .mutateAsync({ R24, n: durasiHujan })
 .then((data) => setHyetographResult(data))
 .catch(() => setHyetographResult(null));
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [R24, durasiHujan]);

 const abmTable = React.useMemo(() => {
 return hyetographResult?.rows || [];
 }, [hyetographResult]);

 const hujanEfektifArray = React.useMemo(() => {
 if (!hyetographResult) return [];
 return hyetographResult.rows.map((row: any) => row.abm * C);
 }, [hyetographResult, C]);

 const chartData = React.useMemo(() => {
 return abmTable.map((row: any, i: number) => ({
 jam: row.jam,
 losses: Number((row.abm - hujanEfektifArray[i]).toFixed(2)),
 efektif: Number(hujanEfektifArray[i].toFixed(2))
 }));
 }, [abmTable, hujanEfektifArray]);

 const handleCalculate = () => {
 const hietograf = abmTable.map((row: any) => row.abm);
 setDistribusiHujanJamJaman(hietograf);
 setHujanEfektif(hujanEfektifArray);
 setCalculated(true);
 };

 return (
 <div className="space-y-4">
 <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm p-4">
 <div className="flex items-center gap-2 mb-4">
 <CloudRain className="w-5 h-5 text-pupr-blue" />
 <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Distribusi Hujan Jam-jaman (IDF + ABM)</h3>
 </div>

 <div className="grid grid-cols-3 gap-4 mb-4">
 <div>
 <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">R24 (mm)</label>
 <input
 type="text"
 value={R24.toFixed(2)}
 disabled
 className="min-h-[44px] w-full px-3 py-2 bg-slate-100 border border-slate-300 dark:border-slate-600 rounded text-sm tabular-nums text-right"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Durasi (jam)</label>
 <input
 type="number"
 value={durasiHujan}
 onChange={(e) => setDurasiHujan(Number(e.target.value))}
 min="2"
 max="24"
 className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded text-sm tabular-nums text-right"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Koef. C</label>
 <input
 type="text"
 value={C.toFixed(3)}
 disabled
 className="min-h-[44px] w-full px-3 py-2 bg-slate-100 border border-slate-300 dark:border-slate-600 rounded text-sm tabular-nums text-right"
 />
 </div>
 </div>

 <button
 onClick={handleCalculate}
 disabled={isCalculatingABM}
 className="w-full px-4 py-2 bg-pupr-blue hover:bg-pupr-blue disabled:bg-slate-400 text-white text-sm font-semibold rounded flex items-center justify-center gap-2 transition-colors"
 >
 <Calculator className="w-4 h-4" />
 {isCalculatingABM ? 'Menghitung ABM via API...' : 'Simpan & Lanjutkan Distribusi ABM'}
 </button>
 </div>

 {calculated && abmTable.length > 0 && (
 <>
 <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm p-4">
 <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3">Kurva IDF (Intensity-Duration-Frequency)</h4>
 <IDFChart
 curahHujanRencana={hasilAnalisisFrekuensi?.curahHujanRencana || []}
 selectedKalaUlang={hasilAnalisisFrekuensi?.selectedKalaUlang ?? undefined}
 maxDuration={Math.max(durasiHujan, 12)}
 />
 </div>

 <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm p-4">
 <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3">Tabel Perhitungan ABM</h4>
 <div className="overflow-x-auto">
 <table className="w-full text-xs">
 <thead>
 <tr className="bg-pupr-blue text-white">
 <th className="px-2 py-2 text-center">t (jam)</th>
 <th className="px-2 py-2 text-right">I (mm/jam)</th>
 <th className="px-2 py-2 text-right">X (mm)</th>
 <th className="px-2 py-2 text-right">ΔX (mm)</th>
 <th className="px-2 py-2 text-right">ΔX (%)</th>
 <th className="px-2 py-2 text-right">Hietograf (mm)</th>
 </tr>
 </thead>
 <tbody>
 {abmTable.map((row: any, i: number) => (
 <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800'}>
 <td className="px-2 py-1.5 text-center tabular-nums tracking-tight">{row.jam}</td>
 <td className="px-2 py-1.5 text-right tabular-nums tracking-tight">{row.intensitas.toFixed(2)}</td>
 <td className="px-2 py-1.5 text-right tabular-nums tracking-tight">{row.kumulatif.toFixed(2)}</td>
 <td className="px-2 py-1.5 text-right tabular-nums tracking-tight">{row.inkremental.toFixed(2)}</td>
 <td className="px-2 py-1.5 text-right tabular-nums tracking-tight">{((row.inkremental / (hyetographResult?.totalHujan || 1)) * 100).toFixed(2)}</td>
 <td className="px-2 py-1.5 text-right tabular-nums font-semibold tracking-tight">{row.abm.toFixed(2)}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm p-4">
 <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3">Hyetograph & Hujan Efektif</h4>
 <HyetographChart data={chartData} />
 </div>
 </>
 )}

 {calculated && abmTable.length > 0 && (
 <div className="bg-green-50 border border-green-200 rounded-sm p-4">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm font-semibold text-green-900">✓ Distribusi Hujan Selesai</p>
 <p className="text-xs text-green-700 mt-1">
 Total Hujan Efektif: {hujanEfektifArray.reduce((a: number, b: number) => a + b, 0).toFixed(2)} mm
 </p>
 </div>
 <button
 onClick={() => window.dispatchEvent(new CustomEvent('completeStep', { detail: 1 }))}
 className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-sm"
 >
 Lanjut ke HSS →
 </button>
 </div>
 </div>
 )}
 </div>
 );
};
