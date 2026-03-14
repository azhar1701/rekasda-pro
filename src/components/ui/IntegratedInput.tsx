import React, { useId } from 'react';
import { Link2, Info } from 'lucide-react';

interface IntegratedInputProps {
 label: string;
 value: string | number;
 unit?: string;
 source: string;
 tooltip?: string;
 onNavigate?: () => void;
}

export const IntegratedInput: React.FC<IntegratedInputProps> = ({
 label,
 value,
 unit,
 source,
 tooltip,
 onNavigate
}) => {
  const inputId = useId();
  return (
  <div className="space-y-1.5">
  <div className="flex items-center justify-between">
  <label htmlFor={inputId} className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
 {label}
 {tooltip && (
 <span
 className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-slate-100 text-slate-500 text-[9px] font-bold cursor-help"
 title={tooltip}
 >
 <Info className="w-3 h-3" />
 </span>
 )}
 </label>
 <div className="flex items-center gap-1 text-[10px] text-pupr-blue font-semibold">
 <Link2 className="w-3 h-3" />
 <span>{source}</span>
 </div>
 </div>
 
 <div className="relative">
  <input
  id={inputId}
  type="text"
  value={value}
  readOnly
 className="min-h-[44px] w-full rounded-sm px-3 py-2.5 pr-14 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 cursor-not-allowed select-none"
 />
 {unit && (
 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 select-none">
 {unit}
 </span>
 )}
 </div>
 
 <div className="flex items-start gap-1.5 px-2 py-1.5 bg-pupr-surface border border-pupr-border rounded-sm">
 <Info className="w-3 h-3 text-pupr-blue flex-shrink-0 mt-0.5" />
 <p className="text-[10px] text-blue-800 leading-tight">
 Data terintegrasi dari <strong>{source}</strong>.{' '}
 {onNavigate ? (
 <button
 onClick={onNavigate}
 className="underline hover:text-blue-900 font-bold"
 >
 Ubah di sini
 </button>
 ) : (
 <span>Ubah di {source} untuk memperbarui.</span>
 )}
 </p>
 </div>
 </div>
 );
};
