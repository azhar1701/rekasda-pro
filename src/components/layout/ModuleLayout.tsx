import React from 'react';
import { GlobalErrorBoundary } from './GlobalErrorBoundary';

interface ModuleLayoutProps {
 title: string;
 description: string;
 icon: React.ReactNode;
 iconColorClass?: string;
 sniCode?: string;
 actions?: React.ReactNode;
 children: React.ReactNode;
}

export const ModuleLayout = ({
 title,
 description,
 icon,
 iconColorClass = "bg-teal-50 text-teal-600",
 sniCode,
 actions,
 children
}: ModuleLayoutProps) => {
 return (
 <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-[#0f172a] rounded-none  min-h-[85vh]">
 {/* Dashboard Header */}
 <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] z-10 shrink-0 flex items-center justify-between">
 <div className="flex items-center gap-3 mb-1">
 <div className={`p-2 rounded-sm shrink-0 ${iconColorClass}`}>
 {icon}
 </div>
 <div>
 <div className="flex items-center gap-3">
 <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h1>
 {sniCode && (
 <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-sm tracking-widest uppercase border border-slate-200 dark:border-slate-700">
 {sniCode}
 </span>
 )}
 </div>
 <p className="text-sm text-slate-500 mt-1">{description}</p>
 </div>
 </div>
 {actions && <div className="hidden sm:block">{actions}</div>}
 </div>

 {/* Internal Scrollable Content Area */}
 <div className="flex-1 flex flex-col p-3 sm:p-6">
 <div className="flex-1 overflow-visible pr-1 pb-4 flex flex-col relative">
 <GlobalErrorBoundary>
 {children}
 </GlobalErrorBoundary>
 </div>
 </div>
 </div>
 );
};
