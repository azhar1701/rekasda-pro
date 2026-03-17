
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

  // Helper to extract height and ring classes for the input, while keeping layout classes for container
  const heightClass = className?.match(/h-\d+/)?.[0] || "h-11";
  const containerClasses = className?.split(' ').filter(c => !c.startsWith('h-') && !c.startsWith('bg-') && !c.startsWith('border-')).join(' ');
  const inputOverrideClasses = className?.split(' ').filter(c => c.startsWith('bg-') || c.startsWith('border-') || c.startsWith('ring-')).join(' ');

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", containerClasses)}>
      <div className="flex justify-between items-center px-0.5">
        <div className="flex items-center gap-1.5">
          <Label htmlFor={inputId} className="text-[12px] font-bold text-slate-500 uppercase tracking-tight dark:text-slate-400">
            {label}
          </Label>
          {helpText && <HelpTooltip content={helpText} />}
        </div>
        {error && <span className="text-[10px] text-red-500 font-bold animate-pulse">{error}</span>}
      </div>

      <div className="relative flex items-center group transition-all duration-75">
        <Input
          id={inputId}
          name={name || inputId}
          className={cn(
            "font-mono font-bold text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 transition-all duration-200 focus-visible:ring-primary-500/20 focus-visible:border-pupr-blue/50 rounded-none shadow-none",
            heightClass,
            inputOverrideClasses,
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
          <div className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-r-none text-[10px] font-bold text-slate-500 tracking-tight">
            {unit}
          </div>
        )}
      </div>

      {description && !error && (
        <p className="text-[10px] text-slate-500 font-medium leading-tight px-0.5">
          {description}
        </p>
      )}
    </div>
  );
};
