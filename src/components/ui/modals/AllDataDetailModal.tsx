import React from 'react';
import { AllCalculationsData } from '@/services/allCalculationsService';
import { TableGovTech } from '@/components/ui/TableGovTech';
import { Waves, Droplets, CloudRain, Calendar, Layers, CheckCircle2, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { Metric } from '@/components/ui/Metric';

interface Props {
 isOpen: boolean;
 data: AllCalculationsData | null;
 onClose: () => void;
}

export const AllDataDetailModal: React.FC<Props> = ({ isOpen, data, onClose }) => {
 if (!isOpen || !data) return null;

 const getTypeLabel = (type: string) => {
 if (type === 'manning') return 'Saluran Manning';
 if (type === 'flood') return 'Banjir Rasional';
 if (type === 'water_balance') return 'Neraca Air';
 return type;
 };

 const getTypeStyle = (type: string) => {
 if (type === 'manning') return { bg: 'bg-pupr-surface0/20', text: 'text-blue-300', border: 'border-blue-500/30', icon: <Waves className="w-5 h-5" /> };
 if (type === 'flood') return { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30', icon: <CloudRain className="w-5 h-5" /> };
 if (type === 'water_balance') return { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30', icon: <Droplets className="w-5 h-5" /> };
 return { bg: 'bg-slate-50 dark:bg-slate-8000/20', text: 'text-slate-300', border: 'border-slate-500/30', icon: <Layers className="w-5 h-5" /> };
 };

 const typeStyle = getTypeStyle(data.type);

 // --- RENDERS ---
 const renderManningDetail = () => {
 const results = data.data.results;
 if (!results) return null;
  return (
  <div className="space-y-6">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Metric
  label="Debit Rancangan (Q)"
  value={results.Discharge}
  unit="m³/s"
  variant="blue"
  density="detailed"
  icon={<Waves className="w-6 h-6" />}
  />
  <Metric
  label="Kecepatan Aliran (V)"
  value={results.Velocity}
  unit="m/s"
  variant="slate"
  density="detailed"
  icon={<Activity className="w-6 h-6" />}
  />
  </div>


 <div className={`rounded-sm p-5 border ${results.SafetyStatus === 'Aman' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 {results.SafetyStatus === 'Aman' ? (
 <CheckCircle2 className="w-8 h-8 text-emerald-600" />
 ) : (
 <AlertTriangle className="w-8 h-8 text-rose-600" />
 )}
 <div>
 <span className={`text-xs font-bold uppercase tracking-wide block mb-1 ${results.SafetyStatus === 'Aman' ? 'text-emerald-700' : 'text-rose-700'}`}>Status Keamanan</span>
 <p className={`text-lg font-extrabold tracking-tight ${results.SafetyStatus === 'Aman' ? 'text-emerald-900' : 'text-rose-900'}`}>
 {results.SafetyStatus}
 </p>
 </div>
 </div>
 <div className="text-right">
 <span className={`text-xs font-bold uppercase tracking-wide block mb-1 ${results.SafetyStatus === 'Aman' ? 'text-emerald-700' : 'text-rose-700'}`}>Tipe Aliran</span>
 <p className={`text-lg font-extrabold tracking-tight ${results.SafetyStatus === 'Aman' ? 'text-emerald-900' : 'text-rose-900'}`}>
 {results.FlowType}
 </p>
 </div>
 </div>
 </div>

 <div className="bg-white dark:bg-slate-900 rounded-sm overflow-hidden border border-slate-200 dark:border-slate-700 ">
 <div className="bg-slate-50 dark:bg-slate-800 px-5 py-3 border-b border-slate-200 dark:border-slate-700">
 <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-slate-500" />
 Geometri Saluran
 </h3>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
 <div className="p-4">
 <span className="text-xs text-slate-500 block mb-1">Luas Basah (A)</span>
 <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">{results.Area} <span className="text-xs text-slate-500 font-normal">m²</span></span>
 </div>
 <div className="p-4">
 <span className="text-xs text-slate-500 block mb-1">Jari-jari Hidrolis (R)</span>
 <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">{results.Radius} <span className="text-xs text-slate-500 font-normal">m</span></span>
 </div>
 <div className="p-4">
 <span className="text-xs text-slate-500 block mb-1">Angka Froude (Fr)</span>
 <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">{results.Froude}</span>
 </div>
 <div className="p-4 bg-slate-50 dark:bg-slate-800">
 <span className="text-xs text-slate-500 block mb-1">Tinggi Jagaan</span>
 <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">{results.Freeboard} <span className="text-xs text-slate-500 font-normal">m</span></span>
 </div>
 </div>
 </div>
 </div>
 );
 };

 const renderFloodDetail = () => {
 const results = data.data.results;
 if (!results) return null;
 return (
 <div className="space-y-6">
 <div className="bg-purple-50 rounded-sm p-5 border border-purple-200 flex items-center justify-between">
 <div>
 <span className="text-xs font-bold text-purple-600 uppercase tracking-wide block mb-1">Metode Analisis</span>
 <span className="text-lg font-extrabold text-purple-900">{data.data.method || 'Rasional'}</span>
 </div>
 <div className="text-right">
 <span className="text-xs font-bold text-purple-600 uppercase tracking-wide block mb-1">Volume Banjir</span>
 <span className="text-xl font-extrabold text-purple-900 tabular-nums">{(results.volume / 1000)?.toFixed(1)} <span className="text-sm font-bold text-purple-700">×10³ m³</span></span>
 </div>
 </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Metric
  label="Debit Puncak (Q)"
  value={results.qPeak}
  unit="m³/s"
  variant="blue"
  density="detailed"
  icon={<CloudRain className="w-6 h-6" />}
  />
  <Metric
  label="Waktu Puncak (tc)"
  value={results.tPeak}
  unit="jam"
  variant="slate"
  density="detailed"
  icon={<Activity className="w-6 h-6" />}
  />
  </div>


 {results.returnPeriods && results.returnPeriods.length > 0 && (
 <div className="bg-white dark:bg-slate-900 rounded-sm overflow-hidden border border-slate-200 dark:border-slate-700 ">
 <div className="bg-slate-50 dark:bg-slate-800 px-5 py-3 border-b border-slate-200 dark:border-slate-700">
 <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
 <CloudRain className="w-4 h-4 text-slate-500" />
 Debit Kala Ulang
 </h3>
 </div>
 <TableGovTech 
 columns={[
 { key: 'period', label: 'Kala Ulang', align: 'left' },
 { key: 'qPeak', label: 'Debit Puncak (m³/s)', align: 'right', numeric: true },
 ]}
 data={results.returnPeriods.map((rp: any) => ({
 period: rp.period,
 qPeak: rp.qPeak?.toFixed(2)
 }))}
 stickyHeader={false}
 zebraStripe={true}
 />
 </div>
 )}
 </div>
 );
 };

 const renderWaterBalanceDetail = () => {
 const totalSupply = data.data.monthly_inputs?.monthlySupply?.reduce((a: number, b: number) => a + b, 0) || 0;
 const summary = data.data.summary;
 const monthlyResults = data.data.monthly_results || [];
 const netBalance = totalSupply - monthlyResults.reduce((sum: number, r: any) => sum + parseFloat(r.totalDemand || 0), 0);
 
 return (
 <div className="space-y-6">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Metric
  label="Total Ketersediaan"
  value={totalSupply}
  unit="m³/s"
  variant="blue"
  density="detailed"
  icon={<Droplets className="w-6 h-6" />}
  />
  <Metric
  label="Status Neraca Tahunan"
  value={netBalance}
  unit="m³/s"
  variant={netBalance >= 0 ? 'emerald' : 'rose'}
  density="detailed"
  icon={<Activity className="w-6 h-6" />}
  />
  </div>


 <div className="grid grid-cols-3 gap-3">
 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-sm text-center">
 <span className="text-xs text-slate-500 block mb-1 font-bold">Bulan Surplus</span>
 <span className="text-2xl font-bold text-emerald-600 tabular-nums">{summary?.surplusMonths || 0}</span>
 </div>
 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-sm text-center">
 <span className="text-xs text-slate-500 block mb-1 font-bold">Bulan Defisit</span>
 <span className="text-2xl font-bold text-rose-600 tabular-nums">{summary?.deficitMonths || 0}</span>
 </div>
 <div className="bg-orange-50 border border-orange-200 p-4 rounded-sm text-center">
 <span className="text-xs text-orange-700 block mb-1 font-bold">Bulan Kritis</span>
 <span className="text-2xl font-bold text-orange-900">{summary?.criticalMonth?.month || '-'}</span>
 </div>
 </div>

 {monthlyResults.length > 0 && (
 <div className="bg-white dark:bg-slate-900 rounded-sm overflow-hidden border border-slate-200 dark:border-slate-700 ">
 <div className="bg-slate-50 dark:bg-slate-800 px-5 py-3 border-b border-slate-200 dark:border-slate-700">
 <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
 <Calendar className="w-4 h-4 text-slate-500" />
 Neraca Bulanan
 </h3>
 </div>
 <TableGovTech 
 columns={[
 { key: 'month', label: 'Bulan', align: 'left' },
 { key: 'supply', label: 'Andalan (m³/s)', align: 'right', numeric: true },
 { key: 'demand', label: 'Kebutuhan (m³/s)', align: 'right', numeric: true },
 { key: 'balance', label: 'Neraca (m³/s)', align: 'right', numeric: true },
 { key: 'status', label: 'Status', align: 'center' },
 ]}
 data={monthlyResults.map((r: any) => ({
 month: r.month,
 supply: parseFloat(r.supply || 0).toFixed(2),
 demand: parseFloat(r.totalDemand || 0).toFixed(2),
 balance: parseFloat(r.balance || 0).toFixed(2),
 status: (
 <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
 r.status === 'Surplus' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
 }`}>
 {r.status}
 </span>
 )
 }))}
 stickyHeader={false}
 zebraStripe={true}
 />
 </div>
 )}
 </div>
 );
 };

 return (
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900 animate-in fade-in duration-200" onClick={onClose}>
 <div className="bg-white dark:bg-slate-900 rounded-sm shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
 
 <div className="relative overflow-hidden bg-slate-900 border-b border-slate-800 px-6 py-5 shrink-0">
 <div className="absolute top-0 right-0 p-8 opacity-10">
 {typeStyle.icon}
 </div>

 <div className="flex items-start justify-between relative z-10">
 <div className="pr-12">
 <div className="flex items-center gap-3 mb-2">
 <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
 {getTypeLabel(data.type)}
 </span>
 <span className="text-slate-500 text-xs flex items-center gap-1.5 font-medium">
 <Calendar className="w-3.5 h-3.5" />
 {new Date(data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
 </span>
 </div>
 <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
 {data.project_name || 'Detail Proyek Tidak Bernama'}
 </h2>
 </div>

 <button
 onClick={onClose}
 className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center rounded-sm bg-white dark:bg-slate-900 hover:bg-white dark:bg-slate-900 text-white/70 hover:text-white transition-colors"
 >
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
 </button>
 </div>
 </div>

 <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-800">
 {data.type === 'manning' && renderManningDetail()}
 {data.type === 'flood' && renderFloodDetail()}
 {data.type === 'water_balance' && renderWaterBalanceDetail()}
 </div>

 <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-4 shrink-0 flex justify-end">
 <button
 onClick={onClose}
 className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-sm font-bold rounded-sm transition-colors focus:ring-2 focus:ring-slate-200 focus:outline-none"
 >
 Tutup
 </button>
 </div>
 </div>
 </div>
 );
};
