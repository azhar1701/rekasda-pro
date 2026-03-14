import React from 'react';

interface CardGovTechProps {
 children: React.ReactNode;
 className?: string;
 title?: string;
 subtitle?: string;
 headerAction?: React.ReactNode;
 noPadding?: boolean;
}

export const CardGovTech: React.FC<CardGovTechProps> = ({ 
 children, 
 className = '',
 title,
 subtitle,
 headerAction,
 noPadding = false
}) => {
 return (
 <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden ${className}`}>
 {(title || subtitle || headerAction) && (
 <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
 <div className="flex items-start justify-between">
 <div>
 {title && (
 <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
 {title}
 </h3>
 )}
 {subtitle && (
 <p className="text-xs text-slate-500 mt-1">
 {subtitle}
 </p>
 )}
 </div>
 {headerAction && (
 <div className="flex items-center gap-2">
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
