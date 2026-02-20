import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface SNIWarningProps {
  isCompliant: boolean;
  warnings: string[];
  sniReference: string;
}

export const SNIWarning: React.FC<SNIWarningProps> = ({ 
  isCompliant, 
  warnings, 
  sniReference 
}) => {
  if (isCompliant && warnings.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-green-900 mb-1">
              ✓ Sesuai {sniReference}
            </h3>
            <p className="text-xs text-green-800">
              Metode perhitungan yang dipilih sudah sesuai dengan standar nasional.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-bold text-red-900 mb-2">
            Peringatan {sniReference}
          </h3>
          <ul className="space-y-1">
            {warnings.map((warning, idx) => (
              <li key={idx} className="text-xs text-red-800">
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
