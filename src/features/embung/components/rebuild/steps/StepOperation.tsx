import { useState } from 'react';
import { Button } from "@/components/ui/Button";
import { useEmbungStore } from '../../../hooks/useEmbungStore';
import { calculateReservoirOperation } from '@/lib/engine/embungEngine';
import { Calculator, TrendingUp, Droplet, Waves, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { Area, AreaChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS } from '@/lib/constants/chartColors';

export const StepOperation: React.FC = () => {
  const { state, dispatch } = useEmbungStore();
  const [inputs, setInputs] = useState(
    state.waterBalanceSteps.length > 0 ? state.waterBalanceSteps :
    ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map(() => ({
      inflow: 50000,
      demand: 30000,
      evaporation: 120,
      rainfall: 150
    }))
  );

  const handleInputChange = (index: number, field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newInputs = [...inputs];
    (newInputs[index] as any)[field] = numValue;
    setInputs(newInputs);
    // Sync store on change
    dispatch({ type: 'SET_WATER_BALANCE_STEPS', payload: newInputs });
  };

  const handleCalculate = () => {
    if (!state.stageStorageCurve) {
      toast.error("Lengkapi data Geometri (Langkah 1) terlebih dahulu!");
      return;
    }

    const maxStorage = state.stageStorageCurve.storage[state.stageStorageCurve.storage.length - 1];
    const deadStorage = state.stageStorageCurve.storage[0];
    const initialStorage = maxStorage * 0.8; // Assume 80% initially
    const surfaceArea = state.stageStorageCurve.area[state.stageStorageCurve.area.length - 1];

    try {
      const result = calculateReservoirOperation(
        {
          maxStorage,
          deadStorage,
          initialStorage,
          surfaceArea,
        },
        inputs
      );
      dispatch({ type: 'SET_WATER_BALANCE_RESULT', payload: result });
      toast.success('Simulasi Pola Operasi Selesai.');
    } catch (error: any) {
      toast.error(`Gagal: ${error.message}`);
    }
  };

  const chartData = state.waterBalanceResult?.steps.map((s, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][i],
    storage: s.storageEnd,
    status: s.status
  })) ?? null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-75">
      {/* Flattened Header Alert */}
      <div className="flex items-start gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 border-l-4 border-l-pupr-blue border-y border-r border-slate-200 dark:border-slate-700">
        <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
          <TrendingUp className="w-5 h-5 text-pupr-blue" />
        </div>
        <div>
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Simulasi Operasi Waduk</h3>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Neraca Air Bulanan (Reliability Analysis)</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Mengevaluasi performa tampungan dalam memenuhi kebutuhan air sepanjang tahun. Memperhitungkan kontribusi hujan langsung dan kehilangan akibat penguapan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Matrix Table */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-fit overflow-hidden">
          <div className="py-3 px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-pupr-blue" />
              <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Data Input Bulanan</h3>
            </div>
            <Button 
              size="sm" 
              onClick={handleCalculate} 
              className="bg-pupr-blue hover:bg-slate-800 text-white h-7 text-[10px] font-black uppercase tracking-widest rounded-none"
            >
              <Zap className="w-3 h-3 mr-2 text-pupr-yellow" /> Jalankan
            </Button>
          </div>
          
          <div className="overflow-auto max-h-[600px]">
            <table className="w-full text-left table-fixed border-collapse">
              <thead className="bg-slate-50/30 dark:bg-slate-800/30 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 w-16">Bln</th>
                  <th className="px-1 py-3 border-b border-slate-100 dark:border-slate-800 text-right">Inflow (m³)</th>
                  <th className="px-1 py-3 border-b border-slate-100 dark:border-slate-800 text-right">Demand (m³)</th>
                  <th className="px-1 py-3 border-b border-slate-100 dark:border-slate-800 text-right pr-4">Hujan/Evap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map((m, i) => (
                  <tr key={i} className="hover:bg-pupr-surface transition-colors group">
                    <td className="px-4 py-1 text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      {m}
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        value={inputs[i].inflow}
                        className="w-full bg-transparent border-none text-[11px] font-bold tabular-nums tracking-tight text-right text-slate-700 dark:text-slate-300 outline-none px-1 py-1 transition-all focus:text-pupr-blue"
                        onChange={(e) => handleInputChange(i, 'inflow', e.target.value)}
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        value={inputs[i].demand}
                        className="w-full bg-transparent border-none text-[11px] font-bold tabular-nums tracking-tight text-right text-slate-700 dark:text-slate-300 outline-none px-1 py-1 transition-all focus:text-pupr-blue"
                        onChange={(e) => handleInputChange(i, 'demand', e.target.value)}
                      />
                    </td>
                    <td className="px-1 py-1 pr-4">
                      <div className="flex flex-col gap-0.5">
                        <input
                          type="number"
                          value={inputs[i].rainfall}
                          title="Curah Hujan (mm)"
                          className="w-full bg-transparent border-none text-[10px] font-bold tabular-nums tracking-tight text-right text-emerald-600 dark:text-emerald-400 outline-none px-1 py-0.5"
                          onChange={(e) => handleInputChange(i, 'rainfall', e.target.value)}
                        />
                        <input
                          type="number"
                          value={inputs[i].evaporation}
                          title="Evaporasi (mm)"
                          className="w-full bg-transparent border-none text-[10px] font-bold tabular-nums tracking-tight text-right text-rose-500 dark:text-rose-400 outline-none px-1 py-0.5"
                          onChange={(e) => handleInputChange(i, 'evaporation', e.target.value)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Analysis Panel */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 relative overflow-hidden group">
              <Waves className="absolute -right-6 -bottom-6 w-24 h-24 text-blue-500/10 group-hover:text-blue-500/20 transition-all duration-700 rotate-12" />
              <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1.5 flex items-center gap-1.5">
                Keandalan Layanan (Reliability)
                <CheckCircle2 className="w-3 h-3 text-blue-500" />
              </p>
              <h3 className="text-4xl font-black text-blue-400 tabular-nums !leading-none">
                {state.waterBalanceResult ? `${state.waterBalanceResult.reliability.toFixed(1)}%` : '0.0%'}
              </h3>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
              <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1.5 flex items-center gap-1.5">
                Total Defisit Kumulatif
                <AlertCircle className="w-3 h-3 text-rose-500" />
              </p>
              <div className="flex items-baseline gap-1.5">
                <h3 className={`text-2xl font-black tabular-nums !leading-none ${state.waterBalanceResult?.totalDeficit ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                  {state.waterBalanceResult?.totalDeficit.toLocaleString('id-ID') ?? '0'}
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">m³</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col h-[400px]">
             <div className="py-3 px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
              <Droplet className="w-4 h-4 text-pupr-blue" />
              <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Fluktuasi Tampungan Waduk</h3>
            </div>

            <div className="flex-1 p-6">
              {!chartData ? (
                <div className="w-full h-full border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-slate-300 gap-3 grayscale opacity-40">
                  <Waves className="w-12 h-12" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jalankan Simulasi Hasil</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.supply} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={CHART_COLORS.supply} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_COLORS.gridLine} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: CHART_COLORS.axisLine, fontWeight: 700 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: CHART_COLORS.axisLine, fontWeight: 700 }}
                      label={{ value: 'Volume (m³)', angle: -90, position: 'insideLeft', fontSize: 10, fill: CHART_COLORS.axisLine, fontWeight: 700 }}
                    />
                    <Tooltip 
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
                      iconType="rect" 
                      iconSize={10}
                      wrapperStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }} 
                    />

                    {state.stageStorageCurve && (
                      <ReferenceLine
                        y={state.stageStorageCurve.storage[state.stageStorageCurve.storage.length - 1]}
                        stroke={CHART_COLORS.gridLine}
                        strokeDasharray="5 5"
                        label={{ 
                          value: 'MAN (Muka Air Normal)', 
                          position: 'insideTopRight', 
                          fontSize: 9, 
                          fill: CHART_COLORS.axisLine, 
                          fontWeight: 800
                        }}
                      />
                    )}
                    {state.stageStorageCurve && (
                      <ReferenceLine
                        y={state.stageStorageCurve.storage[0]}
                        stroke={CHART_COLORS.danger}
                        strokeDasharray="3 3"
                        label={{ 
                          value: 'TAMPUNGAN MATI', 
                          position: 'insideBottomRight', 
                          fontSize: 9, 
                          fill: CHART_COLORS.danger, 
                          fontWeight: 800
                        }}
                      />
                    )}

                    <Area
                      type="stepAfter"
                      dataKey="storage"
                      name="Volume Tampungan"
                      stroke={CHART_COLORS.supply}
                      fill="url(#colorStorage)"
                      strokeWidth={2.5}
                      isAnimationActive={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            
            {/* Status Indicator Strip */}
            {state.waterBalanceResult && (
              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 grid grid-cols-12 gap-1.5 ">
                {state.waterBalanceResult.steps.map((step, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 transition-all duration-300",
                      step.status === 'deficit' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]" :
                      step.status === 'spill' ? "bg-amber-400" : "bg-emerald-500"
                    )}
                    title={`${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][i]}: ${step.status.toUpperCase()}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
