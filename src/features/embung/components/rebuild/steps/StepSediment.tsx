import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/Button";
import { useEmbungStore } from '../../../hooks/useEmbungStore';
import { calculateSedimentYield } from '@/lib/engine/embungEngine';
import { Trash2, Plus, BarChart3, Clock, AlertTriangle, Zap, ScatterChart as ScatterIcon } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { CHART_COLORS } from '@/lib/constants/chartColors';

export const StepSediment: React.FC = () => {
  const { state, dispatch } = useEmbungStore();
  const { luasDas: hydroLuasDas } = useHydrologyStore();

  const [samples, setSamples] = useState(
    state.sedimentInput?.qData?.map((q, i) => ({
      id: String(i),
      q: q,
      qs: state.sedimentInput!.qsData![i]
    })) ?? [
      { id: '1', q: 0.5, qs: 0.1 },
      { id: '2', q: 1.2, qs: 0.4 },
      { id: '3', q: 2.5, qs: 1.1 },
      { id: '4', q: 5.0, qs: 2.8 },
      { id: '5', q: 8.5, qs: 6.2 },
    ]
  );

  const [params, setParams] = useState({
    luasDas: state.sedimentInput?.luasDas ?? (parseFloat(hydroLuasDas) || 15),
    beratJenis: state.sedimentInput?.beratJenis ?? 1.6,
    bedLoadPercentage: state.sedimentInput?.bedLoadPercentage ?? 15,
  });

  // Sync Luas DAS from store if it changes and hasn't been modified locally
  useEffect(() => {
    if (hydroLuasDas && !state.sedimentInput?.luasDas) {
      setParams(p => ({ ...p, luasDas: parseFloat(hydroLuasDas) || 15 }));
    }
  }, [hydroLuasDas, state.sedimentInput?.luasDas]);

  const handleAddSample = () => {
    setSamples([...samples, { id: String(Date.now()), q: 0, qs: 0 }]);
  };

  const handleRemoveSample = (id: string) => {
    if (samples.length > 2) {
      setSamples(samples.filter(s => s.id !== id));
    }
  };

  const handleSampleChange = (id: string, field: 'q' | 'qs', val: string) => {
    const numVal = parseFloat(val) || 0;
    setSamples(samples.map(s => s.id === id ? { ...s, [field]: numVal } : s));
  };

  const handleParamChange = (field: string, val: string) => {
    setParams({ ...params, [field]: parseFloat(val) || 0 });
  };

  const handleCalculate = () => {
    if (!state.stageStorageCurve) {
      toast.error("Lengkapi data Geometri (Langkah 1) terlebih dahulu!");
      return;
    }

    const reservoirCapacity = state.stageStorageCurve.storage[state.stageStorageCurve.storage.length - 1] * 1000000;

    try {
      const result = calculateSedimentYield({
        qData: samples.map(s => s.q),
        qsData: samples.map(s => s.qs),
        luasDas: params.luasDas,
        beratJenis: params.beratJenis,
        bedLoadPercentage: params.bedLoadPercentage,
        reservoirCapacity: reservoirCapacity,
        annualInflow: samples.reduce((a, b) => a + b.q, 0) * 86400 * 365, // Simplified annual inflow estimate
      });

      dispatch({ type: 'SET_SEDIMENT_RESULT', payload: result });
      dispatch({
        type: 'SET_SEDIMENT_INPUT', payload: {
          ...params,
          qData: samples.map(s => s.q),
          qsData: samples.map(s => s.qs)
        }
      });
      toast.success("Analisis Sedimentasi Selesai.");
    } catch (error: any) {
      toast.error(`Kalkulasi Gagal: ${error.message}`);
    }
  };

  const lifespanYears = state.sedimentResult && state.stageStorageCurve ?
    (state.stageStorageCurve.storage[0] * 1000000) / state.sedimentResult.trappedVolumeM3 : 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-75">
      {/* Flattened Header Alert */}
      <div className="flex items-start gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 border-l-4 border-l-pupr-blue border-y border-r border-slate-200 dark:border-slate-700">
        <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
          <AlertTriangle className="w-5 h-5 text-pupr-blue" />
        </div>
        <div>
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Analisis Sedimentasi</h3>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Laju Sedimentasi & Estimasi Umur Guna</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Memperkirakan volume sedimen yang masuk ke waduk untuk menentukan masa layan (teknis). Fokus pada pengisian tampungan mati (dead storage).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Samples Matrix */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-fit overflow-hidden">
          <div className="py-3 px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-pupr-blue" />
              <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Sampel Debit & Sedimen</h3>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleAddSample} className="h-7 text-[10px] font-black uppercase tracking-widest rounded-none border-slate-200 bg-white hover:bg-slate-50">
                + Item
              </Button>
              <Button 
                size="sm" 
                onClick={handleCalculate} 
                className="bg-pupr-blue hover:bg-slate-800 text-white h-7 text-[10px] font-black uppercase tracking-widest rounded-none"
              >
                <Zap className="w-3 h-3 mr-2 text-pupr-yellow" /> Analisa
              </Button>
            </div>
          </div>
          
          <div className="p-4 grid grid-cols-3 gap-3 bg-slate-50/50 border-b border-slate-100 dark:border-slate-800">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Luas DAS (km²)</label>
              <input 
                type="number" 
                value={params.luasDas} 
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-7 px-2 text-[11px] font-bold tabular-nums outline-none focus:ring-1 focus:ring-pupr-blue"
                onChange={(e) => handleParamChange('luasDas', e.target.value)} 
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Berat Jenis</label>
              <input 
                type="number" 
                step="0.1"
                value={params.beratJenis} 
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-7 px-2 text-[11px] font-bold tabular-nums outline-none focus:ring-1 focus:ring-pupr-blue"
                onChange={(e) => handleParamChange('beratJenis', e.target.value)} 
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Bed Load %</label>
              <input 
                type="number" 
                value={params.bedLoadPercentage} 
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-7 px-2 text-[11px] font-bold tabular-nums outline-none focus:ring-1 focus:ring-pupr-blue"
                onChange={(e) => handleParamChange('bedLoadPercentage', e.target.value)} 
              />
            </div>
          </div>

          <div className="overflow-auto max-h-[450px]">
            <table className="w-full text-left table-fixed border-collapse">
              <thead className="bg-slate-50/30 dark:bg-slate-800/30 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3 w-16 tracking-tighter">No</th>
                  <th className="px-1 py-3 text-right">Debit (Q)</th>
                  <th className="px-1 py-3 text-right">Sedimen (Qs)</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {samples.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-pupr-surface transition-colors group">
                    <td className="px-5 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      #{idx + 1}
                    </td>
                    <td className="px-1 py-2">
                       <input
                        type="number"
                        value={s.q}
                        className="w-full bg-transparent border-none text-[12px] font-bold tabular-nums tracking-tight text-right text-slate-700 dark:text-slate-300 outline-none px-1 py-1 transition-all focus:text-pupr-blue"
                        onChange={(e) => handleSampleChange(s.id, 'q', e.target.value)}
                      />
                    </td>
                    <td className="px-1 py-2">
                      <input
                        type="number"
                        value={s.qs}
                        className="w-full bg-transparent border-none text-[12px] font-bold tabular-nums tracking-tight text-right text-slate-700 dark:text-slate-300 outline-none px-1 py-1 transition-all focus:text-pupr-blue"
                        onChange={(e) => handleSampleChange(s.id, 'qs', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button 
                        onClick={() => handleRemoveSample(s.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Analysis Area */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 -mr-8 -mt-8 rotate-45" />
              <p className="text-[10px] font-black text-rose-500 tracking-widest uppercase mb-1.5 flex items-center gap-1.5">
                Estimasi Umur Guna (Technical Life)
                <Clock className="w-3 h-3" />
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black text-slate-900 dark:text-slate-100 tabular-nums !leading-none">
                  {lifespanYears > 0 ? lifespanYears.toFixed(0) : '-'}
                </h3>
                <span className="text-xs font-bold text-slate-400 uppercase">Tahun</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
              <p className="text-[10px] font-black text-pupr-blue tracking-widest uppercase mb-1.5 flex items-center gap-1.5">
                Laju Sedimen Tahunan
                <BarChart3 className="w-3 h-3" />
              </p>
              <div className="flex items-baseline gap-1.5 ">
                <h3 className="text-2xl font-black text-slate-700 dark:text-slate-300 tabular-nums">
                  {state.sedimentResult?.trappedVolumeM3.toLocaleString('id-ID', { maximumFractionDigits: 0 }) ?? '0'}
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">m³/thn</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col h-[400px]">
            <div className="py-3 px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
              <ScatterIcon className="w-4 h-4 text-pupr-blue" />
              <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Sediment Rating Curve (Q vs Qs)</h3>
            </div>

            <div className="flex-1 p-6">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_COLORS.gridLine} />
                  <XAxis 
                    type="number" 
                    dataKey="q" 
                    name="Debit" 
                    unit=" m³/s" 
                    tick={{ fontSize: 10, fill: CHART_COLORS.axisLine, fontWeight: 700 }} 
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'Debit (Q)', position: 'bottom', fontSize: 10, offset: 0, fill: CHART_COLORS.axisLine, fontWeight: 700 }} 
                  />
                  <YAxis 
                    type="number" 
                    dataKey="qs" 
                    name="Sedimen" 
                    unit=" ton" 
                    tick={{ fontSize: 10, fill: CHART_COLORS.axisLine, fontWeight: 700 }} 
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'Sedimen (Qs)', angle: -90, position: 'left', fontSize: 10, fill: CHART_COLORS.axisLine, fontWeight: 700 }} 
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3', stroke: '#94a3b8' }} 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: 'none', 
                      borderRadius: '0px', 
                      fontSize: '11px',
                      color: 'white',
                      fontWeight: '700'
                    }}
                    itemStyle={{ color: 'white' }} 
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle" 
                    wrapperStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }} 
                  />
                  <Scatter 
                    name="Data Observasi" 
                    data={samples} 
                    fill={CHART_COLORS.hydrograph} 
                    strokeWidth={2}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 ">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed italic">
                * Analisis menggunakan metode power regression untuk memodelkan hubungan antara debit aliran dan angkutan sedimen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
