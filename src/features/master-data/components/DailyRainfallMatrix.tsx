import React, { useMemo } from 'react';
import type { DataHujan } from '@/stores/useHydrologyStore';
import { calculateYearCompleteness } from '@/lib/utils/qc/dailyCompletenessMath';
import { CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

interface DailyRainfallMatrixProps {
  data: DataHujan[];
  year: number;
  onCellClick?: (dateStr: string, currentVal: number | null) => void;
  onOpenInfillModal?: () => void;
}

export const DailyRainfallMatrix: React.FC<DailyRainfallMatrixProps> = ({ data, year, onCellClick, onOpenInfillModal }) => {
  const completeness = useMemo(() => calculateYearCompleteness(data, year), [data, year]);

  // Pre-calculate Matrix & Stats using useMemo for high performance
  const { matrix, monthlyStats, maxRainfall } = useMemo(() => {
    const grid: { val: number | null; isInfilled: boolean }[][] = Array.from(
      { length: 31 },
      () => Array.from({ length: 12 }, () => ({ val: null, isInfilled: false }))
    );

    let maxVal = 0;

    data.forEach((row) => {
      if (!row.tanggal) return;
      const [yyyy, mm, dd] = row.tanggal.split('-');
      const rowYear = parseInt(yyyy, 10);
      if (rowYear === year) {
        const month = parseInt(mm, 10) - 1;
        const day = parseInt(dd, 10) - 1;
        if (month >= 0 && month < 12 && day >= 0 && day < 31) {
          const rainfallVal = row.curah_hujan !== undefined && row.curah_hujan !== null ? row.curah_hujan : null;
          grid[day][month] = {
            val: rainfallVal,
            isInfilled: row.is_infilled || false,
          };
          if (rainfallVal !== null && rainfallVal > maxVal) {
            maxVal = rainfallVal;
          }
        }
      }
    });

    const stats = Array.from({ length: 12 }, () => ({
      jumlah: 0,
      maksimum: 0,
      minimum: Infinity,
      count: 0,
      hariHujan: 0,
      hujan1_15: 0,
      kosong1_15: 0,
      hujan16_31: 0,
      kosong16_31: 0,
    }));

    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      let hasData = false;
      let minVal = Infinity;
      let maxMonthVal = 0;

      for (let d = 0; d < daysInMonth; d++) {
        const { val } = grid[d][m];
        if (val !== null) {
          hasData = true;
          stats[m].jumlah += val;
          if (val > maxMonthVal) maxMonthVal = val;
          if (val < minVal) minVal = val;
          stats[m].count++;
          if (val > 0) stats[m].hariHujan++;

          if (d < 15) {
            stats[m].hujan1_15 += val;
          } else {
            stats[m].hujan16_31 += val;
          }
        } else {
          if (d < 15) {
            stats[m].kosong1_15++;
          } else {
            stats[m].kosong16_31++;
          }
        }
      }

      stats[m].maksimum = hasData ? maxMonthVal : 0;
      stats[m].minimum = hasData ? minVal : 0;
    }

    return {
      matrix: grid,
      monthlyStats: stats,
      maxRainfall: maxVal,
    };
  }, [data, year]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nop', 'Des'];

  const getCellClass = (val: number | null, isInfilled: boolean = false) => {
    if (val === null) {
      return 'text-slate-300 bg-slate-50/70 text-center font-mono select-none';
    }

    const infilledClass = isInfilled ? 'italic text-indigo-700 bg-indigo-50/80 font-medium' : '';

    if (val < 0) {
      return `${infilledClass} text-rose-600 font-bold bg-rose-50 text-right pr-2`;
    }
    if (val === 0) {
      return `${infilledClass} text-slate-400 bg-white text-right pr-2`;
    }
    if (val > 0 && val < 50) {
      return `${infilledClass} text-slate-800 bg-white text-right pr-2`;
    }
    if (val >= 50 && val < 150) {
      return `${infilledClass} bg-sky-50 text-sky-800 font-bold text-right pr-2`;
    }
    if (val >= 150 && val < 300) {
      return `${infilledClass} bg-amber-100 text-amber-900 font-extrabold text-right pr-2`;
    }
    if (val >= 300) {
      return `${infilledClass} bg-rose-100 text-rose-900 font-black text-right pr-2 ring-1 ring-inset ring-rose-400`;
    }

    return `${infilledClass} text-right pr-2`;
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* QC Kelengkapan Harian (WMO No. 168 / BMKG) */}
      <div className={`p-3 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-2.5 ${
        completeness.status === 'LENGKAP'
          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
          : completeness.status === 'CUKUP'
          ? 'bg-sky-50/80 border-sky-200 text-sky-900'
          : completeness.status === 'KURANG'
          ? 'bg-amber-50/80 border-amber-300 text-amber-900'
          : 'bg-rose-50/80 border-rose-300 text-rose-900'
      }`}>
        <div className="flex items-center gap-2 flex-wrap">
          {completeness.status === 'LENGKAP' || completeness.status === 'CUKUP' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          )}
          <span className="font-bold">
            Kelengkapan Data Harian Tahun {year}:
          </span>
          <span className="font-mono font-semibold">
            {completeness.recordedDays}/{completeness.totalDays} Hari ({completeness.completenessPercent}%)
          </span>
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
            completeness.status === 'LENGKAP'
              ? 'bg-emerald-100 text-emerald-800'
              : completeness.status === 'CUKUP'
              ? 'bg-sky-100 text-sky-800'
              : completeness.status === 'KURANG'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-rose-100 text-rose-800'
          }`}>
            {completeness.status === 'LENGKAP' && '✓ 100% Lengkap'}
            {completeness.status === 'CUKUP' && '✓ Standar WMO Terpenuhi (≥90%)'}
            {completeness.status === 'KURANG' && '⚠️ Kurang Lengkap (<90%)'}
            {completeness.status === 'KRITIS' && '⛔ Data Kritis (<75%)'}
          </span>
          {completeness.infilledDays > 0 && (
            <span className="text-[11px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-medium">
              Infilled: {completeness.infilledDays} Hari
            </span>
          )}
          {completeness.missingDays > 0 && (
            <span className="text-[11px] text-slate-600">
              (Hilang: <strong>{completeness.missingDays}</strong> hari, celah terpanjang: <strong>{completeness.maxConsecutiveMissing}</strong> hari)
            </span>
          )}
        </div>

        {completeness.missingDays > 0 && onOpenInfillModal && (
          <button
            type="button"
            onClick={onOpenInfillModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Infill Data Hilang ({completeness.missingDays} Hari)</span>
          </button>
        )}
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-md border border-slate-200">
        <span className="font-semibold text-slate-600">Keterangan:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300 inline-block text-center text-[10px] text-slate-400">0</span>
          <span className="text-slate-600">Hari Kering (0 mm)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-sky-50 border border-sky-300 inline-block" />
          <span className="text-slate-600">Lebat (50-150 mm)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-300 inline-block" />
          <span className="text-slate-600">Sangat Lebat (150-300 mm)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-rose-100 border border-rose-400 inline-block" />
          <span className="text-slate-600">Ekstrem (&gt; 300 mm)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-indigo-50 border border-indigo-300 inline-block" />
          <span className="text-slate-600">Infilled (Hasil Estimasi)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 inline-block text-center text-[10px] text-slate-400">-</span>
          <span className="text-slate-600">Data Kosong (Sensor Hilang)</span>
        </div>
      </div>

      <div
        className="overflow-x-auto overflow-y-auto max-h-[70vh] border border-slate-300 bg-white shadow-sm rounded-md"
        role="region"
        aria-label={`Matriks Curah Hujan Harian Tahun ${year}`}
        tabIndex={0}
      >
        <table className="w-full text-[11px] border-collapse min-w-[800px]">
          <caption className="sr-only">Data Curah Hujan Harian Tahun {year}</caption>
          <thead className="sticky top-0 z-30">
            <tr className="bg-slate-100 text-slate-800">
              <th
                scope="col"
                className="py-2 px-1.5 border border-slate-300 font-bold text-center w-12 sticky left-0 bg-slate-100 z-40 shadow-[1px_0_3px_rgba(0,0,0,0.06)]"
              >
                Tgl
              </th>
              {months.map((m, i) => (
                <th
                  scope="col"
                  key={i}
                  className="py-2 px-1 border border-slate-300 font-bold text-center min-w-[54px]"
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, dayIndex) => (
              <tr key={dayIndex} className="hover:bg-slate-50 transition-colors group">
                <th
                  scope="row"
                  className="py-1 px-1.5 border border-slate-300 font-bold text-slate-700 text-center sticky left-0 bg-slate-50 z-20 group-hover:bg-slate-100 shadow-[1px_0_3px_rgba(0,0,0,0.06)]"
                >
                  {dayIndex + 1}
                </th>
                {row.map((cell, monthIndex) => {
                  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                  const isValidDay = dayIndex + 1 <= daysInMonth;

                  if (!isValidDay) {
                    return (
                      <td
                        key={monthIndex}
                        className="py-1 px-1 border border-slate-200 bg-slate-100/60"
                        aria-hidden="true"
                      />
                    );
                  }

                  const { val, isInfilled } = cell;
                  const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayIndex + 1).padStart(2, '0')}`;
                  const ariaLabel =
                    val !== null
                      ? `Curah hujan tanggal ${dayIndex + 1} ${months[monthIndex]} ${year}: ${val.toFixed(1)} mm ${isInfilled ? '(infilled)' : ''}`
                      : `Data curah hujan tanggal ${dayIndex + 1} ${months[monthIndex]} ${year} kosong`;

                  return (
                    <td
                      key={monthIndex}
                      className={`py-1 border border-slate-200 tabular-nums ${getCellClass(val, isInfilled)} ${
                        onCellClick
                          ? 'cursor-pointer hover:bg-blue-50/70 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-600'
                          : ''
                      }`}
                      onClick={() => {
                        if (onCellClick) {
                          onCellClick(dateStr, val);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (onCellClick && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          onCellClick(dateStr, val);
                        }
                      }}
                      role={onCellClick ? 'button' : 'cell'}
                      tabIndex={onCellClick ? 0 : undefined}
                      aria-label={ariaLabel}
                      title={isInfilled ? 'Data ini diestimasi otomatis (Infilled)' : undefined}
                    >
                      {val !== null ? val.toFixed(1) : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
              <th
                scope="row"
                className="py-1.5 px-1.5 border border-slate-300 text-slate-800 text-left sticky left-0 bg-slate-100 z-20 shadow-[1px_0_3px_rgba(0,0,0,0.06)]"
              >
                Hujan Maks.
              </th>
              {monthlyStats.map((stat, i) => (
                <td
                  key={i}
                  className="py-1.5 border border-slate-300 tabular-nums text-right pr-2 text-slate-800"
                >
                  {stat.count > 0 ? stat.maksimum.toFixed(1) : '-'}
                </td>
              ))}
            </tr>
            <tr className="bg-slate-50 font-bold">
              <th
                scope="row"
                className="py-1.5 px-1.5 border border-slate-300 text-slate-800 text-left sticky left-0 bg-slate-100 z-20 shadow-[1px_0_3px_rgba(0,0,0,0.06)]"
              >
                Total Hujan
              </th>
              {monthlyStats.map((stat, i) => (
                <td
                  key={i}
                  className="py-1.5 border border-slate-300 tabular-nums text-right pr-2 text-slate-800"
                >
                  {stat.count > 0 ? stat.jumlah.toFixed(1) : '-'}
                </td>
              ))}
            </tr>
            <tr className="bg-slate-50 font-bold">
              <th
                scope="row"
                className="py-1.5 px-1.5 border border-slate-300 text-slate-800 text-left sticky left-0 bg-slate-100 z-20 shadow-[1px_0_3px_rgba(0,0,0,0.06)]"
              >
                Jml. Hari Hujan
              </th>
              {monthlyStats.map((stat, i) => (
                <td
                  key={i}
                  className="py-1.5 border border-slate-300 tabular-nums text-center text-slate-800"
                >
                  {stat.count > 0 ? stat.hariHujan : '-'}
                </td>
              ))}
            </tr>
            <tr className="bg-slate-50 font-bold">
              <th
                scope="row"
                className="py-1.5 px-1.5 border border-slate-300 text-slate-800 text-left sticky left-0 bg-slate-100 z-20 shadow-[1px_0_3px_rgba(0,0,0,0.06)]"
              >
                Hujan (1-15)
              </th>
              {monthlyStats.map((stat, i) => (
                <td
                  key={i}
                  className="py-1.5 border border-slate-300 tabular-nums text-right pr-2 text-slate-800"
                >
                  {stat.count > 0 ? stat.hujan1_15.toFixed(1) : '-'}
                </td>
              ))}
            </tr>
            <tr className="bg-slate-50 font-bold">
              <th
                scope="row"
                className="py-1.5 px-1.5 border border-slate-300 text-slate-800 text-left sticky left-0 bg-slate-100 z-20 shadow-[1px_0_3px_rgba(0,0,0,0.06)]"
              >
                Kosong (1-15)
              </th>
              {monthlyStats.map((stat, i) => (
                <td
                  key={i}
                  className="py-1.5 border border-slate-300 tabular-nums text-center text-slate-800"
                >
                  {stat.count > 0 ? stat.kosong1_15 : '-'}
                </td>
              ))}
            </tr>
            <tr className="bg-slate-50 font-bold">
              <th
                scope="row"
                className="py-1.5 px-1.5 border border-slate-300 text-slate-800 text-left sticky left-0 bg-slate-100 z-20 shadow-[1px_0_3px_rgba(0,0,0,0.06)]"
              >
                Hujan (16-31)
              </th>
              {monthlyStats.map((stat, i) => (
                <td
                  key={i}
                  className="py-1.5 border border-slate-300 tabular-nums text-right pr-2 text-slate-800"
                >
                  {stat.count > 0 ? stat.hujan16_31.toFixed(1) : '-'}
                </td>
              ))}
            </tr>
            <tr className="bg-slate-50 font-bold">
              <th
                scope="row"
                className="py-1.5 px-1.5 border border-slate-300 text-slate-800 text-left sticky left-0 bg-slate-100 z-20 shadow-[1px_0_3px_rgba(0,0,0,0.06)]"
              >
                Kosong (16-31)
              </th>
              {monthlyStats.map((stat, i) => (
                <td
                  key={i}
                  className="py-1.5 border border-slate-300 tabular-nums text-center text-slate-800"
                >
                  {stat.count > 0 ? stat.kosong16_31 : '-'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <span className="font-semibold text-slate-700">Rekapitulasi Hujan Maksimum Tahunan</span>
        <span
          className="text-lg font-bold text-blue-700 tabular-nums"
          aria-label={`Hujan maksimum tahunan: ${maxRainfall.toFixed(1)} milimeter`}
        >
          {maxRainfall.toFixed(1)} mm
        </span>
      </div>
    </div>
  );
};

export default DailyRainfallMatrix;
