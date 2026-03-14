import React from 'react';

interface StatCardProps {
 label: string;
 value: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value }) => {
 return (
 <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-3">
 <div className="text-xs text-slate-500 mb-1">{label}</div>
 <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{value}</div>
 </div>
 );
};
