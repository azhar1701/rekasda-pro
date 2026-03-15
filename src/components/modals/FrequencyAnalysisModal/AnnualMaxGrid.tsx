import * as React from 'react';
import { RainfallDataPoint } from '../FrequencyAnalysisModal';

interface AnnualMaxGridProps {
 data: RainfallDataPoint[];
}

export const AnnualMaxGrid: React.FC<AnnualMaxGridProps> = ({ data }) => {
 // Ensure we only show up to 10 or pad to 10 if needed for the layout to be stable
 const displayData = data.slice(0, 10);

 return (
 <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
 {displayData.map((point, i) => (
 <div
 key={point.year || i}
 className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-sm p-2 flex flex-col items-center justify-center hover:border-pupr-blue transition-colors group"
 >
 <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-tighter mb-1 select-none">
 Tahun {i + 1} ({point.year})
 </span>
 <div className="flex items-baseline gap-0.5">
 <span className="text-sm font-extrabold text-pupr-blue tabular-nums tracking-tight group- transition-transform">
 {(point.value || 0).toFixed(2)}
 </span>
 <span className="text-[10px] font-bold text-slate-500">mm</span>
 </div>
 </div>
 ))}
 {/* Fill empty boxes if less than 10 data points */}
 {Array.from({ length: Math.max(0, 10 - displayData.length) }).map((_, i) => (
 <div
 key={`empty-${i}`}
 className="bg-slate-50 dark:bg-slate-800 border border-slate-100 border-dashed rounded-sm p-2 flex flex-col items-center justify-center opacity-40 shrink-0 h-[52px]"
 >
 <span className="text-[8px] font-bold text-slate-300">N/A</span>
 </div>
 ))}
 </div>
 );
};
