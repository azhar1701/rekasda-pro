import React, { useId } from 'react';
import { cn } from '@/lib/utils';
import { Link, RotateCcw } from 'lucide-react';

export interface SmartOverrideInputProps {
 /** Display label above the input */
 label: string;
 /** Unit suffix shown inside the input (e.g. "km²", "mm") */
 unit?: string;
 /** The current value from global state (master data) */
 globalValue: string;
 /** The current local value controlled by the form */
 value: string;
 /** Change handler for local value */
 onChange: (value: string) => void;
 /** Optional tooltip / helper text */
 tooltip?: string;
 /** Placeholder text */
 placeholder?: string;
 /** HTML input type — defaults to "number" */
 type?: string;
 /** Additional className */
 className?: string;
 /** Disable the input */
 disabled?: boolean;
}

/**
 * SmartOverrideInput — Hybrid Input Component
 *
 * Pulls a default from global state but lets the user override it locally.
 * Visual indicators:
 * - 🔗 Linked (grey) when local value matches global value
 * - ⟲ Reset button + amber border when overridden
 */
export const SmartOverrideInput: React.FC<SmartOverrideInputProps> = ({
 label,
 unit,
 globalValue,
 value,
 onChange,
 tooltip,
 placeholder,
 type = 'number',
 className,
 disabled = false,
}) => {
 const id = useId();
 const isOverridden = value !== globalValue && globalValue !== '';
 const isLinked = value === globalValue && globalValue !== '';

 const handleReset = () => {
 onChange(globalValue);
 };

 return (
 <div className={cn('space-y-1.5', className)}>
 {/* Label row */}
 <div className="flex items-center justify-between">
 <label
 htmlFor={id}
 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"
 >
 {label}
 {tooltip && (
 <span
 className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-slate-100 text-slate-500 text-[9px] font-bold cursor-help"
 title={tooltip}
 >
 ?
 </span>
 )}
 </label>

 {/* Status badge */}
 {isLinked && (
 <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 select-none">
 <Link className="w-3 h-3" />
 Tersinkronisasi
 </span>
 )}
 {isOverridden && (
 <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500 select-none">
 <span className="w-1.5 h-1.5 rounded-sm bg-amber-400" />
 Override
 </span>
 )}
 </div>

 {/* Input wrapper */}
 <div className="relative group">
 <input
 id={id}
 type={type}
 value={value}
 onChange={(e) => onChange(e.target.value)}
 placeholder={placeholder}
 disabled={disabled}
 className={cn(
 'w-full rounded-sm px-4 py-3 pr-20 text-sm font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 transition-all duration-200',
 'placeholder:text-slate-300 focus:outline-none focus:ring-2',
 'disabled:opacity-50 disabled:cursor-not-allowed',
 isOverridden
 ? 'border-2 border-amber-300 focus:ring-amber-200 bg-amber-50/30'
 : 'border border-slate-200 dark:border-slate-700 focus:ring-blue-200 focus:border-blue-300'
 )}
 />

 {/* Right side: unit + reset */}
 <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
 {/* Reset button (only when overridden) */}
 {isOverridden && (
 <button
 type="button"
 onClick={handleReset}
 className="flex items-center justify-center w-6 h-6 rounded-sm bg-amber-100 hover:bg-amber-200 text-amber-600 transition-colors"
 title="Reset ke nilai master data"
 >
 <RotateCcw className="w-3.5 h-3.5" />
 </button>
 )}

 {/* Linked icon */}
 {isLinked && (
 <div className="flex items-center justify-center w-6 h-6 text-slate-300">
 <Link className="w-3.5 h-3.5" />
 </div>
 )}

 {/* Unit label */}
 {unit && (
 <span className="text-xs font-bold text-slate-500 select-none whitespace-nowrap">
 {unit}
 </span>
 )}
 </div>
 </div>
 </div>
 );
};

export default SmartOverrideInput;
