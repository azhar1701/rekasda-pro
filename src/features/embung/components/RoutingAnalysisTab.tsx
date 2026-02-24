import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { Download, Calculator, Info, Activity, ArrowDownRight } from 'lucide-react';
import { calculateFloodRouting } from '@/lib/engine/embung';
import { toast } from '@/hooks/useToast';
import { HydroValidationError } from '@/features/embung/types/embung.types';

// Default Data for Initialization
const DEFAULT_HYDROGRAPH = [
    { time: 0, inflow: 0 },
    { time: 1, inflow: 15 },
    { time: 2, inflow: 45 },
    { time: 3, inflow: 120 },
    { time: 4, inflow: 85 },
    { time: 5, inflow: 50 },
    { time: 6, inflow: 25 },
    { time: 7, inflow: 10 },
    { time: 8, inflow: 0 },
];

// Mock Curves for demonstration (Usually loaded from project database)
const MOCK_STAGE_STORAGE = {
    elevation: [100, 101, 102, 103, 104, 105],
    storage: [0, 50000, 120000, 210000, 320000, 450000],
    area: [0, 10000, 22000, 35000, 50000, 67000]
};
const MOCK_STAGE_DISCHARGE = {
    elevation: [100, 101, 102, 103, 104, 105],
    discharge: [0, 5, 15, 35, 65, 110]
};

