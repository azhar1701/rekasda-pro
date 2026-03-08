import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { useEmbungStore } from '../../../hooks/useEmbungStore';
import { calculateReservoirOperation } from '@/lib/engine/embungEngine';
import { Calculator, TrendingUp, Droplets, Waves } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { Area, AreaChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export const StepOperation: React.FC = () => {
    const { state, dispatch } = useEmbungStore();
    const [inputs, setInputs] = useState(
        state.waterBalanceSteps.length > 0 ? state.waterBalanceSteps :
            ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Des'].map(() => ({
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
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Des'][i],
        storage: s.storageEnd,
        status: s.status
    })) ?? null;

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-start gap-3 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <TrendingUp className="w-5 h-5 text-indigo-600 mt-1 shrink-0" />
                <div>
                    <h3 className="text-sm font-bold text-indigo-900">Simulasi Pola Operasi Waduk</h3>
                    <p className="text-xs text-indigo-800/80 mt-1 leading-relaxed">
                        Analisis neraca air bulanan untuk mengevaluasi keandalan waduk dalam melayani demand sepanjang tahun.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Input Table */}
                <Card className="lg:col-span-5 border-slate-200">
                    <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm">Data Bulanan</CardTitle>
                        <Button size="sm" onClick={handleCalculate} className="bg-pupr-blue hover:bg-teal-700 h-8 text-xs text-white">
                            <Calculator className="w-3 h-3 mr-2" /> Jalankan
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 overflow-auto max-h-[500px]">
                        <table className="w-full text-[10px] text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-10 border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-2">Bln</th>
                                    <th className="px-1 py-2 text-right">Inflow (m³)</th>
                                    <th className="px-1 py-2 text-right">Demand (m³)</th>
                                    <th className="px-1 py-2 text-right">Hujan (mm)</th>
                                    <th className="px-1 py-2 text-right">Evap (mm)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Des'].map((m, i) => (
                                    <tr key={i} className="hover:bg-slate-50 border-b border-slate-50 last:border-0">
                                        <td className="px-3 py-1 font-bold text-slate-400">{m}</td>
                                        <td className="px-1 py-1">
                                            <Input
                                                type="number"
                                                value={inputs[i].inflow}
                                                className="h-7 text-right border-transparent hover:border-slate-200 focus:bg-white text-[10px]"
                                                onChange={(e) => handleInputChange(i, 'inflow', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-1 py-1">
                                            <Input
                                                type="number"
                                                value={inputs[i].demand}
                                                className="h-7 text-right border-transparent hover:border-slate-200 focus:bg-white text-[10px]"
                                                onChange={(e) => handleInputChange(i, 'demand', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-1 py-1">
                                            <Input
                                                type="number"
                                                value={inputs[i].rainfall}
                                                className="h-7 text-right border-transparent hover:border-slate-200 focus:bg-white text-[10px]"
                                                onChange={(e) => handleInputChange(i, 'rainfall', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-1 py-1">
                                            <Input
                                                type="number"
                                                value={inputs[i].evaporation}
                                                className="h-7 text-right border-transparent hover:border-slate-200 focus:bg-white text-[10px]"
                                                onChange={(e) => handleInputChange(i, 'evaporation', e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Tracking & Summary */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 bg-slate-800 text-white relative overflow-hidden">
                            <Waves className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5" />
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Keandalan Waduk</p>
                            <h3 className="text-3xl font-extrabold text-blue-400">
                                {state.waterBalanceResult ? `${state.waterBalanceResult.reliability.toFixed(1)}%` : '-'}
                            </h3>
                        </Card>
                        <Card className="p-4 border-slate-200 flex flex-col justify-center">
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Defisit Total</p>
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-2xl font-bold text-rose-500">
                                    {state.waterBalanceResult?.totalDeficit.toLocaleString('id-ID') ?? '0'}
                                </h3>
                                <span className="text-[10px] text-slate-400">m³</span>
                            </div>
                        </Card>
                    </div>

                    <Card className="flex-1 border-slate-200 min-h-[350px]">
                        <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-sm">Fluktuasi Tampungan Waduk</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 h-full min-h-[300px]">
                            {!chartData ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                                    <Droplets className="w-16 h-16" />
                                    <p className="text-xs font-bold mt-2">SIMULASIKAN UNTUK HASIL</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.2} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />

                                        {state.stageStorageCurve && (
                                            <ReferenceLine
                                                y={state.stageStorageCurve.storage[state.stageStorageCurve.storage.length - 1]}
                                                stroke="#94a3b8"
                                                strokeDasharray="3 3"
                                                label={{ value: 'MAN', position: 'insideTopRight', fontSize: 10, fill: '#64748b' }}
                                            />
                                        )}
                                        {state.stageStorageCurve && (
                                            <ReferenceLine
                                                y={state.stageStorageCurve.storage[0]}
                                                stroke="#ef4444"
                                                strokeDasharray="3 3"
                                                label={{ value: 'Dead Storage', position: 'insideBottomRight', fontSize: 10, fill: '#ef4444' }}
                                            />
                                        )}

                                        <Area
                                            type="monotone"
                                            dataKey="storage"
                                            name="Volume Tampungan (m³)"
                                            stroke="#0284c7"
                                            fill="url(#colorStorage)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {state.waterBalanceResult && (
                        <div className="grid grid-cols-6 md:grid-cols-12 gap-1">
                            {state.waterBalanceResult.steps.map((step, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "h-8 rounded-sm flex items-center justify-center text-[10px] font-bold text-white shadow-sm",
                                        step.status === 'deficit' ? "bg-rose-500" :
                                            step.status === 'spill' ? "bg-amber-400" : "bg-teal-500"
                                    )}
                                    title={`${step.status.toUpperCase()}: ${step.storageEnd.toLocaleString()} m³`}
                                >
                                    {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
