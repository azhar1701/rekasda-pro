import React from 'react';

interface CardGovTechProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  noPadding?: boolean;
  accentColor?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'pupr';
}

const accentColorMap = {
  blue: 'border-l-4 border-l-blue-500',
  emerald: 'border-l-4 border-l-emerald-500',
  amber: 'border-l-4 border-l-amber-500',
  rose: 'border-l-4 border-l-rose-500',
  indigo: 'border-l-4 border-l-indigo-500',
  pupr: 'border-l-4 border-l-pupr-yellow',
};

export const CardGovTech: React.FC<CardGovTechProps> = ({ 
  children, 
  className = '',
  title,
  subtitle,
  headerAction,
  noPadding = false,
  accentColor
}) => {
  const accentClass = accentColor ? accentColorMap[accentColor] : '';
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden ${accentClass} ${className}`}>
 {(title || subtitle || headerAction) && (
 <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
 <div className="flex items-start justify-between gap-4">
 <div className="min-w-0">
 {title && (
 <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider truncate">
 {title}
 </h3>
 )}
 {subtitle && (
 <p className="text-xs text-slate-500 mt-1 truncate">
 {subtitle}
 </p>
 )}
 </div>
 {headerAction && (
 <div className="flex items-center gap-2 shrink-0">
 {headerAction}
 </div>
 )}
 </div>
 </div>
 )}
 <div className={noPadding ? '' : 'p-6'}>
 {children}
 </div>
 </div>
 );
};

interface CardGovTechHeaderProps {
 children: React.ReactNode;
 className?: string;
}

export const CardGovTechHeader: React.FC<CardGovTechHeaderProps> = ({ children, className = '' }) => {
 return (
 <div className={`px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 ${className}`}>
 {children}
 </div>
 );
};

interface CardGovTechContentProps {
 children: React.ReactNode;
 className?: string;
 noPadding?: boolean;
}

export const CardGovTechContent: React.FC<CardGovTechContentProps> = ({ 
 children, 
 className = '',
 noPadding = false 
}) => {
 return (
 <div className={`${noPadding ? '' : 'p-6'} ${className}`}>
 {children}
 </div>
 );
};
