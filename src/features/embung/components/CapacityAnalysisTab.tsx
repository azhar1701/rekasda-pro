import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { Download, Calculator, Info, Waves, Spline, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import { calculateSequentPeak } from '@/lib/engine/embung';
import { HydroValidationError } from '../types/embung.types';
import type { MonthlyData, SequentPeakResult } from '../types/embung.types';

// Mock Initial Data
const INITIAL_DATA: MonthlyData[] = [
    { id: '1', month: 'Jan', inflow: 120, outflow: 80 },
    { id: '2', month: 'Feb', inflow: 150, outflow: 85 },
    { id: '3', month: 'Mar', inflow: 110, outflow: 90 },
    { id: '4', month: 'Apr', inflow: 80, outflow: 95 },
    { id: '5', month: 'May', inflow: 50, outflow: 100 },
    { id: '6', month: 'Jun', inflow: 30, outflow: 105 },
    { id: '7', month: 'Jul', inflow: 20, outflow: 110 },
    { id: '8', month: 'Aug', inflow: 15, outflow: 105 },
    { id: '9', month: 'Sep', inflow: 40, outflow: 90 },
    { id: '10', month: 'Oct', inflow: 90, outflow: 85 },
    { id: '11', month: 'Nov', inflow: 130, outflow: 80 },
    { id: '12', month: 'Des', inflow: 160, outflow: 80 },
];

export const CapacityAnalysisTab = () => {
    const [data, setData] = useState<MonthlyData[]>(INITIAL_DATA);
    const [result, setResult] = useState<SequentPeakResult | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const handleInputChange = (id: string, field: keyof MonthlyData, value: string) => {
        const numValue = parseFloat(value) || 0;
        setData(prev => prev.map(row => row.id === id ? { ...row, [field]: numValue } : row));
    };

    const handleCalculate = () => {
        setIsCalculating(true);
        setResult(null);

        // Use setTimeout to allow UI to show loading state before heavy computation
        setTimeout(() => {
            try {
                const inflow = data.map(r => r.inflow);
                const outflow = data.map(r => r.outflow);

                const spResult = calculateSequentPeak({ inflow, outflow });

                setResult(spResult);
                toast.success(`Kalkulasi selesai. Kebutuhan tampungan: ${spResult.maxStorageRequired.toFixed(2)} Juta m³`);
            } catch (error: unknown) {
                if (error instanceof HydroValidationError) {
                    toast.error(`Validasi gagal: ${error.message}`);
                } else if (error instanceof Error) {
                    toast.error(`Terjadi kesalahan: ${error.message}`);
                } else {
                    toast.error('Terjadi kesalahan yang tidak diketahui.');
                }
            } finally {
                setIsCalculating(false);
            }
        }, 50);
    };

    // Map SequentPeakResult to chart data format
    const chartData = result?.massCurveData.map(p => ({
        month: p.month,
        cumulativeInflow: p.cumulativeInflow,
        cumulativeOutflow: p.cumulativeOutflow,
    })) ?? null;

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Header Info */}
            <div className="flex items-start justify-between bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-semibold text-blue-900">Metode Kurva Massa (Rippl)</h3>
                        <p className="text-sm text-blue-700/80 mt-1">
                            Metode ini digunakan untuk menentukan volume tampungan efektif embung berdasarkan selisih kumulatif antara aliran masuk (inflow) dan kebutuhan air (outflow).
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

                {/* Left Column: Input Form (Data Density - 5 Cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">
                    <Card className="flex flex-col h-full shadow-sm border-slate-200">
                        <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg text-slate-800">Data Hidrologi Bulanan</CardTitle>
                                    <CardDescription className="text-xs">Input dalam satuan Juta m³</CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={handleCalculate}
                                    disabled={isCalculating}
                                    className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm disabled:opacity-60"
                                >
                                    {isCalculating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Menghitung...
                                        </>
                                    ) : (
                                        <>
                                            <Calculator className="w-4 h-4 mr-2" />
                                            Kalkulasi
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto p-0 z-0 border border-slate-200 rounded-b-xl border-t-0 bg-white">
                            <div className="w-full">
                                {/* Table Header */}
                                <div className="flex w-full sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 shadow-sm">
                                    <div className="flex-none w-20 py-3 px-4 text-left">Bulan</div>
                                    <div className="flex-1 py-3 px-4 text-right">Inflow</div>
                                    <div className="flex-1 py-3 px-4 text-right">Outflow</div>
                                </div>

                                {/* Table Body */}
                                <div className="w-full">
                                    {data.map((row) => (
                                        <div key={row.id} className="flex w-full items-center border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex-none w-20 py-2.5 px-4 font-medium text-slate-600">
                                                {row.month}
                                            </div>
                                            <div className="flex-1 py-2 px-4">
                                                <Input
                                                    type="number"
                                                    value={row.inflow}
                                                    className="h-8 text-right text-sm font-medium focus-visible:ring-1 focus-visible:ring-teal-500 shadow-none border-slate-200 hover:border-teal-300"
                                                    onChange={(e) => handleInputChange(row.id, 'inflow', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex-1 py-2 px-4">
                                                <Input
                                                    type="number"
                                                    value={row.outflow}
                                                    className="h-8 text-right text-sm font-medium focus-visible:ring-1 focus-visible:ring-teal-500 shadow-none border-slate-200 hover:border-teal-300"
                                                    onChange={(e) => handleInputChange(row.id, 'outflow', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Visualization (Data Density - 7 Cols) */}
                <div className="lg:col-span-7 flex flex-col gap-4 min-h-0">
                    {/* Result Highlight Card */}
                    <Card className="bg-teal-900 text-white shadow-md border-transparent shrink-0 relative overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-800 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 pointer-events-none"></div>

                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-teal-100 text-sm font-medium mb-1">Kebutuhan Volume Tampungan Efektif</p>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-4xl font-bold tracking-tight">
                                            {result ? result.maxStorageRequired.toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0.00'}
                                        </h2>
                                        <span className="text-teal-200 font-medium tracking-wide">Juta m³</span>
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-teal-800/50 rounded-2xl flex items-center justify-center border border-teal-700/50 backdrop-blur-sm">
                                    <Waves className="w-6 h-6 text-teal-300" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Mass Curve Chart */}
                    <Card className="flex-1 shadow-sm border-slate-200 flex flex-col min-h-[300px]">
                        <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between shrink-0">
                            <CardTitle className="text-slate-800 text-base">Grafik Kurva Massa Kumulatif</CardTitle>
                            {result && (
                                <Button variant="outline" size="icon" className="h-8 w-8 text-slate-500">
                                    <Download className="h-4 w-4" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="flex-1 p-6 flex flex-col justify-center">
                            {!chartData ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                                    <Spline className="w-12 h-12 opacity-20" />
                                    <p className="text-sm font-medium">Klik Kalkulasi untuk menampilkan grafik</p>
                                </div>
                            ) : (
                                <div className="w-full h-full min-h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis
                                                dataKey="month"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748B', fontSize: 12 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748B', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend verticalAlign="top" height={36} iconType="circle" />
                                            <Area
                                                type="monotone"
                                                dataKey="cumulativeInflow"
                                                name="Kumulatif Inflow"
                                                fill="#0EA5E9"
                                                stroke="#0284C7"
                                                fillOpacity={0.1}
                                                strokeWidth={2}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="cumulativeOutflow"
                                                name="Kumulatif Outflow"
                                                stroke="#F43F5E"
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{ r: 6 }}
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
