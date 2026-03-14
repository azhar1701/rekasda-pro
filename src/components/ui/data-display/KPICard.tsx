import React from 'react';
import { HelpTooltip } from '@/components/ui/govtech/HelpTooltip';
import { cn } from '@/lib/utils';

interface KPICardProps {
 label: string;
 value: string | number;
 unit?: string;
 color?: 'pupr-blue' | 'pupr-yellow' | 'emerald' | 'rose' | 'amber' | 'slate';
 tooltip?: string;
 className?: string;
}

const valueColorClasses = {
 'pupr-blue': 'text-pupr-blue',
 'pupr-yellow': 'text-slate-900 dark:text-slate-100',
 'emerald': 'text-emerald-700',
 'rose': 'text-rose-700',
 'amber': 'text-amber-700',
 'slate': 'text-slate-800 dark:text-slate-200'
};

export const KPICard: React.FC<KPICardProps> = ({ 
 label, 
 value, 
 unit, 
 color = 'pupr-blue',
 tooltip,
 className
}) => {
 return (
 <div className={cn(
 "bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 py-4 px-1 group transition-all hover:bg-slate-50 dark:bg-slate-800",
 className
 )}>
 <div className="flex items-center gap-1.5 mb-1.5">
 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
 {label}
 </span>
 {tooltip && (
 <HelpTooltip content={tooltip} title={label} className="ml-0 opacity-40 group-hover:opacity-100 transition-opacity" />
 )}
 </div>
 
 <div className="flex items-baseline gap-2">
 <div className={cn(
 "text-3xl font-medium tabular-nums tracking-tight",
 valueColorClasses[color]
 )}>
 {typeof value === 'number' ? value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
 </div>
 {unit && (
 <span className="text-xs font-medium text-slate-500">
 {unit}
 </span>
 )}
 </div>
 </div>
 );
};
