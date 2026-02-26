import React from 'react';
import { QCResult } from '@/lib/utils/qc/dataQualityMath';
import { Card } from '@/components/ui/Card';
import { CheckCircle2, XCircle } from 'lucide-react';

interface QCDetailsPanelProps {
  result: QCResult;
}

export const QCDetailsPanel: React.FC<QCDetailsPanelProps> = ({ result }) => {
  const { details } = result;

  return (
    <div className="space-y-4">
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

      {/* Grubbs Test Details */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {details.grubbs.isBebasOutlier ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <h4 className="font-semibold text-gray-900">Uji Outlier (Smirnov-Grubbs)</h4>
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
            <p className="text-sm font-semibold text-red-900 mb-1">Outlier Terdeteksi:</p>
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
