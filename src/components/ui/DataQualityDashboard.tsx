import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle, ShieldAlert, Info } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface DataQualityDashboardProps {
 onProceed?: () => void;
 showDetails?: boolean;
}

export const DataQualityDashboard: React.FC<DataQualityDashboardProps> = ({ 
 onProceed
}) => {
 const { qcStatus, qcResults, stationHealth, isQCOverridden, setQCOverride, rentangTahun, stasiunList } = useHydrologyStore();

 if (!qcStatus || Object.keys(qcStatus).length === 0) {
 return (
 <Card className="p-6">
 <div className="text-center text-gray-500">
 <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
 <p>Belum ada hasil Quality Control. Jalankan audit pada menu Database Stasiun.</p>
 </div>
 </Card>
 );
 }

 const allStasiunValid = Object.values(qcStatus).every(
 status => status.konsisten && status.bebasOutlier && status.homogen
 );

 const canProceed = allStasiunValid || isQCOverridden;

 const failedTestsSet = new Set<string>();
 Object.values(qcStatus).forEach(status => {
 if (!status.konsisten) failedTestsSet.add('Konsistensi');
 if (!status.bebasOutlier) failedTestsSet.add('Outlier');
 if (!status.homogen) failedTestsSet.add('Homogenitas');
 });
 const failedTests = Array.from(failedTestsSet);

 const getStatusIcon = (passed: boolean) => (
 passed ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />
 );

 return (
 <div className="space-y-4">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Audit Kualitas & Kesehatan Data</h3>
 {rentangTahun && (
 <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">
 Global Range: <span className="font-bold text-slate-700 dark:text-slate-300">{rentangTahun.min} - {rentangTahun.max}</span> ({rentangTahun.max - rentangTahun.min + 1} Tahun)
 </p>
 )}
 </div>
 {allStasiunValid && (
 <span className="px-3 py-1 text-xs font-black text-emerald-700 bg-emerald-50 rounded-sm border border-emerald-200 flex items-center gap-1.5 uppercase tracking-tighter">
 <CheckCircle2 className="w-3.5 h-3.5"/> All Systems Normal
 </span>
 )}
 </div>

 {/* Aggregate Blocking Banner */}
 {!allStasiunValid && !isQCOverridden && (
 <Card className="p-4 bg-rose-50 border-2 border-rose-200 ">
 <div className="flex items-start gap-3">
 <ShieldAlert className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
 <div className="flex-1">
 <h4 className="font-bold text-rose-900 mb-1 uppercase text-sm tracking-tight">
 Standar Engineering Gagal
 </h4>
 <p className="text-xs text-rose-800 mb-3 leading-relaxed">
 Evaluasi mendeteksi kegagalan kritis pada uji: <strong>{failedTests.join(', ')}</strong>. Penggunaan data ini tanpa perbaikan berisiko tinggi terhadap akurasi desain bangunan air.
 </p>
 <div className="flex items-center gap-2 text-[10px] text-amber-700 mb-4 bg-amber-50/50 p-2 rounded border border-amber-100">
 <Info className="w-3.5 h-3.5" />
 <span>Mohon verifikasi data pencilan (outlier) atau gunakan force override jika anomali tervalidasi secara fisik.</span>
 </div>
 <Button
 onClick={() => setQCOverride(true)}
 variant="outline"
 className="bg-white dark:bg-slate-900 border-rose-300 text-rose-700 hover:bg-rose-50 font-bold h-9 text-xs"
 >
 <AlertTriangle className="w-3.5 h-3.5 mr-2" />
 Force Override Analysis
 </Button>
 </div>
 </div>
 </Card>
 )}

 {/* Detail Per Stasiun */}
 <div className="space-y-3 mt-6">
 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Detail Audit Per Stasiun</h4>
 {Object.entries(qcStatus).map(([stasiunId, status]) => {
 const stasiun = stasiunList.find(s => s.id === stasiunId);
 const results = qcResults ? (qcResults as any)[stasiunId] : null;
 const health = stationHealth ? stationHealth[stasiunId] : null;
 const isHealthy = status.konsisten && status.bebasOutlier && status.homogen;
 
 return (
 <Card key={stasiunId} className="p-4 border border-slate-200 dark:border-slate-700 overflow-hidden relative hover: transition-all">
 <div className={`absolute top-0 left-0 w-1 h-full ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
 <div className="pl-2">
 <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
 <div>
 <h5 className="font-black text-slate-800 dark:text-slate-200 uppercase text-xs tracking-tight">Stasiun: {stasiun?.nama_stasiun || 'Unknown'}</h5>
 {health && (
 <p className="text-[10px] text-slate-500 font-medium mt-0.5">
 PERIODE: {health.periodStart} — {health.periodEnd} | GAP: {health.missingPercentage}%
 </p>
 )}
 </div>
 <div className="flex items-center gap-2">
 {health && (
 <div className={`px-2 py-0.5 rounded-sm text-[9px] font-black border ${
 health.healthScore >= 80 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
 health.healthScore >= 50 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-rose-50 border-rose-200 text-rose-700'
 }`}>
 SCORE: {health.healthScore}
 </div>
 )}
 <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
 isHealthy ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
 }`}>
 {isHealthy ? 'PASSED' : 'FAILED'}
 </span>
 </div>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 <div className={`p-3 rounded-sm border bg-white dark:bg-slate-900 ${status.konsisten ? 'border-emerald-100' : 'border-rose-100'}`}>
 <div className="flex justify-between items-start mb-1">
 <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Konsistensi</span>
 {getStatusIcon(status.konsisten)}
 </div>
 <p className="text-[11px] font-medium text-slate-600 dark:text-slate-500 leading-tight">
 {results?.konsistensi?.message || (status.konsisten ? 'Data konsisten (RAPS)' : 'Data tidak konsisten')}
 </p>
 </div>
 
 <div className={`p-3 rounded-sm border bg-white dark:bg-slate-900 ${status.homogen ? 'border-emerald-100' : 'border-rose-100'}`}>
 <div className="flex justify-between items-start mb-1">
 <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Homogenitas</span>
 {getStatusIcon(status.homogen)}
 </div>
 <p className="text-[11px] font-medium text-slate-600 dark:text-slate-500 leading-tight">
 {results?.homogenitas?.message || (status.homogen ? 'Rata-rata homogen' : 'Data tidak homogen')}
 </p>
 </div>

 <div className={`p-3 rounded-sm border bg-white dark:bg-slate-900 ${status.bebasOutlier ? 'border-emerald-100' : 'border-rose-100'}`}>
 <div className="flex justify-between items-start mb-1">
 <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Pencilan</span>
 {getStatusIcon(status.bebasOutlier)}
 </div>
 <p className="text-[11px] font-medium text-slate-600 dark:text-slate-500 leading-tight">
 {results?.outlier?.message || (status.bebasOutlier ? 'Bebas Outlier Grubbs' : 'Terdeteksi Outlier')}
 </p>
 </div>
 </div>
 </div>
 </Card>
 );
 })}
 </div>

 {isQCOverridden && !allStasiunValid && (
 <Card className="p-4 bg-amber-50 border-2 border-amber-300 animate-pulse">
 <div className="flex items-start gap-3">
 <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
 <div className="flex-1">
 <h4 className="font-black text-amber-900 mb-1 text-sm uppercase tracking-tight">
 Force Override Aktif
 </h4>
 <p className="text-xs text-amber-800 mb-3 leading-relaxed">
 Engineer telah memvalidasi anomali data. Melanjutkan analisis frekuensi dengan risiko ketidakpastian tinggi.
 </p>
 <Button
 onClick={() => setQCOverride(false)}
 variant="outline"
 size="sm"
 className="bg-white dark:bg-slate-900 border-amber-400 text-amber-900 font-bold h-8 text-[10px]"
 >
 Batalkan & Perbaiki Data
 </Button>
 </div>
 </div>
 </Card>
 )}

 {canProceed && onProceed && (
 <div className="flex justify-end pt-4">
 <Button 
 onClick={onProceed} 
 className={`font-black uppercase tracking-widest text-xs h-11 px-8 transition-all ${
 allStasiunValid ? 'bg-pupr-blue hover:bg-slate-900 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'
 }`}
 >
 {allStasiunValid ? 'Lanjut Analisis Frekuensi →' : 'Lanjut dengan Override →'}
 </Button>
 </div>
 )}
 </div>
 );
};
