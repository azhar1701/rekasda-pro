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
  const { qcStatus, qcResults, isQCOverridden, setQCOverride, rentangTahun, stasiunList } = useHydrologyStore();

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
          <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full border border-green-200 shadow-sm flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4"/> Semua Uji Stasiun Lolos
          </span>
        )}
      </div>

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
          
          return (
            <Card key={stasiunId} className="p-4 border border-slate-200 overflow-hidden relative">
               <div className="absolute top-0 left-0 w-1 h-full bg-slate-300"></div>
               <div className="pl-2">
                 <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                   <h5 className="font-semibold text-slate-800">Stasiun: {stasiun?.nama_stasiun || 'Unknown'}</h5>
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
                       {results?.konsistensi?.message || (status.konsisten ? 'Data konsisten (RAPS test)' : 'Data tidak konsisten')}
                     </p>
                   </div>
                   
                   {/* Homogenitas */}
                   <div className={`p-3 rounded-lg border ${getBadgeColor(status.homogen)}`}>
                     <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider">Homogenitas</span>
                        {getStatusIcon(status.homogen)}
                     </div>
                     <p className="text-xs mt-1 leading-snug">
                       {results?.homogenitas?.message || (status.homogen ? 'Rata-rata homogen (F-Test/t-test)' : 'Ragam / varians data tidak homogen')}
                     </p>
                   </div>

                   {/* Outlier */}
                   <div className={`p-3 rounded-lg border ${getBadgeColor(status.bebasOutlier)}`}>
                     <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider">Pencilan (Outlier)</span>
                        {getStatusIcon(status.bebasOutlier)}
                     </div>
                     <p className="text-xs mt-1 leading-snug">
                       {results?.outlier?.message || (status.bebasOutlier ? 'Tidak terdeteksi Grubbs-beck outlier' : 'Ditemukan outlier tinggi/rendah')}
                     </p>
                   </div>
                 </div>
               </div>
            </Card>
          );
        })}
      </div>



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