export const RoutingAnalysisTab = () => {
    const [isCalculating, setIsCalculating] = useState(false);

    // Form State
    const [hydrograph, setHydrograph] = useState(DEFAULT_HYDROGRAPH);

    // Result State
    const [resultData, setResultData] = useState<any[] | null>(null);
    const [summary, setSummary] = useState<{ peakInflow: number, peakOutflow: number, attenuation: number } | null>(null);

    const handleInflowChange = (index: number, val: string) => {
        const newHydro = [...hydrograph];
        newHydro[index].inflow = parseFloat(val) || 0;
        setHydrograph(newHydro);
        setResultData(null); // Reset result on change
        setSummary(null);
    };

    const handleAddTime = () => {
        const lastTime = hydrograph.length > 0 ? hydrograph[hydrograph.length - 1].time : -1;
        setHydrograph([...hydrograph, { time: lastTime + 1, inflow: 0 }]);
    };

    const handleCalculate = () => {
        setIsCalculating(true);
        setResultData(null);
        setSummary(null);

        // Simulate network delay for UX
        setTimeout(() => {
            try {
                // Map to engine input format
                const inflowInput = hydrograph.map(h => ({
                    time: h.time * 3600, // Convert hours to seconds
                    discharge: h.inflow
                }));

                const routingResult = calculateFloodRouting(
                    inflowInput,
                    MOCK_STAGE_STORAGE,
                    MOCK_STAGE_DISCHARGE,
                    3600, // 1 hour steps
                    100 // Starting at MAN
                );

                // Format for Recharts
                const chartData = routingResult.steps.map(step => ({
                    time: step.time / 3600, // Convert back to hours
                    inflow: Number(step.inflowAvg.toFixed(2)),
                    outflow: Number(step.outflow.toFixed(2)),
                    elevation: Number(step.elevation.toFixed(2))
                }));

                setResultData(chartData);
                setSummary({
                    peakInflow: Number(routingResult.peakInflow.toFixed(2)),
                    peakOutflow: Number(routingResult.peakOutflow.toFixed(2)),
                    attenuation: Number((routingResult.attenuationRatio).toFixed(1))
                });

                toast.success('Simulasi Penelusuran Banjir berhasil.');
            } catch (error: any) {
                if (error instanceof HydroValidationError) {
                    toast.error(`Validasi Gagal: ${error.message}`);
                } else {
                    toast.error(`Terjadi kesalahan: ${error.message || 'Unknown error'}`);
                }
            } finally {
                setIsCalculating(false);
            }
        }, 800);
    };

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Header Info */}
            <div className="flex items-start justify-between bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-semibold text-blue-900">Penelusuran Banjir (Flood Routing)</h3>
                        <p className="text-sm text-blue-700/80 mt-1">
                            Metode Level-Pool (Modified Puls) untuk menyimulasikan perjalanan hidrograf banjir melewati waduk. Evaluasi kemampuan embung dalam meredam puncak banjir (attenuation).
                        </p>
                        <p className="text-xs text-blue-600 mt-2 font-medium bg-blue-100/50 inline-block px-2 py-1 rounded">
                            *Catatan: Kurva Kapasitas & Lengkung Debit menggunakan profil embung yang terdaftar.
                        </p>
                    </div>
                </div>
            </div>

            {/* Layout Asimetris (Span 5 | Span 7) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

                {/* KIRI: Input Form (Span 5) */}
                <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">
                    <Card className="flex flex-col h-full shadow-sm border-slate-200">
                        <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg text-slate-800">Hidrograf Masuk (Inflow)</CardTitle>
                                    <CardDescription className="text-xs">Debit setiap jam (m³/s)</CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={handleCalculate}
                                    disabled={isCalculating}
                                    className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all"
                                >
                                    {isCalculating ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Menghitung...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Calculator className="w-4 h-4 mr-2" />
                                            Simulasi Routing
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 overflow-auto p-0 z-0 border border-slate-200 rounded-b-xl border-t-0 bg-white">
                            <div className="w-full">
                                {/* Table Header */}
                                <div className="flex w-full sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 shadow-sm">
                                    <div className="flex-none w-24 py-3 px-4 text-left">Waktu (Jam)</div>
                                    <div className="flex-1 py-3 px-4 text-right">Debit Inflow (m³/s)</div>
                                </div>

                                {/* Table Body */}
                                <div className="w-full">
                                    {hydrograph.map((row, idx) => (
                                        <div key={idx} className="flex w-full items-center border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex-none w-24 py-2.5 px-4 font-medium text-slate-600">
                                                t = {row.time}
                                            </div>
                                            <div className="flex-1 py-2 px-4">
                                                <Input
                                                    type="number"
                                                    value={row.inflow}
                                                    onChange={(e) => handleInflowChange(idx, e.target.value)}
                                                    className="h-8 text-right text-sm font-medium focus-visible:ring-1 focus-visible:ring-teal-500 shadow-none border-slate-200"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={handleAddTime}
                                        className="w-full py-3 text-xs font-medium text-teal-600 hover:bg-teal-50 transition-colors border-t border-dashed border-teal-200"
                                    >
                                        + Tambah Baris Waktu
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* KANAN: Visualisasi (Span 7) */}
                <div className="lg:col-span-7 flex flex-col gap-4 min-h-0">

                    {/* 3 Summary Cards */}
                    <div className="grid grid-cols-3 gap-4 shrink-0">
                        {/* Puncak Inflow */}
                        <Card className="shadow-sm border-slate-200 bg-white">
                            <CardContent className="p-4">
                                <p className="text-slate-500 text-xs font-medium mb-1 uppercase tracking-wider">Puncak Inflow</p>
                                <div className="flex items-baseline gap-1.5">
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        {summary ? summary.peakInflow : "-"}
                                    </h2>
                                    <span className="text-slate-400 text-xs font-medium">m³/s</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Puncak Outflow */}
                        <Card className="shadow-sm border-slate-200 bg-teal-50/50 border-teal-100">
                            <CardContent className="p-4">
                                <p className="text-teal-700/80 text-xs font-medium mb-1 uppercase tracking-wider">Puncak Outflow</p>
                                <div className="flex items-baseline gap-1.5">
                                    <h2 className="text-2xl font-bold text-teal-700">
                                        {summary ? summary.peakOutflow : "-"}
                                    </h2>
                                    <span className="text-teal-500 text-xs font-medium">m³/s</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Reduksi / Attenuation */}
                        <Card className="shadow-sm border-slate-200 bg-indigo-50/50 border-indigo-100 relative overflow-hidden">
                            <ArrowDownRight className="absolute -right-3 -bottom-3 w-16 h-16 text-indigo-200/50 opacity-50" />
                            <CardContent className="p-4 relative z-10">
                                <p className="text-indigo-700/80 text-xs font-medium mb-1 uppercase tracking-wider">Reduksi Puncak</p>
                                <div className="flex items-baseline gap-1.5">
                                    <h2 className="text-2xl font-bold text-indigo-700">
                                        {summary ? summary.attenuation : "-"}
                                    </h2>
                                    <span className="text-indigo-500 text-xs font-medium">%</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Chart */}
                    <Card className="flex-1 shadow-sm border-slate-200 flex flex-col min-h-[350px]">
                        <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between shrink-0 bg-white/50 backdrop-blur-sm z-10">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-teal-600" />
                                <CardTitle className="text-slate-800 text-base">Grafik Routing (Inflow vs Outflow)</CardTitle>
                            </div>
                            {resultData && (
                                <Button variant="outline" size="icon" className="h-8 w-8 text-slate-500">
                                    <Download className="h-4 w-4" />
                                </Button>
                            )}
                        </CardHeader>

                        <CardContent className="flex-1 p-6 relative">
                            {/* Loading Overlay */}
                            {isCalculating && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-b-xl">
                                    <div className="w-10 h-10 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin mb-3" />
                                    <p className="text-slate-600 font-medium text-sm animate-pulse">Menghitung rute banjir...</p>
                                </div>
                            )}

                            {!resultData && !isCalculating ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                                    <Activity className="w-12 h-12 opacity-20" />
                                    <p className="text-sm font-medium">Masukkan hidrograf inflow dan klik Simulasi Routing</p>
                                </div>
                            ) : (
                                <div className="w-full h-full min-h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={resultData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis
                                                dataKey="time"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748B', fontSize: 12 }}
                                                dy={10}
                                                name="Waktu (Jam)"
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748B', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                labelFormatter={(val) => `Waktu: t=${val} jam`}
                                                formatter={(val: number) => [val + ' m³/s']}
                                            />
                                            <Legend verticalAlign="top" height={36} iconType="circle" />

                                            <Area
                                                type="monotone"
                                                dataKey="inflow"
                                                name="Inflow (Masuk)"
                                                fill="url(#colorInflow)"
                                                stroke="#64748b"
                                                strokeWidth={2}
                                                strokeDasharray="5 5"
                                            />

                                            <Area
                                                type="monotone"
                                                dataKey="outflow"
                                                name="Outflow (Keluar)"
                                                fill="url(#colorOutflow)"
                                                stroke="#0ea5e9"
                                                strokeWidth={3}
                                                activeDot={{ r: 6, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 2 }}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

