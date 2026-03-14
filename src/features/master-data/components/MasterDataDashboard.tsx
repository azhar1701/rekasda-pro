import { Edit2, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { ProjectContextBanner } from '@/components/ui/ProjectContextBanner';
import { useMemo } from 'react';
import { CHART_COLORS } from '@/lib/constants/chartColors';

interface MasterDataDashboardProps {
 onNavigateToSection?: (section: 'qc' | 'morfometri' | 'tutupan' | 'hujan') => void;
}

export function MasterDataDashboard({ onNavigateToSection }: MasterDataDashboardProps) {
 const {
 qcResults: storeQCResults,
 morfometriDAS: storeMorfometri,
 tutupanLahan: storeTutupan,
 curahHujanWilayah: storeHujan,
 dataHujan: storeDataHujan,
 identitasLokasi,
 projectStationIds,
 resetAll,
 } = useHydrologyStore();

 const handleReset = () => {
 if (window.confirm('⚠️ KONFIRMASI RESET: Anda yakin ingin menghapus seluruh parameter proyek (DAS, Landuse, Hujan Wilayah) dan hasil analisis? \n\nNOTE: Database Stasiun dan Matriks Data Hujan TETAP TERSIMPAN.')) {
 resetAll();
 }
 };

 const dataHujan = storeDataHujan;

 const yearRange = useMemo(() => {
 if (!dataHujan || dataHujan.length === 0) return null;
 const years = dataHujan.map(d => new Date(d.tanggal).getFullYear());
 return `${Math.min(...years)} - ${Math.max(...years)}`;
 }, [dataHujan]);

 const rainfallChartData = useMemo(() => {
 const thiessenResults = useHydrologyStore.getState().hasilThiessen;
 if (thiessenResults?.hujanRataRataDAS?.length > 0) {
 return thiessenResults.hujanRataRataDAS.map((val: number, idx: number) => ({
 tahun: `Data ${idx + 1}`,
 hujan: Number(val.toFixed(2)),
 }));
 }
 if (!storeHujan?.stasiunConfigs) return [];
 return storeHujan.stasiunConfigs
 .map((item, idx) => ({
 tahun: item.namaStasiun || `Stn ${idx + 1}`,
 hujan: Number(item.bobot.toFixed(2)),
 isWeight: true
 }));
 }, [storeHujan]);

 const landCoverStats = useMemo(() => {
 if (!storeTutupan?.items || storeTutupan.items.length === 0) return null;
 const totalArea = storeTutupan.items.reduce((sum, item) => sum + (item.luas || 0), 0);
 if (totalArea === 0) return null;
 return {
 totalArea,
 bars: storeTutupan.items
 .map(item => ({
 name: item.jenis || 'Unknown',
 luas: item.luas || 0,
 percentage: ((item.luas || 0) / totalArea) * 100,
 }))
 .sort((a, b) => b.percentage - a.percentage)
 .slice(0, 3)
 };
 }, [storeTutupan]);

 const qcStatusSummary = useMemo(() => {
 if (!storeQCResults) return null;
 const entries = Object.values(storeQCResults);
 if (entries.length === 0) return null;
 return {
 rapsValid: entries.every(r => r.konsistensi?.isPassed ?? false),
 grubbsValid: entries.every(r => r.outlier?.isPassed ?? false),
 homogeneityValid: entries.every(r => r.homogenitas?.isPassed ?? false),
 };
 }, [storeQCResults]);

 const metodeName = useMemo(() => {
 if (!storeHujan?.metode) return 'Belum dipilih';
 const stationCount = storeHujan.stasiunConfigs?.length || 0;
 const method = storeHujan.metode === 'thiessen' ? 'Thiessen' : 'Aljabar';
 return stationCount > 0 ? `${method} (${stationCount})` : method;
 }, [storeHujan]);

 const completionStatus = useMemo(() => {
 return {
 identitas: !!identitasLokasi?.namaPekerjaan,
 morfometri: (storeMorfometri?.luasDAS || 0) > 0 && (storeMorfometri?.panjangSungai || 0) > 0,
 tutupanLahan: (storeTutupan?.items?.length || 0) > 0 || (storeTutupan?.koefisienPengaliranGabungan || 0) > 0,
 hujanWilayah: (projectStationIds?.length || 0) > 0,
 };
 }, [identitasLokasi, storeMorfometri, storeTutupan, projectStationIds]);

  const requiredStatus = [completionStatus.morfometri, completionStatus.tutupanLahan, completionStatus.hujanWilayah];
  const completionPercentage = (requiredStatus.filter(Boolean).length / requiredStatus.length) * 100;

  const completionColorClass = completionPercentage < 33 ? 'text-rose-500' : completionPercentage < 66 ? 'text-amber-500' : 'text-emerald-500';
  const completionBgClass = completionPercentage < 33 ? 'bg-rose-500' : completionPercentage < 66 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
 <div className="space-y-8 p-1">
 <ProjectContextBanner />

 {/* Header: Flattened & Quieter */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-700 pb-8">
 <div>
 <h2 className="text-3xl font-medium text-[#1e293b] dark:text-slate-100 tracking-tight">Status Kesiapan Data</h2>
 <p className="text-sm text-slate-500 mt-1">Audit parameter hidrologi untuk pemodelan DAS</p>
 </div>
 
 <div className="flex items-center gap-6">
 <div className="flex flex-col items-end">
  <div className="flex items-center gap-3">
  <span className={`text-4xl font-light tabular-nums ${completionColorClass}`}>{Math.round(completionPercentage)}%</span>
  <div className="w-32 h-1 bg-slate-100 rounded-sm overflow-hidden">
  <div 
  className={`h-full transition-all duration-75 ${completionBgClass}`} 
  style={{ width: `${completionPercentage}%` }}
  />
  </div>
  </div>
 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Technical Readiness</span>
 </div>
 
 <button 
 onClick={handleReset}
 className="p-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-all border border-slate-200 dark:border-slate-700 group"
 title="Reset Project"
 >
 <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-75" />
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
 {/* QC Section */}
 <section className="space-y-6">
 <header className="flex items-center justify-between group">
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-pupr-blue"></div>
 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kualitas Data</h3>
 </div>
 <button onClick={() => onNavigateToSection?.('hujan')} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded">
 <Edit2 className="w-3 h-3 text-slate-500" />
 </button>
 </header>

 {qcStatusSummary ? (
 <div className="space-y-4">
 {[
 { label: 'Konsistensi', status: qcStatusSummary.rapsValid },
 { label: 'Outlier', status: qcStatusSummary.grubbsValid },
 { label: 'Homogenitas', status: qcStatusSummary.homogeneityValid }
 ].map(test => (
 <div key={test.label} className="flex items-center justify-between border-b border-slate-50 pb-2">
 <span className="text-sm text-slate-600 dark:text-slate-400">{test.label}</span>
  {test.status ? 
  <span className="text-[10px] font-bold text-emerald-500 uppercase">Valid</span> : 
  <span className="text-[10px] font-bold text-red-500 uppercase">Fails</span>
  }
 </div>
 ))}
 {yearRange && <p className="text-[10px] text-slate-500 italic">Data Period: {yearRange}</p>}
 </div>
 ) : (
 <p className="text-xs text-slate-500 italic">Belum ada hasil audit statistik.</p>
 )}
 </section>

 {/* Morfometri Section */}
 <section className="space-y-6">
 <header className="flex items-center justify-between group">
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-pupr-blue"></div>
 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Geometri DAS</h3>
 </div>
 <button onClick={() => onNavigateToSection?.('morfometri')} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded">
 <Edit2 className="w-3 h-3 text-slate-500" />
 </button>
 </header>

 {storeMorfometri?.luasDAS ? (
 <div className="space-y-6">
 <div>
 <p className="text-5xl font-light tracking-tight text-slate-800 dark:text-slate-100 tabular-nums">
 {storeMorfometri.luasDAS.toFixed(2)}
 <span className="text-sm font-bold text-slate-400 ml-2 uppercase">km²</span>
 </p>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Area (A)</p>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <p className="text-2xl font-light tracking-tight text-slate-800 dark:text-slate-300 tabular-nums">{(storeMorfometri.panjangSungai || 0).toFixed(2)} <span className="text-xs text-slate-500">km</span></p>
 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Length (L)</p>
 </div>
 <div>
 <p className="text-2xl font-light tracking-tight text-slate-800 dark:text-slate-300 tabular-nums">{(storeMorfometri.kemiringanSungai || 0).toFixed(4)}</p>
 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Slope (S)</p>
 </div>
 </div>
 </div>
 ) : (
 <p className="text-xs text-slate-500 italic">Data geometri belum terdefinisi.</p>
 )}
 </section>

 {/* Landuse Section */}
 <section className="space-y-6">
 <header className="flex items-center justify-between group">
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-pupr-blue"></div>
 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tata Guna Lahan</h3>
 </div>
 <button onClick={() => onNavigateToSection?.('tutupan')} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded">
 <Edit2 className="w-3 h-3 text-slate-500" />
 </button>
 </header>

 {storeTutupan?.koefisienPengaliranGabungan != null ? (
 <div className="space-y-6">
 <div>
 <p className="text-5xl font-light tracking-tight text-pupr-blue tabular-nums">
 {storeTutupan.koefisienPengaliranGabungan.toFixed(3)}
 </p>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Composite C</p>
 </div>
 {landCoverStats && (
 <div className="space-y-3">
 {landCoverStats.bars.map((item, idx) => (
 <div key={idx}>
 <div className="flex justify-between text-[10px] font-medium text-slate-500 mb-1.5">
 <span className="truncate uppercase">{item.name}</span>
 <span className="tabular-nums">{item.percentage.toFixed(1)}%</span>
 </div>
 <div className="w-full bg-slate-100 rounded-sm h-0.5 overflow-hidden">
 <div
 className="bg-pupr-blue h-full transition-all duration-75"
 style={{ width: `${item.percentage}%` }}
 />
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 ) : (
 <p className="text-xs text-slate-500 italic">Koefisien limpasan belum dihitung.</p>
 )}
 </section>

 {/* Rainfall Recap - Full Width */}
 <section className="md:col-span-3 pt-8 border-t border-slate-100 space-y-6">
 <header className="flex items-center justify-between group">
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Visualisasi Hujan Wilayah</h3>
 </div>
 <div className="flex items-center gap-4">
 <div className="text-right">
 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Method</p>
 <p className="text-xs font-bold text-pupr-blue uppercase">{metodeName}</p>
 </div>
 <button onClick={() => onNavigateToSection?.('hujan')} className="p-1.5 hover:bg-slate-100 rounded-sm transition-colors">
 <Edit2 className="w-3.5 h-3.5 text-slate-500" />
 </button>
 </div>
 </header>

 {rainfallChartData.length > 0 ? (
 <div className="h-64 -ml-4">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={rainfallChartData}>
 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
 <XAxis
 dataKey="tahun"
 tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }}
 axisLine={false}
 tickLine={false}
 dy={10}
 />
 <YAxis
 tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }}
 axisLine={false}
 tickLine={false}
 />
 <Tooltip
 cursor={{ fill: '#f8fafc' }}
 contentStyle={{
 backgroundColor: '#ffffff',
 border: '1px solid #e2e8f0',
 borderRadius: '6px',
 boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.05)',
 padding: '8px'
 }}
 labelStyle={{ fontSize: '10px', fontWeight: 700, color: '#0c3a66', marginBottom: '2px', textTransform: 'uppercase' }}
 formatter={(value: number, _name: any, props: any) => [
 <span className="font-bold text-slate-700 dark:text-slate-300">{value.toFixed(2)} {props.payload.isWeight ? '%' : 'mm'}</span>,
 <span className="text-[8px] font-bold text-slate-500 uppercase">{props.payload.isWeight ? 'Weight' : 'Areal'}</span>
 ]}
 />
 <Bar dataKey="hujan" fill={CHART_COLORS.primary} radius={[2, 2, 0, 0]} barSize={24} opacity={0.8} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 ) : (
 <div className="h-48 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-sm border border-dashed border-slate-200 dark:border-slate-700">
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No Visualization Data</p>
 </div>
 )}
 </section>
 </div>
 </div>
 );
}
