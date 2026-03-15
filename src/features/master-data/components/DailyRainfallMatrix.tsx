import * as React from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { DataHujan } from '@/types/hydrology.types';
import { cn } from '@/lib/utils';

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

 /**
 * Professional Rainfall Magnitude Color Scale
 * Based on intensity levels common in hydrologic audits
 */
 const getCellClass = (cell: DataHujan | null) => {
 if (!cell) return 'text-slate-300 text-center bg-slate-50 dark:bg-slate-800';
 
 const val = cell.curah_hujan;
 let baseClass = 'text-right pr-2 transition-all font-mono text-[10px] ';

 // 1. Quality Flags (Top Priority)
 if (cell.anomaly_type === 'EXTREME_SPIKE') return baseClass + 'bg-red-600 text-white font-black ring-1 ring-inset ring-red-800';
 if (cell.anomaly_type === 'SUSPICIOUS_ZERO') return baseClass + 'bg-amber-200 text-amber-800 font-bold';
 if (cell.is_infilled) baseClass += 'italic font-medium text-teal-700 bg-teal-50 ';

 // 2. Magnitude Heatmap
 if (val === 0) return baseClass + 'text-slate-300';
 if (val > 0 && val < 5) return baseClass + 'bg-pupr-surface/50 text-blue-400'; // Light Rain
 if (val >= 5 && val < 20) return baseClass + 'bg-blue-100 text-pupr-blue'; // Moderate
 if (val >= 20 && val < 50) return baseClass + 'bg-blue-200 text-blue-800 font-medium'; // Heavy
 if (val >= 50 && val < 100) return baseClass + 'bg-pupr-surface0 text-white font-bold'; // Very Heavy
 if (val >= 100 && val < 150) return baseClass + 'bg-indigo-600 text-white font-black'; // Extreme
 if (val >= 150) return baseClass + 'bg-purple-700 text-white font-black'; // Disaster level
 
 return baseClass;
 };

 const getCellTooltip = (cell: DataHujan | null) => {
 if (!cell) return '';
 let tooltip = `📅 ${cell.tanggal}\n🌧️ ${cell.curah_hujan} mm`;
 if (cell.is_infilled) tooltip += `\n✨ [INFILLED] Ref: ${cell.infilled_from?.join(', ')}`;
 if (cell.anomaly_type) tooltip += `\n⚠️ [ANOMALI] ${cell.anomaly_type}`;
 return tooltip;
 };

 return (
 <div className="flex flex-col gap-4 w-full animate-in fade-in duration-75">
 {/* Professional Legend & Metadata Summary */}
 <div className="flex flex-col md:flex-row justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm ">
 <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 bg-pupr-surface border border-pupr-border rounded-sm"></div>
 <span className="text-[9px] font-bold text-slate-500 uppercase">Light (&lt;5)</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 bg-pupr-surface0 rounded-sm "></div>
 <span className="text-[9px] font-bold text-slate-500 uppercase">Heavy (50-100)</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 bg-purple-700 rounded-sm "></div>
 <span className="text-[9px] font-bold text-slate-500 uppercase">Extreme (&gt;150)</span>
 </div>
 <div className="flex items-center gap-2 ml-2 pl-4 border-l border-slate-200 dark:border-slate-700">
 <div className="w-3 h-3 bg-teal-50 border border-teal-200 rounded-sm"></div>
 <span className="text-[9px] font-bold text-teal-600 uppercase">Infilled Data</span>
 </div>
 </div>
 
 <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
 <div className="flex flex-col items-end">
 <span>Missing Records</span>
 <span className="text-slate-800 dark:text-slate-200 tabular-nums">{monthlyStats.reduce((sum, s) => sum + (new Date(year, months.indexOf(months[0]) + 1, 0).getDate() - s.count), 0)} Hari</span>
 </div>
 </div>
 </div>

 {/* Virtualized Matrix Body */}
 <div className="h-[550px] border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-sm overflow-hidden relative">
 <TableVirtuoso
 data={matrix}
 fixedHeaderContent={() => (
 <tr className="bg-slate-800 text-white ">
 <th className="py-2 px-1 font-black text-center w-10 sticky left-0 bg-slate-900 z-50 text-[9px] uppercase tracking-tighter border-r border-slate-700">Tgl</th>
 {months.map((m, i) => (
 <th key={i} className="py-2 px-1 font-black text-center min-w-[65px] text-[10px] uppercase tracking-widest border-r border-slate-700">{m}</th>
 ))}
 </tr>
 )}
 itemContent={(dayIndex: number, row: (DataHujan | null)[]) => (
 <>
 <th className="py-1 px-1.5 border-r border-b border-slate-200 dark:border-slate-700 font-black text-slate-500 text-center sticky left-0 bg-white dark:bg-slate-900 z-20 group-hover:bg-slate-100 text-[10px] tabular-nums">
 {dayIndex + 1}
 </th>
 {row.map((cell: DataHujan | null, monthIndex: number) => {
 const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
 const isValidDay = dayIndex + 1 <= daysInMonth;
 
 if (!isValidDay) {
 return <td key={monthIndex} className="py-1 px-1.5 border-r border-b border-slate-100 bg-slate-50 dark:bg-slate-800" aria-hidden="true"></td>;
 }

 const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayIndex + 1).padStart(2, '0')}`;
 
  return (
  <td 
  key={monthIndex} 
  title={getCellTooltip(cell)}
  className={cn(
  "py-1 border-r border-b border-slate-100 tabular-nums transition-all select-none",
  getCellClass(cell),
  onCellClick && "cursor-pointer hover:brightness-90"
  )}
  onClick={() => onCellClick?.(dateStr, cell?.curah_hujan || null)}
  {...(onCellClick ? {
  role: "button" as const,
  tabIndex: 0,
  onKeyDown: (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
  e.preventDefault();
  onCellClick(dateStr, cell?.curah_hujan || null);
  }
  },
  'aria-label': `${dateStr}: ${cell !== null ? `${cell.curah_hujan.toFixed(1)} mm` : 'tidak ada data'}`,
  } : {})}
  >
  {cell !== null ? cell.curah_hujan.toFixed(1) : '-'}
  </td>
  );
 })}
 </>
 )}
 components={{
 Table: ({ style, ...props }: any) => <table {...props} style={{ ...style, borderCollapse: 'collapse', width: '100%' }} />,
 TableRow: (props: any) => <tr {...props} className="even:bg-slate-50/70 odd:bg-white dark:even:bg-slate-800/40 dark:odd:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group" />
 }}
 />
 </div>

 {/* Matrix Footer Summary */}
 <div className="overflow-x-auto border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-900">
 <table className="w-full text-[10px] border-collapse min-w-[800px]">
 <tbody>
 <tr className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400">
 <th className="py-2 px-3 text-left w-32 sticky left-0 bg-slate-100 border-r border-slate-200 dark:border-slate-700 uppercase tracking-tighter">Hujan Max (mm)</th>
 {monthlyStats.map((stat, i) => (
 <td key={i} className="py-2 px-1 text-right pr-2 tabular-nums border-r border-slate-100">
 {stat.count > 0 ? stat.maksimum.toFixed(1) : '—'}
 </td>
 ))}
 </tr>
 <tr className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400">
 <th className="py-2 px-3 text-left w-32 sticky left-0 bg-slate-100 border-r border-slate-200 dark:border-slate-700 uppercase tracking-tighter">Hari Hujan</th>
 {monthlyStats.map((stat, i) => (
 <td key={i} className="py-2 px-1 text-center tabular-nums border-r border-slate-100">
 {stat.count > 0 ? stat.hariHujan : '—'}
 </td>
 ))}
 </tr>
 </tbody>
 </table>
 </div>

 {/* Annual Peak Insight */}
 <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:bg-slate-950">
 <div>
 <span className="font-black text-slate-500 uppercase tracking-[0.2em] text-[10px] block mb-1">Annual Rainfall Peak</span>
 <h4 className="text-white text-sm font-bold opacity-80 uppercase tracking-tight">Hujan Harian Maksimum Tahun {year}</h4>
 </div>
 <div className="flex items-center gap-4 bg-white dark:bg-slate-900/5 px-4 py-2 rounded-sm border border-white/10">
 <span className="text-4xl font-black text-pupr-yellow tabular-nums drop-">{maxRainfall.toFixed(1)}</span>
 <div className="flex flex-col leading-none">
 <span className="text-xs font-black text-white uppercase">mm</span>
 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1">Daily Max</span>
 </div>
 </div>
 </div>
 </div>
 );
};

export default DailyRainfallMatrix;
