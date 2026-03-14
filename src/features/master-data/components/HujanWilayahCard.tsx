import React, { useState, useEffect, useMemo } from 'react';
import {
 CloudRain,
 Save,
 CheckCircle,
 AlertCircle
} from 'lucide-react';
import { AssistantContainer } from '@/components/ui/govtech';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useHydrologyStore, type CurahHujanWilayah, type ThiessenStasiunConfig, type IsohyetConfig, type DataHujan } from '@/stores/useHydrologyStore';
import { calculateAlgebraicMean, calculateThiessenPolygon, calculateIsohyet } from '@/lib/utils/hydrology/arealRainfall';
import { determineRainfallMethod, MethodParams, RecommendationResult } from '@/utils/rainfallMethodSelector';
import { toast } from '@/hooks/useToast';
import { HelpTooltip } from '@/components/ui/govtech';
import { useOnboarding } from '@/providers/OnboardingProvider';
import { SuccessCelebration } from '@/components/ui/feedback/SuccessCelebration';

export const HujanWilayahCard: React.FC = () => {
 const {
 curahHujanWilayah, setCurahHujanWilayah, stasiunList, morfometriDAS,
 fetchMultipleStationsData, setArealRainfallData, setActiveRainfallSource,
 lastResetAt
 } = useHydrologyStore();

 const [metode, setMetode] = useState<'aljabar' | 'thiessen' | 'isohyet'>(curahHujanWilayah?.metode || 'aljabar');
 const [configs, setConfigs] = useState<ThiessenStasiunConfig[]>(
 curahHujanWilayah?.stasiunConfigs || []
 );
 const [isohyetalConfigs, setIsohyetalConfigs] = useState<IsohyetConfig[]>(
 curahHujanWilayah?.isohyetConfigs || []
 );
 const [isSaved, setIsSaved] = useState(false);
 const isResetting = React.useRef(false);

 const [params, setParams] = useState<MethodParams>({
 hasCoordinates: true,
 topography: 'flat',
 distribution: 'uniform',
 stationCount: stasiunList.length,
 });

 const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
 const [showCelebration, setShowCelebration] = useState(false);
 const { completeStep } = useOnboarding();

 // Sync with store, with reset protection
 useEffect(() => {
 if (isResetting.current) return;

 if (curahHujanWilayah) {
 setMetode(curahHujanWilayah.metode);
 setConfigs(curahHujanWilayah.stasiunConfigs || []);
 setIsohyetalConfigs(curahHujanWilayah.isohyetConfigs || []);
 
 // Strict Engineering Check: Only mark as saved if there is actual calculated output
 const hasData = (curahHujanWilayah.hujanRataRata || 0) > 0 && 
 (curahHujanWilayah.stasiunConfigs?.length || 0) > 0;
 
 setIsSaved(hasData);
 }
 }, [curahHujanWilayah]);

 // Listen for Global Reset - Full UI Wipe
 useEffect(() => {
 if (lastResetAt > 0) {
 isResetting.current = true;
 setIsSaved(false);
 setMetode('aljabar');
 setConfigs([]);
 setIsohyetalConfigs([]);
 setParams(prev => ({
 ...prev,
 topography: 'flat',
 distribution: 'uniform',
 stationCount: 0
 }));
 
 // Release the reset lock after state has settled
 setTimeout(() => {
 isResetting.current = false;
 }, 100);
 }
 }, [lastResetAt]);

 useEffect(() => {
 if (stasiunList.length > 0) {
 setParams(prev => ({ ...prev, stationCount: stasiunList.length }));
 setConfigs(prevConfigs => {
 // Sinkronisasi configs dengan stasiunList terbaru
 const newConfigs = stasiunList.map(s => {
 const existing = prevConfigs.find(c => c.stasiunId === s.id);
 if (existing) {
 return { ...existing, namaStasiun: s.nama_stasiun };
 }
 return {
 stasiunId: s.id,
 namaStasiun: s.nama_stasiun,
 luasPengaruh: 0,
 bobot: 0,
 };
 });
 return newConfigs;
 });
 } else {
 setParams(prev => ({ ...prev, stationCount: 0 }));
 setConfigs([]);
 }
 }, [stasiunList]);

 useEffect(() => {
 setRecommendation(determineRainfallMethod(params));
 }, [params]);

 const { totalLuasPengaruh, bobotError } = useMemo(() => {
 const total = configs.reduce((sum, c) => sum + (typeof c.luasPengaruh === 'string' ? parseFloat(c.luasPengaruh) || 0 : c.luasPengaruh), 0);
 const dasLuas = morfometriDAS?.luasDAS || 0;
 const error = dasLuas > 0 ? Math.abs(total - dasLuas) : 0;

 return {
 totalLuasPengaruh: total,
 bobotError: error,
 };
 }, [configs, morfometriDAS]);

 const configsWithBobot = useMemo(() => {
 return configs.map(c => {
 const safeluas = typeof c.luasPengaruh === 'string' ? parseFloat(c.luasPengaruh) || 0 : c.luasPengaruh;
 return {
 ...c,
 bobot: totalLuasPengaruh > 0 ? (safeluas / totalLuasPengaruh) * 100 : 0,
 }
 });
 }, [configs, totalLuasPengaruh]);

 const hasError = metode === 'thiessen' && bobotError > 0.01 && morfometriDAS !== null;

 const handleLuasChange = (stasiunId: string, value: string) => {
 setConfigs(configs.map(c =>
 c.stasiunId === stasiunId ? { ...c, luasPengaruh: value as unknown as number } : c
 ));
 setIsSaved(false);
 };

 const handleSave = async () => {
 const safeConfigs = configsWithBobot.map(c => ({
 ...c,
 luasPengaruh: typeof c.luasPengaruh === 'string' ? parseFloat(c.luasPengaruh) || 0 : c.luasPengaruh
 }));

 const safeIsohyet = isohyetalConfigs.map(c => ({
 ...c,
 luasAntarGaris: typeof c.luasAntarGaris === 'string' ? parseFloat(c.luasAntarGaris) || 0 : c.luasAntarGaris,
 curahHujanRataRata: typeof c.curahHujanRataRata === 'string' ? parseFloat(c.curahHujanRataRata) || 0 : c.curahHujanRataRata
 }));

 try {
 let avgValue = 0;
 let amsArray: number[] = [];

 // HELPER: Ekstrak data curah hujan tahunan maksimum dari stasiun
 const extractStationAms = (stationData: any[]) => {
 const byYear = new Map<number, number>();
 stationData.forEach(d => {
 const year = new Date(d.tanggal).getFullYear();
 const current = byYear.get(year) || 0;
 if (d.curah_hujan > current) byYear.set(year, d.curah_hujan);
 });
 return Array.from(byYear.entries()).map(([year, hujan]) => ({ year, hujan }));
 };

 if (metode === 'thiessen' && safeConfigs.length > 0) {
 const stasiunIds = safeConfigs.map(c => c.stasiunId);
 await fetchMultipleStationsData(stasiunIds);
 const currentData = useHydrologyStore.getState().dataHujan;

 // Buat struktur array tahunan konsolidasi untuk Thiessen AMS
 const yearsAvailable = new Set<number>();
 const stationAmsMap = new Map<string, { year: number, hujan: number }[]>();

 stasiunIds.forEach(id => {
 const sData = currentData.filter(d => d.stasiun_id === id);
 const sAms = extractStationAms(sData);
 sAms.forEach(val => yearsAvailable.add(val.year));
 stationAmsMap.set(id, sAms);
 });

 const arealResults: DataHujan[] = [];

 // Loop per tahun, jalankan kalkulasi murni P = Σ(Ai*Xi)/ΣAi
 Array.from(yearsAvailable).sort().forEach(year => {
 const stationsInput = safeConfigs.map(cfg => {
 const sAms = stationAmsMap.get(cfg.stasiunId);
 const yearData = sAms?.find(a => a.year === year);
 return {
 rainfall: yearData ? yearData.hujan : 0,
 area: cfg.luasPengaruh
 };
 });

 const thiessenP = calculateThiessenPolygon(stationsInput);
 amsArray.push(thiessenP);
 arealResults.push({
 id: `thiessen-${year}`,
 stasiun_id: 'thiessen',
 tanggal: `${year}-12-31`,
 curah_hujan: Number(thiessenP.toFixed(2))
 });
 });

 avgValue = amsArray.length > 0 ? amsArray.reduce((a, b) => a + b, 0) / amsArray.length : 0;
 setArealRainfallData('thiessen', arealResults);
 setActiveRainfallSource('thiessen');
 toast.success(`Hujan Kawasan Thiessen (${amsArray.length} tahun) berhasil dihitung.`);

 } else if (metode === 'isohyet' && safeIsohyet.length > 0) {
 // Asumsi data yang dipassing oleh user Isohyet di UI sudah berupa CurahHujanRataRata per zona.
 // Berbeda dengan thiessen, ini biasanya dimasukkan manual (dari kontur Arcgis statik)

 // Jalankan kalkulasi murni P = Σ(Ai * Rata2_i) / ΣAi
 const isohyetInput = safeIsohyet.map(s => ({
 averageRainfall: s.curahHujanRataRata,
 area: s.luasAntarGaris
 }));

 avgValue = calculateIsohyet(isohyetInput);

 // Map existing annualMax if available to DataHujan format
 const arealResults: DataHujan[] = [];
 const amsBase = safeIsohyet[0]?.annualMax || [];

 // Kombinasi: ambil tahun dari data store jika tersedia, fallback ke sekuensial
 const storeData = useHydrologyStore.getState().dataHujan;
 const storeYears = Array.from(new Set(storeData.map(d => new Date(d.tanggal).getFullYear()))).sort((a, b) => a - b);

 amsBase.forEach((val, idx) => {
 const year = storeYears[idx] ?? (storeYears.length > 0 ? storeYears[storeYears.length - 1] + idx + 1 : new Date().getFullYear() - amsBase.length + idx + 1);
 arealResults.push({
 id: `isohyet-${year}`,
 stasiun_id: 'isohyet',
 tanggal: `${year}-12-31`,
 curah_hujan: val
 });
 });

 amsArray = amsBase.length > 0 ? amsBase : [avgValue];

 setArealRainfallData('isohyet', arealResults.length > 0 ? arealResults : null);
 setActiveRainfallSource('isohyet');
 toast.success(`Hujan Kawasan Isohyet berhasil dihitung (Rata-rata: ${avgValue.toFixed(2)} mm).`);

 } else if (metode === 'aljabar') {
 const stasiunIds = stasiunList.map(s => s.id);
 if (stasiunIds.length > 0) {
 await fetchMultipleStationsData(stasiunIds);
 const currentData = useHydrologyStore.getState().dataHujan;

 const yearsAvailable = new Set<number>();
 const stationAmsMap = new Map<string, { year: number, hujan: number }[]>();

 stasiunIds.forEach(id => {
 const sData = currentData.filter(d => d.stasiun_id === id);
 const sAms = extractStationAms(sData);
 sAms.forEach(val => yearsAvailable.add(val.year));
 stationAmsMap.set(id, sAms);
 });

 const arealResults: DataHujan[] = [];

 // Loop per tahun, jalankan kalkulasi murni P = (X1+X2+...Xn)/n
 Array.from(yearsAvailable).sort().forEach(year => {
 const stationsRainfall = stasiunIds.map(id => {
 const sAms = stationAmsMap.get(id);
 const yearData = sAms?.find(a => a.year === year);
 return yearData ? yearData.hujan : 0;
 });

 // Abaikan stasiun bernilai 0 jika data memang hilang (atau biarkan 0 jika memang kering)
 const validRainfalls = stationsRainfall.filter(r => r > 0);
 if (validRainfalls.length > 0) {
 const aljabarP = calculateAlgebraicMean(validRainfalls);
 amsArray.push(aljabarP);
 arealResults.push({
 id: `aljabar-${year}`,
 stasiun_id: 'aljabar',
 tanggal: `${year}-12-31`,
 curah_hujan: Number(aljabarP.toFixed(2))
 });
 }
 });

 avgValue = amsArray.length > 0 ? amsArray.reduce((a, b) => a + b, 0) / amsArray.length : 0;
 setArealRainfallData('aljabar', arealResults);
 setActiveRainfallSource('aljabar');
 toast.success(`Hujan Kawasan Aljabar (${amsArray.length} tahun) berhasil dihitung.`);
 }
 }

 const data: CurahHujanWilayah = {
 metode,
 stasiunConfigs: safeConfigs,
 isohyetConfigs: safeIsohyet,
 hujanRataRata: avgValue,
 hujanRataRataAMS: amsArray
 };
 setCurahHujanWilayah(data);
 setConfigs(safeConfigs);
 setIsohyetalConfigs(safeIsohyet);
 setIsSaved(true);
 setShowCelebration(true);
 completeStep('hujan');
 } catch (err: any) {
 toast.error('Gagal menyimpan konfigurasi: ' + err.message);
 }
 };

 return (
 <div className="space-y-4">
 {showCelebration && (
 <SuccessCelebration
 message="Data Hujan Wilayah berhasil dihitung dan disinkronkan!"
 onComplete={() => setShowCelebration(false)}
 />
 )}
 <Card className="border border-slate-300 dark:border-slate-600 rounded-sm-sm overflow-hidden border-l-4 border-l-pupr-blue">
 <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-pupr-blue rounded-sm-sm">
 <CloudRain className="w-5 h-5 text-pupr-blue" />
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Curah Hujan Wilayah</h3>
 <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Metode rata-rata spasial</p>
 </div>
 </div>
 </div>

 <div className="p-4">
 <AssistantContainer title="Rekomendasi Metode Berbasis Lokasi (AI Assistant)">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Ketersediaan Koordinat</label>
 <div className="flex gap-4 mt-1">
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="radio"
 checked={params.hasCoordinates}
 onChange={() => setParams({ ...params, hasCoordinates: true })}
 className="w-3.5 h-3.5 text-pupr-blue"
 />
 <span className="text-sm text-slate-700 dark:text-slate-300">Tersedia</span>
 </label>
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="radio"
 checked={!params.hasCoordinates}
 onChange={() => setParams({ ...params, hasCoordinates: false })}
 className="w-3.5 h-3.5 text-pupr-blue"
 />
 <span className="text-sm text-slate-700 dark:text-slate-300">Tidak Ada</span>
 </label>
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Kondisi Topografi</label>
 <div className="flex gap-4 mt-1">
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="radio"
 checked={params.topography === 'flat'}
 onChange={() => setParams({ ...params, topography: 'flat' })}
 className="w-3.5 h-3.5 text-pupr-blue"
 />
 <span className="text-sm text-slate-700 dark:text-slate-300">Relatif Datar</span>
 </label>
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="radio"
 checked={params.topography === 'varied'}
 onChange={() => setParams({ ...params, topography: 'varied' })}
 className="w-3.5 h-3.5 text-pupr-blue"
 />
 <span className="text-sm text-slate-700 dark:text-slate-300">Pegunungan / Bervariasi</span>
 </label>
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Jumlah Stasiun</label>
 <div className="flex items-center gap-2">
 <input
 type="number"
 value={params.stationCount}
 onChange={(e) => setParams({ ...params, stationCount: parseInt(e.target.value) || 0 })}
 className="w-20 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-sm focus:ring-1 focus:ring-pupr-blue tabular-nums"
 />
 <span className="text-xs text-slate-500 italic">(Terdeteksi: {stasiunList.length})</span>
 </div>
 </div>
 </div>

 <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 p-3 rounded-sm-sm">
 <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Analisis Hasil</h4>
 <p className="text-sm font-bold text-pupr-blue">{recommendation?.method}</p>
 <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{recommendation?.reason}</p>

 <button
 onClick={() => {
 if (recommendation) {
 let methodValue: 'aljabar' | 'thiessen' | 'isohyet' = 'aljabar';
 if (recommendation.method === 'Metode Poligon Thiessen') methodValue = 'thiessen';
 if (recommendation.method === 'Metode Isohyet') methodValue = 'isohyet';
 setMetode(methodValue);
 toast.success(`Metode ${methodValue} diterapkan`);
 }
 }}
 className="mt-3 px-3 py-1.5 bg-pupr-blue text-white text-xs font-bold rounded-sm hover:bg-[#092b4d] transition-all flex items-center gap-2"
 >
 <CheckCircle className="w-3.5 h-3.5" />
 Gunakan Rekomendasi
 </button>
 </div>
 </AssistantContainer>

 <div className="mb-4">
 <label className="flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
 Metode Perhitungan
 <HelpTooltip content="Pilih metode rata-rata spasial yang paling sesuai dengan densitas stasiun dan topografi DAS Anda." />
 </label>
 <div className="inline-flex border border-slate-300 dark:border-slate-600 rounded-sm-sm overflow-hidden">
 <div
 role="button"
 tabIndex={0}
 onClick={() => setMetode('aljabar')}
 onKeyDown={(e) => e.key === 'Enter' && setMetode('aljabar')}
 className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${metode === 'aljabar'
 ? 'bg-pupr-blue text-white border-r border-pupr-blue'
 : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-600'
 }`}
 >
 Rata-rata Aljabar
 <HelpTooltip content="Metode paling sederhana, disarankan jika topografi datar dan stasiun tersebar merata." />
 </div>
 <div
 role="button"
 tabIndex={0}
 onClick={() => setMetode('thiessen')}
 onKeyDown={(e) => e.key === 'Enter' && setMetode('thiessen')}
 className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${metode === 'thiessen'
 ? 'bg-pupr-blue text-pupr-blue border-r border-pupr-blue'
 : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-600'
 }`}
 >
 Poligon Thiessen
 <HelpTooltip content="Membagi bobot berdasarkan luas pengaruh area. Membutuhkan koordinat stasiun." />
 </div>
 <div
 role="button"
 tabIndex={0}
 onClick={() => setMetode('isohyet')}
 onKeyDown={(e) => e.key === 'Enter' && setMetode('isohyet')}
 className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${metode === 'isohyet'
 ? 'bg-pupr-blue text-pupr-blue'
 : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800'
 }`}
 >
 Garis Isohyet
 <HelpTooltip content="Metode paling akurat untuk daerah pegunungan, menggunakan kontur hujan." />
 </div>
 </div>
 </div>

 {
 metode === 'thiessen' && (
 <>
 {stasiunList.length === 0 ? (
 <div className="p-4 bg-amber-50 border border-amber-200 rounded-sm-sm flex items-center gap-2">
 <AlertCircle className="w-5 h-5 text-amber-600" />
 <p className="text-sm text-amber-800">Belum ada stasiun hujan. Tambahkan stasiun terlebih dahulu.</p>
 </div>
 ) : (
 <>
 <div className="overflow-x-auto mb-4 border border-slate-200 dark:border-slate-700 rounded-sm-sm">
 <table className="w-full text-sm">
 <thead className="bg-pupr-blue/[0.02] border-b border-slate-200 dark:border-slate-700">
 <tr>
 <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Stasiun</th>
 <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Luas Pengaruh (km²)</th>
 <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Bobot (%)</th>
 </tr>
 </thead>
 <tbody>
 {configsWithBobot.map((config) => (
 <tr key={config.stasiunId} className="border-b border-slate-100 hover:bg-slate-50 dark:bg-slate-800">
 <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{config.namaStasiun}</td>
 <td className="px-3 py-2 tabular-nums tracking-tight">
 <input
 type="number"
 value={config.luasPengaruh === 0 ? 0 : (config.luasPengaruh ?? '')}
 onChange={(e) => handleLuasChange(config.stasiunId, e.target.value)}
 className="w-full h-9 px-2 text-sm text-right border border-slate-300 dark:border-slate-600 rounded-sm-sm focus:ring-1 focus:ring-pupr-blue focus:border-pupr-blue tabular-nums"
 placeholder="0.00"
 step="0.01"
 />
 </td>
 <td className="px-3 py-2 text-right tabular-nums tracking-tight">
 <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 dark:text-slate-300 rounded-sm font-semibold text-xs tabular-nums">
 {config.bobot.toFixed(2)}%
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm-sm p-3 mb-4">
 <div className="flex justify-between items-center">
 <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Total Luas Pengaruh:</span>
 <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">{totalLuasPengaruh.toFixed(2)} km²</span>
 </div>
 {morfometriDAS && (
 <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
 <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Luas DAS:</span>
 <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">{morfometriDAS.luasDAS.toFixed(2)} km²</span>
 </div>
 )}
 </div>

 {hasError && (
 <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm-sm flex items-start gap-2">
 <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
 <div className="flex-1">
 <p className="text-sm font-semibold text-red-900">Peringatan: Selisih Luas Pengaruh</p>
 <p className="text-xs text-red-700 mt-1">
 Total luas pengaruh ({totalLuasPengaruh.toFixed(2)} km²) harus sama dengan Luas DAS ({morfometriDAS?.luasDAS.toFixed(2)} km²).
 Selisih: <strong>{bobotError.toFixed(2)} km²</strong>
 </p>
 </div>
 </div>
 )}
 </>
 )}
 </>
 )
 }

 {
 metode === 'isohyet' && (
 <div className="space-y-4 mb-6">
 <div className="flex items-center justify-between">
 <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 ">Data Luas Antar Garis Isohyet</h4>
 <Button
 onClick={() => setIsohyetalConfigs([...isohyetalConfigs, { id: crypto.randomUUID(), label: `Area ${isohyetalConfigs.length + 1}`, curahHujanRataRata: 0, luasAntarGaris: 0, bobot: 0 }])}
 variant="outline"
 className="px-3 py-1 text-xs border-pupr-blue text-pupr-blue"
 >
 + Tambah Area
 </Button>
 </div>

 <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-sm-sm">
 <table className="w-full text-sm border-collapse">
 <thead className="bg-pupr-blue/[0.02] border-b border-slate-200 dark:border-slate-700">
 <tr>
 <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Label Area</th>
 <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">AMS Hujan (mm)</th>
 <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Luas (km²)</th>
 <th className="px-3 py-2 text-center text-slate-700 dark:text-slate-300">Aksi</th>
 </tr>
 </thead>
 <tbody>
 {isohyetalConfigs.map((config, idx) => (
 <tr key={config.id} className="border-b border-slate-100 hover:bg-slate-50 dark:bg-slate-800 transition-colors">
 <td className="px-2 py-2">
 <input
 value={config.label}
 onChange={(e) => {
 const newConfigs = [...isohyetalConfigs];
 newConfigs[idx].label = e.target.value;
 setIsohyetalConfigs(newConfigs);
 setIsSaved(false);
 }}
 className="w-full h-8 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-1 focus:ring-pupr-blue"
 />
 </td>
 <td className="px-2 py-2">
 <textarea
 value={config.annualMax ? config.annualMax.join(', ') : config.curahHujanRataRata}
 onChange={(e) => {
 const val = e.target.value;
 const nums = val.split(/[, \n]+/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
 const newConfigs = [...isohyetalConfigs];
 newConfigs[idx].annualMax = nums;
 if (nums.length > 0) newConfigs[idx].curahHujanRataRata = nums[0];
 setIsohyetalConfigs(newConfigs);
 setIsSaved(false);
 }}
 rows={1}
 className="w-full px-2 py-1 text-xs text-right border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-1 focus:ring-pupr-blue font-mono"
 placeholder="60, 70, 80..."
 />
 </td>
 <td className="px-2 py-2">
 <input
 type="number"
 value={config.luasAntarGaris === 0 ? '' : config.luasAntarGaris}
 onChange={(e) => {
 const newConfigs = [...isohyetalConfigs];
 newConfigs[idx].luasAntarGaris = e.target.value as any;
 setIsohyetalConfigs(newConfigs);
 setIsSaved(false);
 }}
 className="w-full h-8 px-2 text-xs text-right border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-1 focus:ring-pupr-blue"
 placeholder="0.00"
 />
 </td>
 <td className="px-2 py-2 text-center">
 <button
 onClick={() => {
 setIsohyetalConfigs(isohyetalConfigs.filter((_, i) => i !== idx));
 setIsSaved(false);
 }}
 className="text-red-500 hover:text-red-700 font-bold p-1"
 >
 ×
 </button>
 </td>
 </tr>
 ))}
 {isohyetalConfigs.length === 0 && (
 <tr>
 <td colSpan={4} className="px-3 py-4 text-center text-slate-500 italic text-xs">
 Belum ada data area isohyet. Tambahkan data area melalui peta atau input manual.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 )
 }

 {
 metode === 'aljabar' && (
 <div className="mb-4 p-3 bg-pupr-surface border-l-4 border-pupr-blue rounded-sm-sm">
 <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
 <strong className="text-pupr-blue">Rata-rata Aljabar:</strong> Semua stasiun memiliki bobot yang sama.
 Hujan wilayah dihitung dengan rata-rata aritmatik dari semua stasiun pengamatan yang tersedia.
 </p>
 </div>
 )
 }

 <button
 onClick={handleSave}
 disabled={hasError}
 className={`w-full px-4 py-2.5 font-semibold rounded-sm-sm transition-all flex items-center justify-center gap-2 ${hasError
 ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-500'
 : isSaved
 ? 'bg-green-600 hover:bg-green-700 text-white '
 : 'bg-pupr-blue hover:bg-pupr-blue text-white '
 }`}
 >
 {isSaved ? <CheckCircle className="w-4 h-4 animate-in fade-in scale-in-90 duration-75" /> : <Save className="w-4 h-4" />}
 {hasError ? 'Perbaiki Selisih Luas Terlebih Dahulu' : isSaved ? 'Tersimpan ✓' : 'Simpan Konfigurasi'}
 </button>
 </div >
 </Card >
 </div >
 );
};
