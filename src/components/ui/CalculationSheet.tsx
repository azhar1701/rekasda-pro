import React from 'react';
import { Info, ShieldCheck } from 'lucide-react';

interface CalculationStep {
  label: string;
  formula: string;
  substitution: string;
  result: string;
  unit: string;
}

interface CalculationSheetProps {
  title: string;
  subtitle?: string;
  steps: CalculationStep[];
  sniReference?: string;
  complianceNote?: string;
}

/**
 * CalculationSheet — Enforces "Formula Transparency" for audit readiness.
 * Displays step-by-step derivation for engineering calculations.
 */
export const CalculationSheet: React.FC<CalculationSheetProps> = ({
  title,
  subtitle,
  steps,
  sniReference,
  complianceNote,
}) => {
  return (
    <div className="bg-white border border-slate-300 rounded-sm overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-300 px-4 py-3 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {sniReference && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-pupr-blue/10 border border-pupr-blue/20 rounded-md">
            <ShieldCheck className="w-3.5 h-3.5 text-pupr-blue" />
            <span className="text-[10px] font-bold text-pupr-blue uppercase">{sniReference}</span>
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="divide-y divide-slate-100">
        {steps.map((step, idx) => (
          <div key={idx} className="px-4 py-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                {idx + 1}
              </span>
              <span className="text-xs font-bold text-slate-700">{step.label}</span>
            </div>
            
            <div className="ml-7 space-y-3">
              {/* Formula */}
              <div className="bg-slate-50 p-2 border-l-2 border-slate-300 rounded-r-md">
                <code className="text-xs font-mono text-slate-600 italic">{step.formula}</code>
              </div>
              
              {/* Substitution & Result */}
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-xs text-slate-500 font-mono">{step.substitution}</span>
                <span className="text-sm font-bold text-slate-900">= {step.result} {step.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Compliance Note */}
      {complianceNote && (
        <div className="bg-amber-50 border-t border-slate-200 px-4 py-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
            {complianceNote}
          </p>
        </div>
      )}
    </div>
  );
};

export default CalculationSheet;
