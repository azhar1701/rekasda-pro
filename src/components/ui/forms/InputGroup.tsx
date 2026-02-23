
import React, { useState, useEffect } from 'react';
import { HelpTooltip } from '../data-display/HelpTooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  unit?: string;
  error?: string;
  description?: string;
  helpText?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({
  label,
  unit,
  error,
  description,
  helpText,
  value,
  onChange,
  id,
  name,
  className,
  ...props
}) => {
  const [localValue, setLocalValue] = useState<string>(value?.toString() ?? '');
  const inputId = id || `input-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    const currentNum = parseFloat(localValue);
    const incomingNum = typeof value === 'string' ? parseFloat(value) : (value as number);

    if (currentNum === incomingNum) return;
    if (isNaN(currentNum) && incomingNum === 0) return;

    setLocalValue(value?.toString() ?? '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    if (onChange) onChange(e);
  };

  return (
    <div className={cn("space-y-2 w-full", className)}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Label htmlFor={inputId} className="text-[13px] font-semibold text-slate-700">
            {label}
          </Label>
          {helpText && <HelpTooltip content={helpText} />}
        </div>
        {error && <span className="text-[10px] text-red-500 font-bold animate-pulse">{error}</span>}
      </div>

      <div className="relative flex items-center group">
        <Input
          id={inputId}
          name={name || inputId}
          className={cn(
            "h-11 font-mono font-bold text-slate-900 border-slate-200 focus-visible:ring-primary-500/20",
            unit && "pr-16",
            error && "border-red-500 focus-visible:ring-red-500/20"
          )}
          step="any"
          autoComplete="off"
          value={localValue}
          onChange={handleChange}
          {...props}
        />
        {unit && (
          <div className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center border-l border-slate-200 bg-slate-50/80 rounded-r-md text-[10px] font-bold text-slate-500 uppercase tracking-tight">
            {unit}
          </div>
        )}
      </div>

      {description && !error && (
        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};
