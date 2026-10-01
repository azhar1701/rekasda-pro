import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { useEmbungStore } from '../../../hooks/useEmbungStore';
import { calculateFloodRouting, generateSpillwayDischargeCurve } from '@/lib/engine/embungEngine';
import { Activity, ArrowDownRight, CheckCircle, Info, AlertCircle, RefreshCw, Sliders, ShieldCheck } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { toast } from '@/hooks/useToast';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area } from 'recharts';
import type { SpillwayConfig } from '@/features/embung/types/embung.types';

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
    const { hasilBanjir, hasilKonvolusi } = useHydrologyStore();

    // Inflow Hydrograph State
    const [hydrograph, setHydrograph] = useState(() => {
        if (state.routingInput?.inflowHydrograph && state.routingInput.inflowHydrograph.length > 0) {
            return state.routingInput.inflowHydrograph;
        }
        if (hasilBanjir?.hidrograf?.length) {
            return hasilBanjir.hidrograf.map(h => ({ time: h.time, discharge: h.inflow }));
        }
        if (hasilKonvolusi?.floodHydrograph?.length) {
            return hasilKonvolusi.floodHydrograph.map(h => ({ time: h.time, discharge: h.discharge }));
        }
        return DEFAULT_HYDROGRAPH;
    });

    const isAvailableFromFlood = Boolean(hasilBanjir?.hidrograf?.length || hasilKonvolusi?.floodHydrograph?.length);

    // Spillway Configuration State (Pd. T-03-2005-A / SNI 03-3432-1994)
    const defaultCrestElevation = state.zoning?.normalWaterLevel ??
        (state.stageStorageCurve ? state.stageStorageCurve.elevation[Math.floor(state.stageStorageCurve.elevation.length * 0.7)] : 104);

    const [spillway, setSpillway] = useState<SpillwayConfig>(() => ({
        crestElevation: state.spillwayConfig?.crestElevation ?? defaultCrestElevation,
        crestLength: state.spillwayConfig?.crestLength ?? 10.0,
        dischargeCoefficient: state.spillwayConfig?.dischargeCoefficient ?? 2.0,
        spillwayType: state.spillwayConfig?.spillwayType ?? 'ogee'
    }));

    // Keep spillway crest synced with zoning NWL if user updated zoning in step 1
    useEffect(() => {
        if (state.zoning?.normalWaterLevel && !state.spillwayConfig) {
            setSpillway(prev => ({ ...prev, crestElevation: state.zoning!.normalWaterLevel }));
        }
    }, [state.zoning?.normalWaterLevel, state.spillwayConfig]);

    const handleSyncFromFloodModule = () => {
        if (hasilBanjir?.hidrograf?.length) {
            const mapped = hasilBanjir.hidrograf.map(h => ({ time: h.time, discharge: h.inflow }));
            setHydrograph(mapped);
            toast.success(`Berhasil menyinkronkan ${mapped.length} ordinat hidrograf dari Modul Banjir (${hasilBanjir.method || 'HSS'}).`);
        } else if (hasilKonvolusi?.floodHydrograph?.length) {
            const mapped = hasilKonvolusi.floodHydrograph.map(h => ({ time: h.time, discharge: h.discharge }));
            setHydrograph(mapped);
            toast.success(`Berhasil menyinkronkan ${mapped.length} ordinat hidrograf dari Modul Konvolusi Banjir.`);
        } else {
            toast.error("Tidak ada data hidrograf banjir di Modul Banjir. Silakan hitung terlebih dahulu di menu Banjir.");
        }
    };

    const handleInflowChange = (index: number, val: string) => {
        const newHydro = [...hydrograph];
        newHydro[index].discharge = parseFloat(val) || 0;
        setHydrograph(newHydro);
    };

    const handleSpillwayTypeChange = (type: 'ogee' | 'broad_crested' | 'sharp_crested') => {
        let cd = 2.0;
        if (type === 'broad_crested') cd = 1.7;
        if (type === 'sharp_crested') cd = 1.9;
        if (type === 'ogee') cd = 2.1;
        setSpillway({ ...spillway, spillwayType: type, dischargeCoefficient: cd });
    };

    const handleCalculate = () => {
        if (!state.stageStorageCurve) {
            toast.error("Lengkapi data Geometri (Langkah 1) terlebih dahulu!");
            return;
        }

        try {
            // 1. Generate realistic spillway stage-discharge curve based on hydraulic parameters
            const stageDischargeCurve = generateSpillwayDischargeCurve(
                state.stageStorageCurve.elevation,
                spillway
            );

            // 2. Perform Level-Pool Routing via Modified Puls Method
            // Initial water surface elevation is set to Spillway Crest (MAN) per SNI standard
            const result = calculateFloodRouting({
                inflowHydrograph: hydrograph,
                stageStorageCurve: state.stageStorageCurve,
                stageDischargeCurve: stageDischargeCurve,
                deltaT: 3600,
                initialElevation: spillway.crestElevation
            });

            // 3. Update store
            dispatch({ type: 'SET_ROUTING_RESULT', payload: result });
            dispatch({ type: 'SET_ROUTING_INPUT', payload: { inflowHydrograph: hydrograph } });
            dispatch({ type: 'SET_SPILLWAY_CONFIG', payload: spillway });

            // If zoning exists, update MAB (floodWaterLevel)
            if (state.zoning) {
                dispatch({
                    type: 'SET_ZONING',
                    payload: {
                        ...state.zoning,
                        floodWaterLevel: parseFloat(result.maxElevation.toFixed(2))
                    }
                });
            }

            // 4. Harmonize with Global Hydrology Store
            const freeboardVal = state.zoning?.freeboard ?? 1.0;
            const damCrestElev = (state.zoning?.normalWaterLevel ?? spillway.crestElevation) + freeboardVal;
            const residual = damCrestElev - result.maxElevation;
            useHydrologyStore.getState().setHasilEmbung({
                peakInflow: result.peakInflow,
                peakOutflow: result.peakOutflow,
                reduksiPuncak: parseFloat((result.attenuationRatio * 100).toFixed(1)),
                maxElevation: parseFloat(result.maxElevation.toFixed(2)),
                freeboardResidual: parseFloat(residual.toFixed(2)),
                isAman: residual >= 0,
                umurSedimen: state.sedimentResult?.lifespanYears ? Math.round(state.sedimentResult.lifespanYears) : 0
            });

            toast.success(`Simulasi Routing Berhasil! Reduksi puncak: ${(result.attenuationRatio * 100).toFixed(1)}%`);
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

    const headOverCrest = state.routingResult ? (state.routingResult.maxElevation - spillway.crestElevation) : 0;
    const freeboardAvailable = state.zoning ? (state.zoning.freeboard - headOverCrest) : null;

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header info */}
            <div className="flex items-start gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <Info className="w-5 h-5 text-slate-500 mt-1 shrink-0" />
                <div>
                    <h3 className="text-sm font-bold text-slate-800">Penelusuran Banjir Waduk (Level-Pool Routing — SNI 03-3432-1994 & Pd. T-03-2005-A)</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Verifikasi kapasitas pelimpah (spillway) dan efek peredaman debit banjir (flood attenuation) menggunakan metode Modified Puls. Pelimpahan diasumsikan mulai aktif saat elevasi muka air waduk melampaui elevasi mercu pelimpah (MAN).
                    </p>
                </div>
            </div>

            {/* Spillway Configuration Card */}
            <Card className="border-slate-200 bg-white">
                <CardHeader className="py-3 px-5 border-b border-slate-100 bg-slate-50/70 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-pupr-blue" />
                        <CardTitle className="text-sm font-bold text-slate-800">Parameter Bangunan Pelimpah (Spillway)</CardTitle>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">
                        Formula Pd. T-03-2005-A: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-pupr-blue">Q = Cd · B · H^1.5</code>
                    </span>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Elevasi Mercu MAN (m asl)
                        </label>
                        <Input
                            type="number"
                            step="0.1"
                            value={spillway.crestElevation}
                            onChange={(e) => setSpillway({ ...spillway, crestElevation: parseFloat(e.target.value) || 0 })}
                            className="h-8 text-xs font-semibold"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Lebar Efektif Mercu B (m)
                        </label>
                        <Input
                            type="number"
                            step="0.5"
                            value={spillway.crestLength}
                            onChange={(e) => setSpillway({ ...spillway, crestLength: parseFloat(e.target.value) || 0 })}
                            className="h-8 text-xs font-semibold"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Koefisien Debit Pelimpah Cd
                        </label>
                        <Input
                            type="number"
                            step="0.05"
                            value={spillway.dischargeCoefficient}
                            onChange={(e) => setSpillway({ ...spillway, dischargeCoefficient: parseFloat(e.target.value) || 0 })}
                            className="h-8 text-xs font-semibold"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Tipe Mercu Pelimpah
                        </label>
                        <div className="flex gap-1">
                            {(['ogee', 'broad_crested', 'sharp_crested'] as const).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => handleSpillwayTypeChange(type)}
                                    className={`flex-1 py-1.5 px-2 text-[10px] font-medium rounded border transition-colors ${
                                        spillway.spillwayType === type
                                            ? 'bg-pupr-blue text-white border-pupr-blue'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    {type === 'ogee' ? 'Ogee' : type === 'broad_crested' ? 'Ambang Lebar' : 'Ambang Tajam'}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Input Inflow */}
                <Card className="lg:col-span-5 border-slate-200 flex flex-col h-full">
                    <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-slate-400" />
                            <CardTitle className="text-sm">Inflow Hydrograph</CardTitle>
                        </div>
                        <div className="flex gap-2">
                            {isAvailableFromFlood && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleSyncFromFloodModule}
                                    className="h-8 text-xs border-teal-300 text-teal-700 bg-teal-50 hover:bg-teal-100"
                                >
                                    <RefreshCw className="w-3 h-3 mr-1" /> Sync Banjir
                                </Button>
                            )}
                            <Button size="sm" onClick={handleCalculate} className="bg-pupr-blue hover:bg-teal-700 text-white h-8 text-xs font-semibold">
                                Jalankan Simulasi
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-auto flex-1 max-h-[420px]">
                        {isAvailableFromFlood && (
                            <div className="p-3 bg-teal-50 border-b border-teal-100 text-[10px] text-teal-800 font-medium flex items-center justify-between">
                                <span><CheckCircle className="w-3 h-3 inline mr-1 text-teal-600" /> Data hidrograf dari Modul Analisis Banjir tersedia</span>
                            </div>
                        )}
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-2 border-b border-slate-200">Waktu (Jam)</th>
                                    <th className="px-3 py-2 border-b border-slate-200 text-right">Debit Inflow (m³/s)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hydrograph.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 border-b border-slate-100 last:border-0 transition-colors">
                                        <td className="px-4 py-1.5 font-medium text-slate-600">t = {row.time} jam</td>
                                        <td className="px-3 py-1.5">
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={row.discharge}
                                                className="h-7 text-xs text-right border-transparent hover:border-slate-300 bg-transparent focus:bg-white"
                                                onChange={(e) => handleInflowChange(idx, e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Metrics & Graph */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Card className="p-3 border-slate-200 bg-white">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Peak Inflow</p>
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-xl font-bold text-slate-700">{state.routingResult?.peakInflow.toFixed(2) ?? '-'}</h3>
                                <span className="text-xs text-slate-400">m³/s</span>
                            </div>
                        </Card>
                        <Card className="p-3 border-pupr-blue/30 bg-blue-50/30">
                            <p className="text-[10px] font-bold text-pupr-blue uppercase tracking-wider mb-1">Peak Outflow</p>
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-xl font-bold text-pupr-blue">{state.routingResult?.peakOutflow.toFixed(2) ?? '-'}</h3>
                                <span className="text-xs text-slate-400">m³/s</span>
                            </div>
                        </Card>
                        <Card className="p-3 border-indigo-200 bg-indigo-50/40">
                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Reduksi Puncak</p>
                            <div className="flex items-baseline gap-1 text-indigo-700">
                                <h3 className="text-xl font-bold">
                                    {state.routingResult ? `${(state.routingResult.attenuationRatio * 100).toFixed(1)}%` : '-'}
                                </h3>
                                <ArrowDownRight className="w-3.5 h-3.5" />
                            </div>
                        </Card>
                        <Card className="p-3 border-emerald-200 bg-emerald-50/40">
                            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Elevasi MAB (HWL)</p>
                            <div className="flex items-baseline gap-1 text-emerald-800">
                                <h3 className="text-xl font-bold">
                                    {state.routingResult?.maxElevation.toFixed(2) ?? '-'}
                                </h3>
                                <span className="text-xs text-emerald-600">m asl</span>
                            </div>
                        </Card>
                    </div>

                    {state.routingResult && (
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50 text-xs">
                            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
                            <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                                <span>
                                    Tinggi Limpasan di atas Mercu (<code className="font-bold">ΔH</code>): <strong>{headOverCrest.toFixed(2)} m</strong>
                                </span>
                                {freeboardAvailable !== null && (
                                    <span className={freeboardAvailable >= 0 ? "text-emerald-700 font-semibold" : "text-rose-600 font-bold"}>
                                        Sisa Jagaan (Freeboard): {freeboardAvailable.toFixed(2)} m {freeboardAvailable < 0 && '(PERINGATAN: OVERTOPPING!)'}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <Card className="flex-1 border-slate-200 min-h-[350px] relative overflow-hidden">
                        <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between z-10 relative bg-white/80 backdrop-blur-sm">
                            <CardTitle className="text-sm">Inflow vs Outflow Hydrograph (Penelusuran Banjir)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 h-full flex flex-col">
                            {!chartData ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-50 min-h-[260px]">
                                    <Activity className="w-16 h-16" />
                                    <p className="text-xs font-bold mt-2">SIMULASI UNTUK VISUALISASI</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis
                                            dataKey="time"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                            label={{ value: 'Waktu (Jam)', position: 'bottom', offset: -5, fontSize: 10, fill: '#94a3b8' }}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                            label={{ value: 'Debit (m³/s)', angle: -90, position: 'left', fontSize: 10, fill: '#94a3b8' }}
                                        />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                        <Area
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="inflow"
                                            name="Inflow (Masuk)"
                                            fill="#94a3b8"
                                            stroke="#64748b"
                                            fillOpacity={0.15}
                                            strokeDasharray="5 5"
                                        />
                                        <Area
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="outflow"
                                            name="Outflow (Pelimpah)"
                                            fill="#0ea5e9"
                                            stroke="#0ea5e9"
                                            fillOpacity={0.25}
                                            strokeWidth={3}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                        {state.routingResult && state.routingResult.peakOutflow > state.routingResult.peakInflow && (
                            <div className="absolute top-16 right-6 z-20">
                                <AlertCircle className="w-12 h-12 text-rose-500 opacity-50" />
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

