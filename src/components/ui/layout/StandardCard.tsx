import React from 'react';

interface StandardCardProps {
 title?: string;
 subtitle?: string;
 children: React.ReactNode;
 actions?: React.ReactNode;
 className?: string;
 noPadding?: boolean;
}

export const StandardCard: React.FC<StandardCardProps> = ({
 title,
 subtitle,
 children,
 actions,
 className = '',
 noPadding = false
}) => {
 return (
 <div className={`bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 hover: transition-shadow duration-200 overflow-hidden ${className}`}>
 {(title || actions) && (
 <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
 <div>
 {title && <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>}
 {subtitle && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{subtitle}</p>}
 </div>
 {actions && <div className="flex items-center gap-2">{actions}</div>}
 </div>
 )}
 <div className={noPadding ? '' : 'p-6'}>
 {children}
 </div>
 </div>
 );
};
