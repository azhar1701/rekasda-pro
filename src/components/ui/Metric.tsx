import React from 'react';
import { cn } from '@/lib/utils';
import { HelpTooltip } from '@/components/ui/govtech/HelpTooltip';

interface MetricProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  tooltip?: string;
  icon?: React.ReactNode;
  density?: 'executive' | 'detailed' | 'compact';
  variant?: 'blue' | 'yellow' | 'emerald' | 'rose' | 'amber' | 'slate';
  className?: string;
}

const variantColors = {
  blue: 'text-pupr-blue',
  yellow: 'text-amber-600',
  emerald: 'text-emerald-700',
  rose: 'text-rose-700',
  amber: 'text-amber-700',
  slate: 'text-slate-800 dark:text-slate-200',
};

export const Metric: React.FC<MetricProps> = ({
  label,
  value,
  unit,
  subtitle,
  tooltip,
  icon,
  density = 'detailed',
  variant = 'blue',
  className,
}) => {
  const isExecutive = density === 'executive';
  const isCompact = density === 'compact';

  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
    : value;

  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm transition-all group relative overflow-hidden",
      isCompact ? "p-4" : "p-6",
      isExecutive && "hover:border-blue-300",
      className
    )}>
      {/* Background Icon for Executive/Detailed */}
      {!isCompact && icon && (
        <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-2">
          {isCompact && icon && <div className="text-slate-500">{icon}</div>}
          <span className={cn(
            "font-bold text-slate-500 uppercase tracking-wider",
            isExecutive ? "text-xs" : "text-[10px]"
          )}>
            {label}
          </span>
          {tooltip && (
            <HelpTooltip 
              content={tooltip} 
              title={label} 
              className="ml-0 opacity-40 group-hover:opacity-100 transition-opacity" 
            />
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <div className={cn(
            "font-bold tabular-nums tracking-tight",
            isExecutive ? "text-5xl" : isCompact ? "text-2xl" : "text-3xl",
            variantColors[variant]
          )}>
            {formattedValue}
          </div>
          {unit && (
            <span className={cn(
              "font-bold text-slate-500",
              isExecutive ? "text-lg" : "text-xs"
            )}>
              {unit}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-[10px] text-slate-500 mt-2 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
