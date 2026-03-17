import { useState } from 'react';
import { Button } from "@/components/ui/Button";
import { useEmbungStore } from '../../../hooks/useEmbungStore';
import { calculateSequentPeak } from '@/lib/engine/embungEngine';
import { Calculator, Table as TableIcon, Droplets, Spline, Waves, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, Line } from 'recharts';

export const StepCapacity: React.FC = () => {
  const { state, dispatch } = useEmbungStore();
  const [data, setData] = useState(state.capacityData);

  const handleInputChange = (id: string, field: 'inflow' | 'outflow', value: string) => {
    const numValue = parseFloat(value) || 0;
    const newData = data.map(row => row.id === id ? { ...row, [field]: numValue } : row);
    setData(newData);
    dispatch({ type: 'SET_CAPACITY_DATA', payload: newData });
  };

  const handleCalculate = () => {
    try {
      const result = calculateSequentPeak({
        inflow: data.map(r => r.inflow),
        outflow: data.map(r => r.outflow)
      });
      dispatch({ type: 'SET_CAPACITY_RESULT', payload: result });
      toast.success(`Kalkulasi Selesai. Tampungan Efektif: ${result.maxStorageRequired.toFixed(3)} Juta m³`);
    } catch (error: any) {
      toast.error(`Gagal menghitung: ${error.message}`);
    }
  };

  const chartData = state.capacityResult?.massCurveData ?? null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-75">
      {/* Flattened Header */}
      <div className="flex items-start gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 border-l-4 border-l-pupr-blue border-y border-r border-slate-200 dark:border-slate-700">
        <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
          <Droplets className="w-5 h-5 text-pupr-blue" />
        </div>
        <div>
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Analisis Kapasitas</h3>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Metode Rippl (Kumulatif Inflow-Demand)</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Menghitung volume tampungan efektif berdasarkan selisih kumulatif terbesar antara ketersediaan air (inflow) dan kebutuhan air (demand) sepanjang siklus tahunan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Matrix Container */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-fit overflow-hidden">
          <div className="py-3 px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-pupr-blue" />
              <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Input Inflow & Demand</h3>
            </div>
            <Button 
              size="sm" 
              onClick={handleCalculate} 
              className="bg-pupr-blue hover:bg-slate-800 text-white h-7 text-[10px] font-black uppercase tracking-widest rounded-none"
            >
              <Calculator className="w-3 h-3 mr-2" /> Kalkulasi
            </Button>
          </div>
          
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-left table-fixed border-collapse">
              <thead className="bg-slate-50/30 dark:bg-slate-800/30 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 w-1/4 tracking-tighter">Bulan</th>
                  <th className="px-2 py-3 border-b border-slate-100 dark:border-slate-800 text-right">Inflow (Mm³)</th>
                  <th className="px-2 py-3 border-b border-slate-100 dark:border-slate-800 text-right pr-5">Demand (Mm³)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((row) => (
                  <tr key={row.id} className="hover:bg-pupr-surface transition-colors">
                    <td className="px-5 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      {row.month}
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={row.inflow}
                        className="w-full bg-transparent border-none text-[12px] font-bold tabular-nums tracking-tight text-right text-slate-700 dark:text-slate-300 outline-none hover:bg-white dark:hover:bg-slate-800 px-1 py-1 transition-all focus:text-pupr-blue"
                        onChange={(e) => handleInputChange(row.id, 'inflow', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2 pr-5">
                      <input
                        type="number"
                        value={row.outflow}
                        className="w-full bg-transparent border-none text-[12px] font-bold tabular-nums tracking-tight text-right text-slate-700 dark:text-slate-300 outline-none hover:bg-white dark:hover:bg-slate-800 px-1 py-1 transition-all focus:text-pupr-blue"
                        onChange={(e) => handleInputChange(row.id, 'outflow', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workspace: Results & Graph */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Big Professional Metric */}
          <div className="p-6 bg-slate-900 border border-slate-800 relative overflow-hidden flex items-center justify-between">
            <Waves className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 opacity-20 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 leading-none">
                Volume Tampungan Efektif
              </p>
              <div className="flex items-baseline gap-2">
                <h1 className="text-5xl font-black text-white tracking-tighter tabular-nums leading-none">
                  {state.capacityResult?.maxStorageRequired.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) ?? '0.000'}
                </h1>
                <span className="text-sm font-black text-pupr-blue uppercase tracking-widest">Juta m³</span>
              </div>
            </div>
            {state.capacityResult && (
              <div className="relative z-10 px-4 py-2 border border-emerald-500/30 bg-emerald-500/10 hidden md:block">
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Status Engine</p>
                <p className="text-[11px] font-black text-white uppercase tracking-tight">Kalkulasi Stabil</p>
              </div>
            )}
          </div>

          {/* Graph Section */}
          <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col min-h-[400px]">
            <div className="py-3 px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Spline className="w-4 h-4 text-pupr-blue" />
                <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Grafik Kumulatif (Mass Curve)</h3>
              </div>
              {state.capacityResult && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-pupr-surface border border-pupr-border">
                  <Sparkles className="w-3 h-3 text-pupr-blue" />
                  <span className="text-[10px] font-black text-pupr-blue uppercase tracking-widest">Tersedia via Gemini</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 p-6 flex flex-col">
              {!chartData ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50 grayscale">
                  <Spline className="w-16 h-16" />
                  <p className="text-[11px] font-black uppercase tracking-[0.2em]">Klik Kalkulasi untuk Analisa</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '0px', border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} iconType="rect" />
                    <Area
                      type="monotone"
                      dataKey="cumulativeInflow"
                      name="Kumulatif Inflow"
                      fill="#0EA5E9"
                      stroke="#0284C7"
                      fillOpacity={0.05}
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulativeOutflow"
                      name="Kumulatif Demand"
                      stroke="#DC2626"
                      strokeWidth={3}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
