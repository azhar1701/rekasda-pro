import { useState } from 'react';
import { Button } from "@/components/ui/Button";
import { useEmbungStore } from '../../../hooks/useEmbungStore';
import { calculateFloodRouting } from '@/lib/engine/embungEngine';
import { Activity, ArrowDownRight, CheckCircle, Info, Zap } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { toast } from '@/hooks/useToast';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, ReferenceLine } from 'recharts';
import { CHART_COLORS } from '@/lib/constants/chartColors';

const DEFAULT_HYDROGRAPH = [
  { time: 0, discharge: 0 },
  { time: 1, discharge: 15 },
  { time: 2, discharge: 45 },
  { time: 3, discharge: 120 },
  { time: 4, discharge: 85 },
  { time: 5, discharge: 50 },
  { time: 6, discharge: 25 },
  { time: 7, discharge: 10 },
  { time: 8, discharge: 0 },
];

export const StepRouting: React.FC = () => {
  const { state, dispatch } = useEmbungStore();
  const { hasilBanjir } = useHydrologyStore();

  const [hydrograph, setHydrograph] = useState(
    state.routingInput?.inflowHydrograph ??
    (hasilBanjir?.hidrograf?.length ?
      hasilBanjir.hidrograf.map(h => ({ time: h.time, discharge: h.inflow })) :
      DEFAULT_HYDROGRAPH)
  );

  const isAutoFilled = Boolean(hasilBanjir?.hidrograf?.length);

  const handleInflowChange = (index: number, val: string) => {
    const newHydro = [...hydrograph];
    newHydro[index].discharge = parseFloat(val) || 0;
    setHydrograph(newHydro);
  };

  const handleCalculate = () => {
    if (!state.stageStorageCurve) {
      toast.error("Lengkapi data Geometri (Langkah 1) terlebih dahulu!");
      return;
    }

    try {
      const spillwayCrest = state.stageStorageCurve.elevation[0];
      const stageDischargeCurve = {
        elevation: state.stageStorageCurve.elevation,
        discharge: state.stageStorageCurve.elevation.map((e) => {
          const h = e - spillwayCrest;
          return h > 0 ? 2.0 * Math.pow(h, 1.5) * 10 : 0; // Simplified weir formula Q = C*L*H^1.5
        })
      };

      const result = calculateFloodRouting({
        inflowHydrograph: hydrograph,
        stageStorageCurve: state.stageStorageCurve,
        stageDischargeCurve: stageDischargeCurve,
        deltaT: 3600,
        initialElevation: spillwayCrest
      });

      dispatch({ type: 'SET_ROUTING_RESULT', payload: result });
      dispatch({ type: 'SET_ROUTING_INPUT', payload: { inflowHydrograph: hydrograph } });
      toast.success('Simulasi Routing Berhasil.');
    } catch (error: any) {
      toast.error(`Kalkulasi Gagal: ${error.message}`);
    }
  };

  const chartData = state.routingResult?.steps.map(s => ({
    time: s.time,
    inflow: s.inflowAvg,
    outflow: s.outflow,
    elevation: s.elevation
  })) ?? null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-75">
      {/* Flattened Information Header */}
      <div className="flex items-start gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 border-l-4 border-l-pupr-blue border-y border-r border-slate-200 dark:border-slate-700">
        <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
          <Info className="w-5 h-5 text-pupr-blue" />
        </div>
        <div>
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Analisis Penelusuran Banjir</h3>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Kapasitas Pelimpah & Muka Air Banjir</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Verifikasi keamanan struktur terhadap debit banjir rencana. Mengevaluasi efek redaman (attenuation) tampungan waduk dan menentukan TMA (Tinggi Muka Air) maksimum.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Inflow Matrix */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-fit overflow-hidden">
          <div className="py-3 px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-pupr-blue" />
              <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Inflow Hydrograph</h3>
            </div>
            <Button 
              size="sm" 
              onClick={handleCalculate} 
              className="bg-pupr-blue hover:bg-slate-800 text-white h-7 text-[10px] font-black uppercase tracking-widest rounded-none"
            >
              <Zap className="w-3 h-3 mr-2 text-pupr-yellow" /> Simulasi
            </Button>
          </div>
          
          <div className="overflow-auto max-h-[600px]">
            {isAutoFilled && (
              <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Data Terintegrasi Modul Banjir</span>
              </div>
            )}
            <table className="w-full text-left table-fixed border-collapse">
              <thead className="bg-slate-50/30 dark:bg-slate-800/30 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 w-1/3">Waktu (Jam)</th>
                  <th className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-right pr-5">Debit (m³/s)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {hydrograph.map((row, idx) => (
                  <tr key={idx} className="hover:bg-pupr-surface transition-colors">
                    <td className="px-5 py-2.5 text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      T + {row.time}
                    </td>
                    <td className="px-5 py-2 pr-5">
                      <input
                        type="number"
                        value={row.discharge}
                        readOnly={isAutoFilled}
                        className={`w-full bg-transparent border-none text-[12px] font-bold tabular-nums tracking-tight text-right text-slate-700 dark:text-slate-300 outline-none px-1 py-1 transition-all ${isAutoFilled ? 'cursor-default' : 'hover:bg-white dark:hover:bg-slate-800 focus:text-pupr-blue'}`}
                        onChange={(e) => handleInflowChange(idx, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results & Visuals */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Engineering Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Peak Inflow (Q-In)</p>
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-2xl font-black text-slate-700 dark:text-slate-100 tabular-nums">
                  {state.routingResult?.peakInflow.toFixed(3) ?? '0.000'}
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">m³/s</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border border-pupr-blue p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-pupr-blue opacity-5 -mr-8 -mt-8 rotate-45" />
              <p className="text-[10px] font-black text-pupr-blue uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                Peak Outflow (Q-Out)
                <ArrowDownRight className="w-3 h-3" />
              </p>
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-2xl font-black text-pupr-blue tabular-nums">
                  {state.routingResult?.peakOutflow.toFixed(3) ?? '0.000'}
                </h3>
                <span className="text-[10px] font-bold text-pupr-blue/50 uppercase">m³/s</span>
              </div>
            </div>

            <div className={`p-5 border ${state.routingResult ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800'}`}>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5">Reduksi Debit</p>
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-2xl font-black text-indigo-600 tabular-nums">
                  {state.routingResult ? `${(state.routingResult.attenuationRatio * 100).toFixed(1)}%` : '0.0%'}
                </h3>
                <CheckCircle className={`w-4 h-4 text-indigo-400 ${!state.routingResult && 'opacity-0'}`} />
              </div>
            </div>
          </div>

          {/* Graphical Visualization Area */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col h-[450px]">
            <div className="py-3 px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
              <Activity className="w-4 h-4 text-pupr-blue" />
              <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Hidrograf Penelusuran Banjir</h3>
            </div>
            
            <div className="flex-1 p-6">
              {!chartData ? (
                <div className="w-full h-full border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-slate-300 gap-3 grayscale opacity-40">
                  <Activity className="w-12 h-12" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jalankan Simulasi untuk Visualisasi</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_COLORS.gridLine} />
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: CHART_COLORS.axisLine, fontWeight: 700 }}
                      label={{ value: 'Waktu (Jam)', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: CHART_COLORS.axisLine, fontWeight: 700 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: CHART_COLORS.axisLine, fontWeight: 700 }}
                      label={{ value: 'Debit (m³/s)', angle: -90, position: 'insideLeft', fontSize: 10, fill: CHART_COLORS.axisLine, fontWeight: 700 }}
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
                      cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      iconType="rect" 
                      iconSize={10}
                      wrapperStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }} 
                    />
                    <ReferenceLine y={0} stroke={CHART_COLORS.axisLine} />
                    
                    <Area
                      type="monotone"
                      dataKey="inflow"
                      name="Inflow (Masuk)"
                      stroke={CHART_COLORS.baseflow}
                      fill={CHART_COLORS.baseflow}
                      fillOpacity={0.1}
                      strokeDasharray="4 4"
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="outflow"
                      name="Outflow (Keluar)"
                      stroke={CHART_COLORS.hydrograph}
                      fill={CHART_COLORS.hydrograph}
                      fillOpacity={0.15}
                      strokeWidth={3}
                      isAnimationActive={true}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
            
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-slate-400 border border-slate-500 border-dashed" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Inflow Murni</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-pupr-blue" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Outflow Routed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
