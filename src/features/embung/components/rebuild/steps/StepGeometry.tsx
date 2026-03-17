import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/Button";
import { useEmbungStore } from '../../../hooks/useEmbungStore';
import { Plus, Trash2, Info, AreaChart as ChartIcon, FileSpreadsheet } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, Line } from 'recharts';

interface CurveRow {
  id: string;
  elevation: number;
  storage: number;
  area: number;
}

const DEFAULT_ROWS: CurveRow[] = [
  { id: '1', elevation: 100, storage: 0, area: 0 },
  { id: '2', elevation: 101, storage: 50000, area: 10000 },
  { id: '3', elevation: 102, storage: 120000, area: 22000 },
  { id: '4', elevation: 103, storage: 210000, area: 35000 },
  { id: '5', elevation: 104, storage: 320000, area: 50000 },
  { id: '6', elevation: 105, storage: 450000, area: 67000 },
];

export const StepGeometry: React.FC = () => {
  const { state, dispatch } = useEmbungStore();
  const [rows, setRows] = useState<CurveRow[]>(
    state.stageStorageCurve ? 
    state.stageStorageCurve.elevation.map((e: number, i: number) => ({
      id: String(i),
      elevation: e,
      storage: state.stageStorageCurve!.storage[i],
      area: state.stageStorageCurve!.area[i]
    })) : DEFAULT_ROWS
  );

  const handleAddRow = () => {
    const lastRow = rows[rows.length - 1];
    setRows([...rows, {
      id: String(Date.now()),
      elevation: lastRow ? lastRow.elevation + 1 : 100,
      storage: lastRow ? lastRow.storage + 50000 : 0,
      area: lastRow ? lastRow.area + 10000 : 0
    }]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length > 2) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const handleChange = (id: string, field: keyof CurveRow, val: string) => {
    const numVal = parseFloat(val) || 0;
    setRows(rows.map(r => r.id === id ? { ...r, [field]: numVal } : r));
  };

  // Auto-save to store
  useEffect(() => {
    const sortedRows = [...rows].sort((a, b) => a.elevation - b.elevation);
    dispatch({
      type: 'SET_STAGE_STORAGE_CURVE',
      payload: {
        elevation: sortedRows.map(r => r.elevation),
        storage: sortedRows.map(r => r.storage),
        area: sortedRows.map(r => r.area)
      }
    });
  }, [rows, dispatch]);

  const chartData = [...rows].sort((a, b) => a.elevation - b.elevation);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-75">
      {/* Flattened Alert Section */}
      <div className="flex items-start gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 border-l-4 border-l-pupr-yellow border-y border-r border-slate-200 dark:border-slate-700">
        <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none shrink-0">
          <Info className="w-5 h-5 text-pupr-blue" />
        </div>
        <div>
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Pedoman Teknis</h3>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Karakteristik Waduk (Geometri)</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Input hubungan antara elevasi muka air, volume tampungan, dan luas genangan sesuai dengan **Pd T-07-2004-A**. Data ini merupakan dasar utama untuk seluruh perhitungan kapasitas, routing, dan operasi waduk.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table Input Container */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-fit overflow-hidden">
          <div className="py-3 px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-pupr-blue" />
              <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Data Kurva Kapasitas</h3>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 text-[10px] uppercase font-black tracking-widest border-slate-300 dark:border-slate-600 rounded-none bg-white dark:bg-slate-900 hover:bg-slate-50" 
              onClick={handleAddRow}
            >
              <Plus className="w-3 h-3 mr-1.5" /> Baris Baru
            </Button>
          </div>
          
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-left table-fixed border-collapse">
              <thead className="bg-slate-50/30 dark:bg-slate-800/30 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 w-1/3">Elevasi (m)</th>
                  <th className="px-2 py-3 border-b border-slate-100 dark:border-slate-800 text-right w-[30%]">Vol (m³)</th>
                  <th className="px-2 py-3 border-b border-slate-100 dark:border-slate-800 text-right w-[30%]">Luas (m²)</th>
                  <th className="w-10 border-b border-slate-100 dark:border-slate-800 text-center pr-2">
                    <Trash2 className="w-3.5 h-3.5 mx-auto opacity-30" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-pupr-surface group transition-colors">
                    <td className="px-5 py-2">
                      <input
                        type="number"
                        value={row.elevation}
                        className="w-full bg-transparent border-none text-[12px] font-bold tabular-nums tracking-tight text-slate-700 dark:text-slate-300 outline-none hover:bg-white dark:hover:bg-slate-800 px-1 py-1 transition-all focus:text-pupr-blue"
                        onChange={(e) => handleChange(row.id, 'elevation', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={row.storage}
                        className="w-full bg-transparent border-none text-[12px] font-bold tabular-nums tracking-tight text-right text-slate-700 dark:text-slate-300 outline-none hover:bg-white dark:hover:bg-slate-800 px-1 py-1 transition-all focus:text-pupr-blue"
                        onChange={(e) => handleChange(row.id, 'storage', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={row.area}
                        className="w-full bg-transparent border-none text-[12px] font-bold tabular-nums tracking-tight text-right text-slate-700 dark:text-slate-300 outline-none hover:bg-white dark:hover:bg-slate-800 px-1 py-1 transition-all focus:text-pupr-blue"
                        onChange={(e) => handleChange(row.id, 'area', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2 text-center pr-2">
                      <button
                        className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        onClick={() => handleRemoveRow(row.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visualization Area */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0 h-[480px] flex flex-col">
            <div className="py-3 px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-pupr-blue" />
              <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Visualisasi Lengkung Kapasitas</h3>
            </div>
            
            <div className="flex-1 p-6">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="elevation"
                    type="number"
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 10, fill: '#0EA5E9' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10, fill: '#8B5CF6' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '0px', border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: '11px', fontWeight: 'bold' }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="storage"
                    name="Volume (m³)"
                    fill="#0EA5E9"
                    stroke="#0284C7"
                    fillOpacity={0.05}
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="area"
                    name="Luas Genangan (m²)"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-pupr-surface border border-pupr-border flex flex-col justify-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Titik Data</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-pupr-blue tabular-nums">{rows.length}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Input</span>
              </div>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 flex flex-col justify-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Volume Maksimum</span>
              <div className="flex items-baseline gap-1 font-black text-white tabular-nums">
                <span className="text-2xl leading-none">{(rows[rows.length - 1]?.storage / 1000000).toFixed(3)}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-tight">Juta m³</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
