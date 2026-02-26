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
  const { qcStatus, isQCOverridden, setQCOverride } = useHydrologyStore();

  if (!qcStatus) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Belum ada hasil Quality Control. Jalankan uji QC terlebih dahulu.</p>
        </div>
      </Card>
    );
  }

  const { konsisten, bebasOutlier, homogen } = qcStatus;
  const allPassed = konsisten && bebasOutlier && homogen;
  const canProceed = allPassed || isQCOverridden;
  const failedTests = [!konsisten && 'Konsistensi', !bebasOutlier && 'Outlier', !homogen && 'Homogenitas'].filter(Boolean);

  const getStatusIcon = (passed: boolean) => (
    passed ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-red-600" />
  );

  const getStatusColor = (passed: boolean) => (
    passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Quality Control Data Hujan</h3>
        {allPassed && (
          <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
            ✓ Semua Uji Lulus
          </span>
        )}
      </div>

      {/* QC Test Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Konsistensi RAPS */}
        <Card className={`p-4 border-2 ${getStatusColor(konsisten)}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Konsistensi</h4>
              <p className="text-xs text-gray-600 mt-1">RAPS Test</p>
            </div>
            {getStatusIcon(konsisten)}
          </div>
          <p className="text-sm text-gray-700 mt-2">
            {konsisten ? 'Data konsisten secara statistik' : 'Data tidak konsisten'}
          </p>
        </Card>

        {/* Outlier Grubbs */}
        <Card className={`p-4 border-2 ${getStatusColor(bebasOutlier)}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Outlier</h4>
              <p className="text-xs text-gray-600 mt-1">Smirnov-Grubbs</p>
            </div>
            {getStatusIcon(bebasOutlier)}
          </div>
          <p className="text-sm text-gray-700 mt-2">
            {bebasOutlier ? 'Tidak ada data ekstrem' : 'Ditemukan data outlier'}
          </p>
        </Card>

        {/* Homogenitas */}
        <Card className={`p-4 border-2 ${getStatusColor(homogen)}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Homogenitas</h4>
              <p className="text-xs text-gray-600 mt-1">F-Test & t-Test</p>
            </div>
            {getStatusIcon(homogen)}
          </div>
          <p className="text-sm text-gray-700 mt-2">
            {homogen ? 'Data homogen' : 'Data tidak homogen'}
          </p>
        </Card>
      </div>

      {/* Blocking Banner - Gagal QC */}
      {!allPassed && !isQCOverridden && (
        <Card className="p-4 bg-red-50 border-2 border-red-300">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 mb-1">
                ⛔ Data Tidak Memenuhi Standar Quality Control
              </h4>
              <p className="text-sm text-red-800 mb-2">
                Uji gagal: <strong>{failedTests.join(', ')}</strong>. Data tidak direkomendasikan untuk Analisis Frekuensi.
              </p>
              <div className="flex items-center gap-2 text-xs text-red-700 mb-3 bg-red-100 p-2 rounded">
                <Info className="w-4 h-4" />
                <span>Perbaiki data atau gunakan override jika Anda yakin data valid berdasarkan analisis lapangan.</span>
              </div>
              <Button
                onClick={() => setQCOverride(true)}
                variant="outline"
                className="bg-amber-100 border-amber-400 text-amber-900 hover:bg-amber-200"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                ⚠️ Force Override: Saya Yakin Data Valid
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Warning Banner - Override Aktif */}
      {isQCOverridden && !allPassed && (
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
      {allPassed && (
        <Card className="p-4 bg-green-50 border-2 border-green-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900">✓ Data Lolos Quality Control</h4>
              <p className="text-sm text-green-800">
                Data siap digunakan untuk Analisis Frekuensi dan perhitungan selanjutnya.
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
            className={allPassed ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}
          >
            {allPassed ? 'Lanjut ke Analisis Frekuensi →' : 'Lanjut dengan Override →'}
          </Button>
        </div>
      )}
    </div>
  );
};
