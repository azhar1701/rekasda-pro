import React from 'react';
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
                    className="bg-white border-2 border-slate-200 rounded-md p-2 flex flex-col items-center justify-center shadow-sm hover:border-[#0c3a66] transition-colors group"
                >
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1 select-none">
                        Tahun {i + 1} ({point.year})
                    </span>
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-sm font-black text-[#0c3a66] tabular-nums tracking-tight group-hover:scale-110 transition-transform">
                            {point.value || 0}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">mm</span>
                    </div>
                </div>
            ))}
            {/* Fill empty boxes if less than 10 data points */}
            {Array.from({ length: Math.max(0, 10 - displayData.length) }).map((_, i) => (
                <div
                    key={`empty-${i}`}
                    className="bg-slate-50 border border-slate-100 border-dashed rounded-md p-2 flex flex-col items-center justify-center opacity-40 shrink-0 h-[52px]"
                >
                    <span className="text-[8px] font-bold text-slate-300">N/A</span>
                </div>
            ))}
        </div>
    );
};
