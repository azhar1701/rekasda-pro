import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { useEmbungStore } from '../../../hooks/useEmbungStore';
import { calculateSedimentYield } from '@/lib/engine/embungEngine';
import { Trash2, Plus, Calculator, BarChart3, Clock, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const StepSediment: React.FC = () => {
    const { state, dispatch } = useEmbungStore();
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
        luasDas: state.sedimentInput?.luasDas ?? 15,
        beratJenis: state.sedimentInput?.beratJenis ?? 1.6,
        bedLoadPercentage: state.sedimentInput?.bedLoadPercentage ?? 15,
    });

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

        const result = calculateSedimentYield({
            qData: samples.map(s => s.q),
            qsData: samples.map(s => s.qs),
            luasDas: params.luasDas,
            beratJenis: params.beratJenis,
            bedLoadPercentage: params.bedLoadPercentage,
            reservoirCapacity: state.stageStorageCurve.storage[state.stageStorageCurve.storage.length - 1] * 1000000,
            annualInflow: samples.reduce((a, b) => a + b.q, 0) * 86400 * 365, // Very rough annual Inflow
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
    };

    const lifespanYears = state.sedimentResult && state.stageStorageCurve ?
        (state.stageStorageCurve.storage[0] * 1000000) / state.sedimentResult.trappedVolumeM3 : 0;

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-start gap-3 bg-rose-50 p-4 rounded-lg border border-rose-100">
                <AlertTriangle className="w-5 h-5 text-rose-600 mt-1 shrink-0" />
                <div>
                    <h3 className="text-sm font-bold text-rose-900">Analisis Sedimentasi & Umur Guna</h3>
                    <p className="text-xs text-rose-800/80 mt-1 leading-relaxed">
                        Evaluasi laju sedimentasi untuk memperkirakan kapan kantong lumpur (dead storage) akan terisi penuh. Hal ini menentukan masa layan teknis embung.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Inputs */}
                <Card className="lg:col-span-5 border-slate-200">
                    <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm">Sampel Debit & Sedimen</CardTitle>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={handleAddSample} className="h-7 text-[10px]">
                                <Plus className="w-3 h-3 mr-1" /> Sampel
                            </Button>
                            <Button size="sm" onClick={handleCalculate} className="bg-pupr-blue hover:bg-teal-700 h-7 text-[10px] text-white">
                                <Calculator className="w-3 h-3 mr-1" /> Analisa
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="p-4 grid grid-cols-3 gap-3 bg-slate-50/50 border-b border-slate-100">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">LUAS DAS (KM²)</label>
                                <Input type="number" value={params.luasDas} className="h-7 text-xs" onChange={(e) => handleParamChange('luasDas', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">BERAT JENIS</label>
                                <Input type="number" value={params.beratJenis} className="h-7 text-xs" onChange={(e) => handleParamChange('beratJenis', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">BED LOAD %</label>
                                <Input type="number" value={params.bedLoadPercentage} className="h-7 text-xs" onChange={(e) => handleParamChange('bedLoadPercentage', e.target.value)} />
                            </div>
                        </div>
                        <div className="max-h-[350px] overflow-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-10 border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-2">No</th>
                                        <th className="px-2 py-2 text-right">Q (m³/s)</th>
                                        <th className="px-2 py-2 text-right">Qs (ton/hari)</th>
                                        <th className="w-8"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {samples.map((s, idx) => (
                                        <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-4 py-1.5 text-slate-400 font-medium">{idx + 1}</td>
                                            <td className="px-2 py-1.5">
                                                <Input type="number" value={s.q} className="h-7 text-right border-transparent hover:border-slate-200 bg-transparent text-xs" onChange={(e) => handleSampleChange(s.id, 'q', e.target.value)} />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <Input type="number" value={s.qs} className="h-7 text-right border-transparent hover:border-slate-200 bg-transparent text-xs" onChange={(e) => handleSampleChange(s.id, 'qs', e.target.value)} />
                                            </td>
                                            <td className="px-1 py-1.5">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600" onClick={() => handleRemoveSample(s.id)}>
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Results & Prediction */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl">
                            <Clock className="w-5 h-5 text-rose-400 mb-2" />
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Estimasi Umur Guna</p>
                            <div className="flex items-baseline gap-2">
                                <h1 className="text-4xl font-extrabold text-white">
                                    {lifespanYears > 0 ? lifespanYears.toFixed(0) : '-'}
                                </h1>
                                <span className="text-sm font-medium text-slate-400">Tahun</span>
                            </div>
                        </Card>
                        <Card className="p-5 border-slate-200 bg-white">
                            <BarChart3 className="w-5 h-5 text-pupr-blue mb-2" />
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Laju Sedimen Tahunan</p>
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-2xl font-bold text-slate-700">
                                    {state.sedimentResult?.trappedVolumeM3.toLocaleString('id-ID', { maximumFractionDigits: 0 }) ?? '-'}
                                </h3>
                                <span className="text-xs text-slate-400">m³/tahun</span>
                            </div>
                        </Card>
                    </div>

                    <Card className="flex-1 border-slate-200 h-[380px]">
                        <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-sm">Rating Curve Sedimen (Log-Log Regression)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis type="number" dataKey="q" name="Debit" unit=" m³/s" tick={{ fontSize: 10 }} label={{ value: 'Debit (Q)', position: 'bottom', fontSize: 10, offset: 0 }} />
                                    <YAxis type="number" dataKey="qs" name="Sedimen" unit=" ton" tick={{ fontSize: 10 }} label={{ value: 'Sedimen (Qs)', angle: -90, position: 'left', fontSize: 10 }} />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                    <Scatter name="Data Observasi" data={samples} fill="#0ea5e9" />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
