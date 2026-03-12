import React from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { DataHujan } from '@/types/hydrology.types';

interface DailyRainfallMatrixProps {
    data: DataHujan[];
    year: number;
    onCellClick?: (dateStr: string, currentVal: number | null) => void;
}

export const DailyRainfallMatrix: React.FC<DailyRainfallMatrixProps> = ({ data, year, onCellClick }) => {
    // We store the full DataHujan object in the matrix to access metadata
    const matrix: (DataHujan | null)[][] = Array.from({ length: 31 }, () => Array(12).fill(null));
    
    data.forEach(row => {
        const [yyyy, mm, dd] = row.tanggal.split('-');
        const rowYear = parseInt(yyyy, 10);
        if (rowYear === year) {
            const month = parseInt(mm, 10) - 1;
            const day = parseInt(dd, 10) - 1;
            if (day >= 0 && day < 31 && month >= 0 && month < 12) {
                matrix[day][month] = row;
            }
        }
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nop', 'Des'];

    let maxRainfall = 0;
    data.forEach(row => {
        const [yyyy] = row.tanggal.split('-');
        if (parseInt(yyyy, 10) === year && row.curah_hujan > maxRainfall) {
            maxRainfall = row.curah_hujan;
        }
    });

    const monthlyStats = Array.from({ length: 12 }, () => ({
        jumlah: 0,
        maksimum: -Infinity,
        minimum: Infinity,
        count: 0,
        hariHujan: 0,
    }));

    for (let m = 0; m < 12; m++) {
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        let hasData = false;
        for (let d = 0; d < 31; d++) {
            const cell = matrix[d][m];
            const isValidDay = d + 1 <= daysInMonth;

            if (isValidDay && cell) {
                const val = cell.curah_hujan;
                hasData = true;
                monthlyStats[m].jumlah += val;
                if (val > monthlyStats[m].maksimum) monthlyStats[m].maksimum = val;
                if (val < monthlyStats[m].minimum) monthlyStats[m].minimum = val;
                monthlyStats[m].count++;
                if (val > 0) monthlyStats[m].hariHujan++;
            }
        }
        if (!hasData) {
            monthlyStats[m].maksimum = 0;
            monthlyStats[m].minimum = 0;
        }
    }

    const getCellClass = (cell: DataHujan | null) => {
        if (!cell) return 'text-slate-400 text-center';
        
        const val = cell.curah_hujan;
        let baseClass = 'text-right pr-2 transition-all ';

        // 1. Highlighting Infilled Data (Logs)
        if (cell.is_infilled) {
            baseClass += 'bg-teal-50 text-teal-700 font-medium italic border-l-2 border-l-teal-400 ';
        }

        // 2. Anomaly UI Recommendations
        if (cell.anomaly_type === 'SUSPICIOUS_ZERO') {
            return baseClass + 'bg-amber-100 text-amber-700 font-bold border-2 border-amber-400';
        }
        if (cell.anomaly_type === 'EXTREME_SPIKE') {
            return baseClass + 'bg-red-500 text-white font-black border-2 border-red-700';
        }

        // Standard coloring
        if (val < 0) return baseClass + 'text-red-500 font-bold bg-red-50';
        if (val === 0) return baseClass + 'text-slate-400';
        if (val > 0 && val < 50) return baseClass + 'text-slate-800';
        if (val >= 50 && val < 300) return baseClass + 'bg-blue-100 text-pupr-blue font-bold';
        if (val >= 300) return baseClass + 'bg-red-100 text-red-700 font-bold';
        
        return baseClass;
    };

    const getCellTooltip = (cell: DataHujan | null) => {
        if (!cell) return '';
        let tooltip = `Tanggal: ${cell.tanggal}\nHujan: ${cell.curah_hujan} mm`;
        if (cell.is_infilled) tooltip += `\n[INFILLED] Ref: ${cell.infilled_from?.join(', ')}`;
        if (cell.anomaly_type) tooltip += `\n[ANOMALI] ${cell.anomaly_type}: ${cell.keterangan || 'Data mencurigakan'}`;
        return tooltip;
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Legend for Anomaly & Infilling */}
            <div className="flex flex-wrap gap-4 p-3 bg-slate-50 border border-slate-200 rounded-md">
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
                    <div className="w-3 h-3 bg-teal-50 border-l-2 border-teal-400"></div> Infilling (IDW)
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
                    <div className="w-3 h-3 bg-amber-100 border-2 border-amber-400"></div> Suspicious Zero
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
                    <div className="w-3 h-3 bg-red-500 border-2 border-red-700"></div> Extreme Spike
                </div>
            </div>

            <div className="h-[600px] border-2 border-slate-500 bg-white shadow-sm rounded-sm overflow-hidden">
                <TableVirtuoso
                    data={matrix}
                    fixedHeaderContent={() => (
                        <tr className="bg-slate-200 text-slate-800">
                            <th className="py-1.5 px-1 border border-slate-500 font-bold text-center w-12 sticky left-0 bg-slate-200 z-50">Tgl</th>
                            {months.map((m, i) => (
                                <th key={i} className="py-1.5 px-1 border border-slate-500 font-bold text-center min-w-[60px] bg-slate-200">{m}</th>
                            ))}
                        </tr>
                    )}
                    itemContent={(dayIndex, row) => (
                        <>
                            <th className="py-1 px-1.5 border border-slate-500 font-bold text-slate-700 text-center sticky left-0 bg-slate-50 z-20 group-hover:bg-slate-200">
                                {dayIndex + 1}
                            </th>
                            {row.map((cell, monthIndex) => {
                                const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                                const isValidDay = dayIndex + 1 <= daysInMonth;
                                
                                if (!isValidDay) {
                                    return <td key={monthIndex} className="py-1 px-1.5 border border-slate-500 bg-slate-200/50" aria-hidden="true"></td>;
                                }

                                const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayIndex + 1).padStart(2, '0')}`;
                                
                                return (
                                    <td 
                                        key={monthIndex} 
                                        title={getCellTooltip(cell)}
                                        className={`py-1 border border-slate-500 tabular-nums ${getCellClass(cell)} ${onCellClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-inner' : ''}`}
                                        onClick={() => onCellClick?.(dateStr, cell?.curah_hujan || null)}
                                    >
                                        {cell !== null ? cell.curah_hujan.toFixed(1) : '-'}
                                    </td>
                                );
                            })}
                        </>
                    )}
                    components={{
                        Table: ({ style, ...props }) => <table {...props} style={{ ...style, borderCollapse: 'collapse', width: '100%', fontSize: '11px' }} />,
                        TableRow: (props) => <tr {...props} className="hover:bg-slate-50 transition-colors group" />
                    }}
                />
            </div>

            {/* Footer Summary */}
            <div className="overflow-x-auto border-x border-b border-slate-500">
                <table className="w-full text-[11px] border-collapse min-w-[800px]">
                    <tbody>
                        <tr className="bg-slate-100 font-bold">
                            <th className="py-1.5 px-1.5 border border-slate-500 text-slate-800 text-left w-12 sticky left-0 bg-slate-200 z-20">Hujan Maximum</th>
                            {monthlyStats.map((stat, i) => (
                                <td key={i} className="py-1.5 border border-slate-500 tabular-nums text-right pr-2 text-slate-800 min-w-[60px]">
                                    {stat.count > 0 ? stat.maksimum.toFixed(1) : '-'}
                                </td>
                            ))}
                        </tr>
                        <tr className="bg-slate-100 font-bold">
                            <th className="py-1.5 px-1.5 border border-slate-500 text-slate-800 text-left w-12 sticky left-0 bg-slate-200 z-20">Jml Curah Hujan</th>
                            {monthlyStats.map((stat, i) => (
                                <td key={i} className="py-1.5 border border-slate-500 tabular-nums text-right pr-2 text-slate-800">
                                    {stat.count > 0 ? stat.jumlah.toFixed(1) : '-'}
                                </td>
                            ))}
                        </tr>
                        <tr className="bg-slate-100 font-bold">
                            <th className="py-1.5 px-1.5 border border-slate-500 text-slate-800 text-left w-12 sticky left-0 bg-slate-200 z-20">Jml.Hari Hujan</th>
                            {monthlyStats.map((stat, i) => (
                                <td key={i} className="py-1.5 border border-slate-500 tabular-nums text-center text-slate-800">
                                    {stat.count > 0 ? stat.hariHujan : '-'}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="bg-white border border-slate-300 rounded-md p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="font-bold text-slate-700 uppercase tracking-widest text-xs">Rekapitulasi Hujan Maksimum Tahunan</span>
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-pupr-blue tabular-nums">{maxRainfall.toFixed(1)} <span className="text-xs font-normal text-slate-500">mm</span></span>
                </div>
            </div>
        </div>
    );
};

export default DailyRainfallMatrix;
