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
      <div className="bg-success-light border border-success/20 rounded-xl p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4 text-success" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-success-dark mb-1">
              ✓ Sesuai {sniReference}
            </h3>
            <p className="text-xs text-success-dark/80">
              Metode perhitungan yang dipilih sudah sesuai dengan standar nasional Indonesia.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-error-light border border-error/20 rounded-xl p-4 shadow-sm animate-pulse-subtle">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-error" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-error-dark mb-2">
            Peringatan {sniReference}
          </h3>
          <ul className="space-y-1">
            {warnings.map((warning, idx) => (
              <li key={idx} className="text-xs text-error-dark/90 leading-relaxed font-medium">
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
