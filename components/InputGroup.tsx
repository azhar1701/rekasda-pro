
import React, { useState, useEffect } from 'react';

interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  unit?: string;
  error?: string;
  description?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({ label, unit, error, description, value, onChange, ...props }) => {
  // Local state to handle decimal typing (prevents "1." turning into "1" immediately)
  const [localValue, setLocalValue] = useState<string>(value?.toString() ?? '');

  useEffect(() => {
    const currentNum = parseFloat(localValue);
    const incomingNum = typeof value === 'string' ? parseFloat(value) : (value as number);

    // CRITICAL FIX: Prevent overwriting local state when:
    // 1. Numerically equivalent (e.g. "1." vs 1, or "1.0" vs 1)
    if (currentNum === incomingNum) return;

    // 2. Local is empty/invalid (NaN) but parent passes 0 (likely due to 'parseFloat || 0' fallback)
    // This allows users to clear input or type "." without it jumping to "0"
    if (isNaN(currentNum) && incomingNum === 0) return;

    // Otherwise, it's a genuine external update (e.g. Load Pilot Data), so sync.
    setLocalValue(value?.toString() ?? '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    if (onChange) onChange(e);
  };

  return (
    <div className="group w-full">
      <div className="flex justify-between items-baseline mb-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide group-focus-within:text-safety-blue transition-colors duration-200">
          {label}
        </label>
        {error && <span className="text-[10px] text-red-500 font-bold animate-pulse">{error}</span>}
      </div>
      
      <div className={`
        relative flex items-center bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm
        ${error 
          ? 'border-red-300 ring-4 ring-red-50' 
          : 'border-slate-200 hover:border-slate-300 focus-within:border-safety-blue focus-within:ring-4 focus-within:ring-safety-blue/10 focus-within:shadow-glow'
        }
      `}>
        <input
          className="w-full bg-transparent py-3.5 px-4 text-base font-bold text-slate-900 placeholder-slate-300 outline-none font-mono"
          step="any"
          autoComplete="off"
          value={localValue}
          onChange={handleChange}
          {...props}
        />
        {unit && (
          <div className="bg-slate-50 border-l border-slate-100 px-4 py-3 h-full flex items-center justify-center min-w-[3.5rem]">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{unit}</span>
          </div>
        )}
      </div>
      
      {description && !error && (
        <p className="mt-2 text-[11px] text-slate-400 font-medium leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};
