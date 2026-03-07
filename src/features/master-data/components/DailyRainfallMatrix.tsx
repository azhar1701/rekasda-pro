import React from 'react';

interface DailyRainfallMatrixProps {
    data: any[];
    year: number;
    onCellClick?: (dateStr: string, currentVal: number | null) => void;
}

export const DailyRainfallMatrix: React.FC<DailyRainfallMatrixProps> = ({ data, year, onCellClick }) => {
    const matrix: (number | null)[][] = Array.from({ length: 31 }, () => Array(12).fill(null));
    
    data.forEach(row => {
        const [yyyy, mm, dd] = row.tanggal.split('-');
        const rowYear = parseInt(yyyy, 10);
        if (rowYear === year) {
            const month = parseInt(mm, 10) - 1;
            const day = parseInt(dd, 10) - 1;
            matrix[day][month] = row.curah_hujan;
        }
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nop', 'Des'];

    let maxRainfall = 0;
    data.forEach(row => {
        const [yyyy] = row.tanggal.split('-');
        const rowYear = parseInt(yyyy, 10);
        if (rowYear === year && row.curah_hujan > maxRainfall) {
            maxRainfall = row.curah_hujan;
        }
    });

    const monthlyStats = Array.from({ length: 12 }, () => ({
        jumlah: 0,
        maksimum: -Infinity,
        minimum: Infinity,
        count: 0,
        hariHujan: 0,
        hujan1_15: 0,
        kosong1_15: 0,
        hujan16_31: 0,
        kosong16_31: 0
    }));

    for (let m = 0; m < 12; m++) {
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        let hasData = false;
        for (let d = 0; d < daysInMonth; d++) {
            const val = matrix[d][m];
            if (val !== null) {
                hasData = true;
                monthlyStats[m].jumlah += val;
                if (val > monthlyStats[m].maksimum) monthlyStats[m].maksimum = val;
                if (val < monthlyStats[m].minimum) monthlyStats[m].minimum = val;
                monthlyStats[m].count++;
                if (val > 0) monthlyStats[m].hariHujan++;
                
                if (d < 15) {
                    monthlyStats[m].hujan1_15 += val;
                } else {
                    monthlyStats[m].hujan16_31 += val;
                }
            } else {
                if (d < 15) {
                    monthlyStats[m].kosong1_15++;
                } else {
                    monthlyStats[m].kosong16_31++;
                }
            }
        }
        if (!hasData) {
            monthlyStats[m].maksimum = 0;
            monthlyStats[m].minimum = 0;
        }
    }

    const getCellClass = (val: number | null) => {
        if (val === null) return 'text-slate-400 text-center';
        if (val < 0) return 'text-red-500 font-bold bg-red-50 text-right pr-2';
        if (val === 0) return 'text-slate-400 text-right pr-2';
        if (val > 0 && val < 50) return 'text-slate-800 text-right pr-2';
        if (val >= 50 && val < 300) return 'bg-blue-100 text-pupr-blue font-bold text-right pr-2';
        if (val >= 300) return 'bg-red-100 text-red-700 font-bold text-right pr-2';
        return 'text-right pr-2';
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            <div 
                className="overflow-x-auto overflow-y-auto max-h-[70vh] border-2 border-slate-500 bg-white shadow-sm rounded-sm"
                role="region"
                aria-label={`Matriks Curah Hujan Harian Tahun ${year}`}
                tabIndex={0}
            >
                <table className="w-full text-[11px] border-collapse min-w-[800px]">
                    <caption className="sr-only">Data Curah Hujan Harian Tahun {year}</caption>
                    <thead className="sticky top-0 z-30">
                        <tr className="bg-slate-200 text-slate-800">
                            <th scope="col" className="py-1.5 px-1 border border-slate-500 font-bold text-center w-12 sticky left-0 bg-slate-200 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Tgl</th>
                            {months.map((m, i) => (
                                <th scope="col" key={i} className="py-1.5 px-1 border border-slate-500 font-bold text-center min-w-[50px]">{m}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.map((row, dayIndex) => (
                            <tr key={dayIndex} className="hover:bg-slate-50 transition-colors group">
                                <th scope="row" className="py-1 px-1.5 border border-slate-500 font-bold text-slate-700 text-center sticky left-0 bg-slate-100 z-20 group-hover:bg-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    {dayIndex + 1}
                                </th>
                                {row.map((val, monthIndex) => {
                                    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                                    const isValidDay = dayIndex + 1 <= daysInMonth;
                                    
                                    if (!isValidDay) {
                                        return <td key={monthIndex} className="py-1 px-1.5 border border-slate-500 bg-slate-300" aria-hidden="true"></td>;
                                    }

                                    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayIndex + 1).padStart(2, '0')}`;
                                    const ariaLabel = val !== null 
                                        ? `Curah hujan tanggal ${dayIndex + 1} ${months[monthIndex]} ${year}: ${val.toFixed(1)} mm`
                                        : `Data curah hujan tanggal ${dayIndex + 1} ${months[monthIndex]} ${year} kosong`;

                                    return (
                                        <td 
                                            key={monthIndex} 
                                            className={`py-1 border border-slate-500 tabular-nums ${getCellClass(val)} ${onCellClick ? 'cursor-pointer hover:bg-teal-100 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pupr-blue' : ''}`}
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
                                            role={onCellClick ? "button" : "cell"}
                                            tabIndex={onCellClick ? 0 : undefined}
                                            aria-label={ariaLabel}
                                        >
                                            {val !== null ? val.toFixed(1) : '-'}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        <tr className="bg-slate-100 font-bold">
                            <th scope="row" className="py-1.5 px-1.5 border border-slate-500 text-slate-800 text-left sticky left-0 bg-slate-200 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Hujan Maximum</th>
                            {monthlyStats.map((stat, i) => (
                                <td key={i} className="py-1.5 border border-slate-500 tabular-nums text-right pr-2 text-slate-800" aria-label={`Hujan maksimum bulan ${months[i]}: ${stat.count > 0 ? stat.maksimum.toFixed(1) : 'kosong'} mm`}>
                                    {stat.count > 0 ? stat.maksimum.toFixed(1) : '-'}
                                </td>
                            ))}
                        </tr>
                        <tr className="bg-slate-100 font-bold">
                            <th scope="row" className="py-1.5 px-1.5 border border-slate-500 text-slate-800 text-left sticky left-0 bg-slate-200 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Jml Curah Hujan</th>
                            {monthlyStats.map((stat, i) => (
                                <td key={i} className="py-1.5 border border-slate-500 tabular-nums text-right pr-2 text-slate-800" aria-label={`Jumlah curah hujan bulan ${months[i]}: ${stat.count > 0 ? stat.jumlah.toFixed(1) : 'kosong'} mm`}>
                                    {stat.count > 0 ? stat.jumlah.toFixed(1) : '-'}
                                </td>
                            ))}
                        </tr>
                        <tr className="bg-slate-100 font-bold">
                            <th scope="row" className="py-1.5 px-1.5 border border-slate-500 text-slate-800 text-left sticky left-0 bg-slate-200 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Jml.Hari Hujan</th>
                            {monthlyStats.map((stat, i) => (
                                <td key={i} className="py-1.5 border border-slate-500 tabular-nums text-center text-slate-800" aria-label={`Jumlah hari hujan bulan ${months[i]}: ${stat.count > 0 ? stat.hariHujan : 'kosong'} hari`}>
                                    {stat.count > 0 ? stat.hariHujan : '-'}
                                </td>
                            ))}
                        </tr>
                        <tr className="bg-slate-100 font-bold">
                            <th scope="row" className="py-1.5 px-1.5 border border-slate-500 text-slate-800 text-left sticky left-0 bg-slate-200 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Hujan (1-15)</th>
                            {monthlyStats.map((stat, i) => (
                                <td key={i} className="py-1.5 border border-slate-500 tabular-nums text-right pr-2 text-slate-800" aria-label={`Hujan tanggal 1-15 bulan ${months[i]}: ${stat.count > 0 ? stat.hujan1_15.toFixed(1) : 'kosong'} mm`}>
                                    {stat.count > 0 ? stat.hujan1_15.toFixed(1) : '-'}
                                </td>
                            ))}
                        </tr>
                        <tr className="bg-slate-100 font-bold">
                            <th scope="row" className="py-1.5 px-1.5 border border-slate-500 text-slate-800 text-left sticky left-0 bg-slate-200 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Jml. data kosong</th>
                            {monthlyStats.map((stat, i) => (
                                <td key={i} className="py-1.5 border border-slate-500 tabular-nums text-center text-slate-800" aria-label={`Jumlah data kosong tanggal 1-15 bulan ${months[i]}: ${stat.count > 0 ? stat.kosong1_15 : 'kosong'} hari`}>
                                    {stat.count > 0 ? stat.kosong1_15 : '-'}
                                </td>
                            ))}
                        </tr>
                        <tr className="bg-slate-100 font-bold">
                            <th scope="row" className="py-1.5 px-1.5 border border-slate-500 text-slate-800 text-left sticky left-0 bg-slate-200 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Hujan (16-31)</th>
                            {monthlyStats.map((stat, i) => (
                                <td key={i} className="py-1.5 border border-slate-500 tabular-nums text-right pr-2 text-slate-800" aria-label={`Hujan tanggal 16-31 bulan ${months[i]}: ${stat.count > 0 ? stat.hujan16_31.toFixed(1) : 'kosong'} mm`}>
                                    {stat.count > 0 ? stat.hujan16_31.toFixed(1) : '-'}
                                </td>
                            ))}
                        </tr>
                        <tr className="bg-slate-100 font-bold">
                            <th scope="row" className="py-1.5 px-1.5 border border-slate-500 text-slate-800 text-left sticky left-0 bg-slate-200 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Jml. data kosong</th>
                            {monthlyStats.map((stat, i) => (
                                <td key={i} className="py-1.5 border border-slate-500 tabular-nums text-center text-slate-800" aria-label={`Jumlah data kosong tanggal 16-31 bulan ${months[i]}: ${stat.count > 0 ? stat.kosong16_31 : 'kosong'} hari`}>
                                    {stat.count > 0 ? stat.kosong16_31 : '-'}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="bg-white border border-slate-300 rounded-md p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="font-bold text-slate-700">Rekapitulasi Hujan Maksimum Tahunan</span>
                <span className="text-lg font-bold text-pupr-blue tabular-nums" aria-label={`Hujan maksimum tahunan: ${maxRainfall.toFixed(1)} milimeter`}>{maxRainfall.toFixed(1)} mm</span>
            </div>
        </div>
    );
};

export default DailyRainfallMatrix;
