import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
 title: string;
 subtitle: string;
 icon: LucideIcon;
 iconColor?: string;
 actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
 title,
 subtitle,
 icon: Icon,
 iconColor = 'bg-teal-50 text-teal-600',
 actions
}) => {
 return (
 <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 z-10">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className={`p-2 ${iconColor} rounded-sm shrink-0`}>
 <Icon className="w-6 h-6" />
 </div>
 <div>
 <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h1>
 <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
 </div>
 </div>
 {actions && <div className="flex items-center gap-2">{actions}</div>}
 </div>
 </div>
 );
};
