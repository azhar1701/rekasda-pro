import React from 'react';
import { QCResult } from '@/lib/utils/qc/dataQualityMath';
import { Card } from '@/components/ui/Card';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

interface QCDetailsPanelProps {
  result: QCResult;
}

export const QCDetailsPanel: React.FC<QCDetailsPanelProps> = ({ result }) => {
  const { details, dataLevel, dataYearsCount } = result;

  return (
    <div className="space-y-4">
      {/* Data Sufficiency Badge (SNI 2415:2016 Tiered Threshold) */}
      <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
        dataLevel === 'SNI_COMPLIANT'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : dataLevel === 'PRELIMINARY'
          ? 'bg-amber-50 border-amber-300 text-amber-900'
          : 'bg-red-50 border-red-300 text-red-900'
      }`}>
        <div className="flex items-center gap-2">
          {dataLevel === 'SNI_COMPLIANT' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : dataLevel === 'PRELIMINARY' ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          )}
          <div>
            <span className="font-semibold">
              {dataLevel === 'SNI_COMPLIANT' && 'Standar SNI 2415:2016 Terpenuhi'}
              {dataLevel === 'PRELIMINARY' && 'Tingkat Data Indikatif / Studi Awal'}
              {dataLevel === 'INSUFFICIENT' && 'Data Tidak Memenuhi Ambang Batas'}
            </span>
            <p className="text-[11px] opacity-80 mt-0.5">
              {dataLevel === 'SNI_COMPLIANT' && `Data stasiun mencakup ${dataYearsCount || '≥10'} tahun observasi tahunan.`}
              {dataLevel === 'PRELIMINARY' && `Data stasiun mencakup ${dataYearsCount} tahun (5–9 tahun). Hasil uji statistik valid (Barnett & Lewis, 1994) namun SNI menganjurkan ≥ 10 tahun untuk desain definitif.`}
              {dataLevel === 'INSUFFICIENT' && `Hanya tersedia ${dataYearsCount || '<5'} tahun data (minimum absolut 5 tahun).`}
            </p>
          </div>
        </div>
        <span className="font-mono font-bold px-2 py-0.5 rounded text-[11px] bg-white/70 shadow-sm border">
          {dataYearsCount ? `${dataYearsCount} Thn` : 'QC Test'}
        </span>
      </div>

      {/* RAPS Test Details */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {details.raps.isKonsisten ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <h4 className="font-semibold text-gray-900">Uji Konsistensi (RAPS)</h4>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Q (Hitung):</span>
            <span className="ml-2 font-mono">{details.raps.QHitung.toFixed(4)}</span>
          </div>
          <div>
            <span className="text-gray-600">Q/√n (Kritis):</span>
            <span className="ml-2 font-mono">{details.raps.QKritis.toFixed(4)}</span>
          </div>
          <div>
            <span className="text-gray-600">R (Hitung):</span>
            <span className="ml-2 font-mono">{details.raps.RHitung.toFixed(4)}</span>
          </div>
          <div>
            <span className="text-gray-600">R/√n (Kritis):</span>
            <span className="ml-2 font-mono">{details.raps.RKritis.toFixed(4)}</span>
          </div>
        </div>
        <p className="text-sm text-gray-700 mt-3 p-2 bg-gray-50 rounded">{details.raps.pesan}</p>
      </Card>

      {/* Grubbs Test Details (Linear Scale) */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {details.grubbs.isBebasOutlier ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <h4 className="font-semibold text-gray-900">Uji Outlier (Smirnov-Grubbs Linear)</h4>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Mean:</span>
            <span className="ml-2 font-mono">{details.grubbs.mean.toFixed(2)} mm</span>
          </div>
          <div>
            <span className="text-gray-600">Std Dev:</span>
            <span className="ml-2 font-mono">{details.grubbs.stdDev.toFixed(2)} mm</span>
          </div>
          <div>
            <span className="text-gray-600">Batas Atas:</span>
            <span className="ml-2 font-mono">{details.grubbs.upperLimit.toFixed(2)} mm</span>
          </div>
          <div>
            <span className="text-gray-600">Batas Bawah:</span>
            <span className="ml-2 font-mono">{details.grubbs.lowerLimit.toFixed(2)} mm</span>
          </div>
        </div>
        {details.grubbs.outliers.length > 0 && (
          <div className="mt-3 p-2 bg-red-50 rounded">
            <p className="text-sm font-semibold text-red-900 mb-1">Outlier Terdeteksi (Skala Linear):</p>
            <ul className="text-sm text-red-800 space-y-1">
              {details.grubbs.outliers.map((o, idx) => (
                <li key={idx}>
                  • Tahun {o.tahun}: {o.hujan.toFixed(1)} mm ({o.type === 'HIGH' ? 'Terlalu Tinggi' : 'Terlalu Rendah'})
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-sm text-gray-700 mt-3 p-2 bg-gray-50 rounded">{details.grubbs.pesan}</p>

        {/* Grubbs Test (Log-Normal Scale - WMO Guide No.100) */}
        {details.grubbsLog && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-slate-700">Verifikasi Skala Logaritmik (Log-Grubbs WMO No. 100):</span>
              {details.grubbsLog.isBebasOutlier ? (
                <span className="text-[11px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">Lolos</span>
              ) : (
                <span className="text-[11px] font-medium text-red-700 bg-red-50 px-1.5 py-0.5 rounded">Outlier Log</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
              <div>
                <span className="text-gray-500">Batas Bawah Log:</span>
                <span className="ml-1 font-mono font-medium">{details.grubbsLog.lowerLimit.toFixed(1)} mm</span>
              </div>
              <div>
                <span className="text-gray-500">Batas Atas Log:</span>
                <span className="ml-1 font-mono font-medium">{details.grubbsLog.upperLimit.toFixed(1)} mm</span>
              </div>
            </div>
            {details.grubbsLog.outliers.length > 0 && (
              <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-800">
                Outlier terdeteksi pada ruang log: {details.grubbsLog.outliers.map(o => `${o.tahun} (${o.hujan.toFixed(1)} mm)`).join(', ')}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Homogeneity Test Details */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {details.homogenitas.isHomogen ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <h4 className="font-semibold text-gray-900">Uji Homogenitas (F-Test & t-Test)</h4>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">F (Hitung):</span>
              <span className="ml-2 font-mono">{details.homogenitas.fTest.F.toFixed(3)}</span>
            </div>
            <div>
              <span className="text-gray-600">F (Kritis):</span>
              <span className="ml-2 font-mono">{details.homogenitas.fTest.Fkritis.toFixed(3)}</span>
            </div>
            <div>
              <span className="text-gray-600">t (Hitung):</span>
              <span className="ml-2 font-mono">{details.homogenitas.tTest.t.toFixed(3)}</span>
            </div>
            <div>
              <span className="text-gray-600">t (Kritis):</span>
              <span className="ml-2 font-mono">{details.homogenitas.tTest.tkritis.toFixed(3)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <span className={`px-2 py-1 text-xs rounded ${details.homogenitas.fTest.lulus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              F-Test: {details.homogenitas.fTest.lulus ? '✓ Lulus' : '✗ Gagal'}
            </span>
            <span className={`px-2 py-1 text-xs rounded ${details.homogenitas.tTest.lulus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              t-Test: {details.homogenitas.tTest.lulus ? '✓ Lulus' : '✗ Gagal'}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-700 mt-3 p-2 bg-gray-50 rounded">{details.homogenitas.pesan}</p>
      </Card>
    </div>
  );
};

