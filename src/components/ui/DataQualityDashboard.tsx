import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, ShieldAlert, Info, ChevronDown, ChevronUp, GitCompare } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QCDetailsPanel } from '@/components/ui/QCDetailsPanel';
import type { QCResult } from '@/lib/utils/qc/dataQualityMath';
import { DoubleMassCorrectionModal } from '@/features/master-data/components/modals/DoubleMassCorrectionModal';

interface DataQualityDashboardProps {
  onProceed?: () => void;
  showDetails?: boolean;
}

export const DataQualityDashboard: React.FC<DataQualityDashboardProps> = ({ 
  onProceed
}) => {
  const { qcStatus, qcResults, dailyCompleteness, isQCOverridden, setQCOverride, rentangTahun, stasiunList } = useHydrologyStore();
  const [expandedStations, setExpandedStations] = useState<Record<string, boolean>>({});
  const [expandedCompleteness, setExpandedCompleteness] = useState<Record<string, boolean>>({});
  const [dcmmModalStasiunId, setDcmmModalStasiunId] = useState<string | null>(null);

  if (!qcStatus || Object.keys(qcStatus).length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Belum ada hasil Quality Control. Masukkan data curah hujan terlebih dahulu.</p>
        </div>
      </Card>
    );
  }

  // TAHAP 3: Aggregation Logic (Zero Trust Policy)
  // Evaluates to true IF AND ONLY IF all stations pass ALL 3 tests
  const allStasiunValid = Object.values(qcStatus).every(
    status => status.konsisten && status.bebasOutlier && status.homogen
  );

  const hasPreliminaryStations = Object.values(qcStatus).some(
    s => s.dataLevel === 'PRELIMINARY' || (s.dataYearsCount !== undefined && s.dataYearsCount < 10)
  );

  const canProceed = allStasiunValid || isQCOverridden;

  // Find all failed tests across all stations to display in the warning
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

  const getBadgeColor = (passed: boolean) => (
    passed ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
           <h3 className="text-lg font-semibold text-gray-900">Quality Control Data Hujan Summary</h3>
           {rentangTahun && (
              <p className="text-sm text-gray-500">
                 Rentang Data Evaluasi: <span className="font-semibold text-slate-700">{rentangTahun.min} - {rentangTahun.max}</span> ({rentangTahun.max - rentangTahun.min + 1} Tahun)
              </p>
           )}
        </div>
        {allStasiunValid && (
          hasPreliminaryStations ? (
            <span className="px-3 py-1 text-sm font-medium text-amber-800 bg-amber-50 rounded-full border border-amber-300 shadow-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600"/> Lolos (Tingkat Indikatif 5–9 Thn)
            </span>
          ) : (
            <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full border border-green-200 shadow-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4"/> Standar SNI Terpenuhi (≥10 Thn)
            </span>
          )
        )}
      </div>

      {/* Preliminary Notice Banner when all valid but data is 5-9 years */}
      {allStasiunValid && hasPreliminaryStations && (
        <Card className="p-3.5 bg-amber-50/70 border border-amber-300/80">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed">
              <strong>Catatan SNI 2415:2016:</strong> Data stasiun yang dievaluasi mencakup 5–9 tahun pengamatan tahunan. Uji konsistensi dan pencilan dinyatakan <strong>lulus secara statistik</strong> (Barnett & Lewis, 1994; WMO No. 100), namun SNI menganjurkan panjang data minimum 10 tahun untuk desain konstruksi hidraulik permanen.
            </p>
          </div>
        </Card>
      )}

      {/* Aggregate Blocking Banner - Gagal QC */}
      {!allStasiunValid && !isQCOverridden && (
        <Card className="p-4 bg-red-50 border-2 border-red-300">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 mb-1">
                ⛔ Peringatan: Standar Quality Control Gagal Pada Salah Satu Stasiun
              </h4>
              <p className="text-sm text-red-800 mb-2">
                Evaluasi gagal pada uji: <strong>{failedTests.join(', ')}</strong>. Data gabungan (Areally averaged) tidak direkomendasikan untuk Analisis Frekuensi.
              </p>
              <div className="flex items-center gap-2 text-xs text-red-700 mb-3 bg-red-100 p-2 rounded">
                <Info className="w-4 h-4" />
                <span>Perbaiki data stasiun yang memicu outlier, atau gunakan override jika Anda yakin anomali data diakibatkan gejala lokal ekstrim yang valid.</span>
              </div>
              <Button
                onClick={() => setQCOverride(true)}
                variant="outline"
                className="bg-amber-100 border-amber-400 text-amber-900 hover:bg-amber-200"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                ⚠️ Force Override: Lanjutkan Dengan Risiko
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* TAHAP 4: Dynamic Iterations of Detailed QC per Station */}
      <div className="space-y-3 mt-6">
        <h4 className="font-semibold text-gray-800 border-b pb-2">Detail QC Per Stasiun</h4>
        {Object.entries(qcStatus).map(([stasiunId, status]) => {
          const stasiun = stasiunList.find(s => s.id === stasiunId);
          const results = qcResults ? qcResults[stasiunId] : null;
          const qcRes = results as any;
          
          const rapsMessage = qcRes?.details?.raps?.pesan || qcRes?.konsistensi?.message || (status.konsisten ? 'Data konsisten (RAPS test)' : 'Data tidak konsisten');
          const homogenMessage = qcRes?.details?.homogenitas?.pesan || qcRes?.homogenitas?.message || (status.homogen ? 'Rata-rata homogen (F-Test/t-test)' : 'Ragam / varians data tidak homogen');
          const outlierMessage = qcRes?.details?.grubbs?.pesan || qcRes?.outlier?.message || (status.bebasOutlier ? 'Tidak terdeteksi outlier (Smirnov-Grubbs)' : 'Ditemukan pencilan data');
          const isExpanded = !!expandedStations[stasiunId];

          const stationYears = qcRes?.dataYearsCount || status.dataYearsCount;
          const stationLevel = qcRes?.dataLevel || status.dataLevel;

          return (
            <Card key={stasiunId} className="p-4 border border-slate-200 overflow-hidden relative">
               <div className="absolute top-0 left-0 w-1 h-full bg-slate-300"></div>
               <div className="pl-2">
                 <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                   <div className="flex items-center gap-2">
                     <h5 className="font-semibold text-slate-800">Stasiun: {stasiun?.nama_stasiun || 'Unknown'}</h5>
                     {stationLevel === 'PRELIMINARY' || (stationYears && stationYears < 10) ? (
                       <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                         ⚠️ Indikatif ({stationYears ? `${stationYears} Thn` : '5–9 Thn'})
                       </span>
                     ) : stationYears && stationYears >= 10 ? (
                       <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                         ✓ SNI ({stationYears} Thn)
                       </span>
                     ) : null}
                   </div>
                   {status.konsisten && status.bebasOutlier && status.homogen ? (
                     <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">✅ VALID</span>
                   ) : (
                     <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">❌ PERINGATAN</span>
                   )}
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                   {/* Konsistensi */}
                   <div className={`p-3 rounded-lg border ${getBadgeColor(status.konsisten)}`}>
                     <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider">Konsistensi</span>
                        {getStatusIcon(status.konsisten)}
                     </div>
                     <p className="text-xs mt-1 leading-snug">
                       {rapsMessage}
                     </p>
                   </div>
                   
                   {/* Homogenitas */}
                   <div className={`p-3 rounded-lg border ${getBadgeColor(status.homogen)}`}>
                     <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider">Homogenitas</span>
                        {getStatusIcon(status.homogen)}
                     </div>
                     <p className="text-xs mt-1 leading-snug">
                       {homogenMessage}
                     </p>
                   </div>

                   {/* Outlier */}
                   <div className={`p-3 rounded-lg border ${getBadgeColor(status.bebasOutlier)}`}>
                     <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider">Pencilan (Outlier)</span>
                        {getStatusIcon(status.bebasOutlier)}
                     </div>
                     <p className="text-xs mt-1 leading-snug">
                       {outlierMessage}
                     </p>
                   </div>
                 </div>

                 {/* Daily Completeness KPI & Breakdown (WMO No. 168) */}
                 {dailyCompleteness && dailyCompleteness[stasiunId] && (
                   <div className="mt-3 pt-2.5 border-t border-slate-100">
                     <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 text-xs">
                       <div className="flex items-center gap-2 flex-wrap">
                         <span className="font-bold text-slate-700">Kelengkapan Harian (WMO No. 168):</span>
                         <span className="font-mono font-semibold text-slate-800">
                           Rata-rata {dailyCompleteness[stasiunId].averageCompletenessPercent}%
                         </span>
                         <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                           dailyCompleteness[stasiunId].status === 'MEMENUHI_STANDAR'
                             ? 'bg-emerald-100 text-emerald-800'
                             : dailyCompleteness[stasiunId].status === 'PERLU_INFILL'
                             ? 'bg-amber-100 text-amber-800'
                             : 'bg-rose-100 text-rose-800'
                         }`}>
                           {dailyCompleteness[stasiunId].status === 'MEMENUHI_STANDAR' && '✓ Memenuhi Standar'}
                           {dailyCompleteness[stasiunId].status === 'PERLU_INFILL' && '⚠️ Perlu Infill'}
                           {dailyCompleteness[stasiunId].status === 'TIDAK_LAYAK' && '⛔ Data Kritis'}
                         </span>
                         <span className="text-slate-500">
                           ({dailyCompleteness[stasiunId].reliableYearsCount} dari {dailyCompleteness[stasiunId].totalYears} tahun layak AMS)
                         </span>
                       </div>

                       <button
                         type="button"
                         onClick={() => setExpandedCompleteness(prev => ({ ...prev, [stasiunId]: !prev[stasiunId] }))}
                         className="text-xs text-blue-700 hover:text-blue-900 font-semibold underline flex items-center gap-1"
                       >
                         <span>{expandedCompleteness[stasiunId] ? 'Tutup' : 'Lihat'} Rincian Tahunan</span>
                         {expandedCompleteness[stasiunId] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                       </button>
                     </div>

                     {/* Breakdown Table */}
                     {expandedCompleteness[stasiunId] && (
                       <div className="mt-2 overflow-x-auto border border-slate-200 rounded-md">
                         <table className="w-full text-left text-xs">
                           <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                             <tr>
                               <th className="py-1.5 px-2 text-center">Tahun</th>
                               <th className="py-1.5 px-2 text-right">Hari Tercatat</th>
                               <th className="py-1.5 px-2 text-right">Kelengkapan</th>
                               <th className="py-1.5 px-2 text-right">Hari Hilang</th>
                               <th className="py-1.5 px-2 text-right">Gap Terpanjang</th>
                               <th className="py-1.5 px-2 text-right">Hilang Musim Hujan</th>
                               <th className="py-1.5 px-2 text-center">Keandalan AMS</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                             {dailyCompleteness[stasiunId].years.map((y) => (
                               <tr key={y.year} className="hover:bg-slate-50">
                                 <td className="py-1 px-2 text-center font-mono font-medium">{y.year}</td>
                                 <td className="py-1 px-2 text-right font-mono">{y.recordedDays}/{y.totalDays}</td>
                                 <td className="py-1 px-2 text-right font-mono font-semibold">
                                   <span className={y.completenessPercent >= 90 ? 'text-emerald-700' : 'text-amber-700'}>
                                     {y.completenessPercent}%
                                   </span>
                                 </td>
                                 <td className="py-1 px-2 text-right font-mono">{y.missingDays}</td>
                                 <td className="py-1 px-2 text-right font-mono">{y.maxConsecutiveMissing} hari</td>
                                 <td className="py-1 px-2 text-right font-mono text-slate-600">{y.wetSeasonMissingDays} hari</td>
                                 <td className="py-1 px-2 text-center">
                                   {y.isReliableForAMS ? (
                                     <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                       ✓ Layak AMS
                                     </span>
                                   ) : (
                                     <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                       ⚠️ Rentan Bias
                                     </span>
                                   )}
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                     )}
                   </div>
                 )}

                 {/* Tombol Koreksi DMC — tampil jika konsistensi gagal */}
                  {!status.konsisten && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <div className="flex items-center gap-2.5 bg-rose-50/70 border border-rose-200/80 rounded-xl p-3">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <p className="text-xs text-rose-800 flex-1">
                          Uji konsistensi gagal. Gunakan <strong>Koreksi DMC</strong> untuk mendeteksi dan memperbaiki patahan data.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setDcmmModalStasiunId(stasiunId)}
                          className="shrink-0 bg-blue-700 hover:bg-blue-800 text-white text-xs h-8 px-3 gap-1.5"
                        >
                          <GitCompare className="w-3.5 h-3.5" />
                          Koreksi DMC
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Collapsible QC Details Panel */}
                 {qcRes?.details && (
                   <div className="mt-3 pt-2 border-t border-slate-100">
                     <button
                       type="button"
                       onClick={() => setExpandedStations(prev => ({ ...prev, [stasiunId]: !prev[stasiunId] }))}
                       className="flex items-center justify-between text-xs text-blue-700 hover:text-blue-800 font-medium py-1 px-1 rounded hover:bg-blue-50/70 transition-colors w-full"
                     >
                       <span>{isExpanded ? 'Sembunyikan' : 'Tampilkan'} Rincian Statistik Uji (Q, R, F, t & Ambang Kritis)</span>
                       {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
                     </button>
                     {isExpanded && (
                       <div className="mt-2 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                         <QCDetailsPanel result={qcRes as QCResult} />
                       </div>
                     )}
                   </div>
                 )}
               </div>
            </Card>
          );
        })}
      </div>

      {/* DoubleMassCorrectionModal */}
      {dcmmModalStasiunId && (() => {
        const dcmmStation = stasiunList.find(s => s.id === dcmmModalStasiunId);
        if (!dcmmStation) return null;
        return (
          <DoubleMassCorrectionModal
            targetStasiun={dcmmStation}
            onClose={() => setDcmmModalStasiunId(null)}
            onCorrectionApplied={() => setDcmmModalStasiunId(null)}
          />
        );
      })()}

      {/* Warning Banner - Override Aktif */}
      {isQCOverridden && !allStasiunValid && (
        <Card className="p-4 bg-amber-50 border-2 border-amber-400">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 mb-1">
                ⚠️ Override Aktif - Risiko Tinggi
              </h4>
              <p className="text-sm text-amber-800 mb-2">
                Anda telah memaksa melanjutkan dengan data yang gagal QC. Hasil analisis mungkin tidak akurat.
              </p>
              <Button
                onClick={() => setQCOverride(false)}
                variant="outline"
                size="sm"
                className="text-amber-900 border-amber-600"
              >
                Batalkan Override
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Success Banner */}
      {allStasiunValid && (
        <Card className="p-4 bg-green-50 border-2 border-green-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900">✓ Seluruh Data Lolos Quality Control</h4>
              <p className="text-sm text-green-800">
                Data stasiun gabungan tervalidasi aman. Anda dipersilakan untuk melanjutkan ke Analisis Frekuensi.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Proceed Button */}
      {canProceed && onProceed && (
        <div className="flex justify-end pt-2">
          <Button 
            onClick={onProceed} 
            className={allStasiunValid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}
          >
            {allStasiunValid ? 'Lanjut ke Analisis Frekuensi →' : 'Lanjut dengan Override →'}
          </Button>
        </div>
      )}
    </div>
  );
};
