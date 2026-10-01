import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { Download, Calculator, Info, Waves, Spline, Loader2, Sparkles, Database } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
// import { calculateSequentPeak } from '@/lib/engine/embung';
import type { MonthlyData, SequentPeakResult } from '../types/embung.types';
import { useKapasitasMutation } from '@/hooks/api/useEmbungApi';

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

interface CapacityAnalysisTabProps {
    onConsultAI?: (data: any, result: any) => void;
}

export const CapacityAnalysisTab: React.FC<CapacityAnalysisTabProps> = ({ onConsultAI }) => {
    const { hasilNeraca } = useHydrologyStore();
    const [data, setData] = useState<MonthlyData[]>(INITIAL_DATA);
    const [result, setResult] = useState<SequentPeakResult | null>(null);

    const handleSyncFromNeraca = () => {
        if (!hasilNeraca?.monthlySupply || hasilNeraca.monthlySupply.length === 0) {
            toast.error('Data ketersediaan dan kebutuhan air belum dihitung di tab Neraca Air.');
            return;
        }

        const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        const syncedRows: MonthlyData[] = hasilNeraca.monthlySupply.map((supply, i) => {
            const days = daysPerMonth[i] || 30;
            // Q (m3/s) * days * 86400 / 1e6 = Juta m3
            const inflowJutaM3 = parseFloat(((supply * days * 86400) / 1e6).toFixed(3));
            const demandM3s = hasilNeraca.monthlyDemand ? hasilNeraca.monthlyDemand[i] : 0;
            const outflowJutaM3 = parseFloat(((demandM3s * days * 86400) / 1e6).toFixed(3));

            return {
                id: String(i + 1),
                month: monthNames[i] || `Bln-${i + 1}`,
                inflow: inflowJutaM3,
                outflow: outflowJutaM3,
            };
        });

        setData(syncedRows);
        toast.success('Data Inflow & Outflow dari Neraca Air berhasil dimuat!');
    };

    const handleInputChange = (id: string, field: keyof MonthlyData, value: string) => {
        const numValue = parseFloat(value) || 0;
        setData(prev => prev.map(row => row.id === id ? { ...row, [field]: numValue } : row));
    };

    const kapasitasMutation = useKapasitasMutation();
    const isCalculating = kapasitasMutation.isPending;

    const handleCalculate = async () => {
        setResult(null);
        try {
            const inflow = data.map(r => r.inflow);
            const outflow = data.map(r => r.outflow);
            const spResult = await kapasitasMutation.mutateAsync({ inflow, outflow });
            setResult(spResult as unknown as SequentPeakResult);
            toast.success(`Kalkulasi selesai. Kebutuhan tampungan: ${spResult.maxStorageRequired.toFixed(2)} Juta m³`);
        } catch (error: any) {
            toast.error(`Terjadi kesalahan: ${error.detail ?? error.message}`);
        }
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
            <div className="flex items-start justify-between bg-primary-50 p-4 rounded-md border border-primary-100">
                <div className="flex gap-3">
                    <Info className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-semibold text-primary-900">Metode Kurva Massa (Rippl)</h3>
                        <p className="text-sm text-primary-700 mt-1">
                            Metode ini digunakan untuk menentukan volume tampungan efektif embung berdasarkan selisih kumulatif antara aliran masuk (inflow) dan kebutuhan air (outflow).
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

                {/* Left Column: Input Form (Data Density - 5 Cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">
                    <Card className="flex flex-col h-full border-neutral-200">
                        <CardHeader className="py-4 px-5 border-b border-neutral-100 bg-neutral-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg text-neutral-800">Data Hidrologi Bulanan</CardTitle>
                                    <CardDescription className="text-xs">Input dalam satuan Juta m³</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    {hasilNeraca?.monthlySupply && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleSyncFromNeraca}
                                            className="text-xs font-semibold"
                                            title="Muat data Q80 ketersediaan dan kebutuhan air dari analisis Neraca Air"
                                        >
                                            <Database className="w-3.5 h-3.5 mr-1" />
                                            Dari Neraca Air
                                        </Button>
                                    )}
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={handleCalculate}
                                        disabled={isCalculating}
                                    >
                                        {isCalculating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-pulse bg-slate-200 rounded-md" />
                                                Menghitung...
                                            </>
                                        ) : (
                                            <>
                                                <Calculator className="w-4 h-4" />
                                                Kalkulasi
                                            </>
                                        )}
                                    </Button>
                                    {result && onConsultAI && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => onConsultAI({ inputData: data }, result)}
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Analisis AI
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto p-0 z-0 border border-neutral-200 rounded-b-xl border-t-0 bg-white">
                            <div className="w-full">
                                <div className="flex w-full sticky top-0 z-10 bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-600">
                                    <div className="flex-none w-20 py-3 px-4 text-left">Bulan</div>
                                    <div className="flex-1 py-3 px-4 text-right">Inflow</div>
                                    <div className="flex-1 py-3 px-4 text-right">Outflow</div>
                                </div>
                                <div className="w-full">
                                    {data.map((row) => (
                                        <div key={row.id} className="flex w-full items-center border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
                                            <div className="flex-none w-20 py-2.5 px-4 font-medium text-neutral-600">
                                                {row.month}
                                            </div>
                                            <div className="flex-1 py-2 px-4">
                                                <Input
                                                    type="number"
                                                    value={row.inflow}
                                                    className="h-8 text-right text-sm font-medium tabular-nums tracking-tight focus-visible:ring-1 focus-visible:ring-primary-500 border-neutral-200 hover:border-primary-300"
                                                    onChange={(e) => handleInputChange(row.id, 'inflow', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex-1 py-2 px-4">
                                                <Input
                                                    type="number"
                                                    value={row.outflow}
                                                    className="h-8 text-right text-sm font-medium tabular-nums tracking-tight focus-visible:ring-1 focus-visible:ring-primary-500 border-neutral-200 hover:border-primary-300"
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
                    <Card className="bg-primary-600 text-white border-transparent shrink-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-primary-100 text-sm font-medium mb-1">Kebutuhan Volume Tampungan Efektif</p>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-4xl font-bold tabular-nums tracking-tight">
                                            {result ? result.maxStorageRequired.toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0.00'}
                                        </h2>
                                        <span className="text-primary-100 font-medium">Juta m³</span>
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-primary-700 rounded-md flex items-center justify-center">
                                    <Waves className="w-6 h-6 text-primary-100" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Mass Curve Chart */}
                    <Card className="flex-1 border-neutral-200 flex flex-col min-h-[300px]">
                        <CardHeader className="py-4 px-5 border-b border-neutral-100 flex flex-row items-center justify-between shrink-0">
                            <CardTitle className="text-neutral-800 text-base">Grafik Kurva Massa Kumulatif</CardTitle>
                            {result && (
                                <Button variant="secondary" size="icon" className="h-8 w-8">
                                    <Download className="h-4 w-4" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="flex-1 p-6 flex flex-col justify-center">
                            {!chartData ? (
                                <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-3">
                                    <Spline className="w-12 h-12 opacity-20" />
                                    <p className="text-sm font-medium">Klik Kalkulasi untuk menampilkan grafik</p>
                                </div>
                            ) : (
                                <div className="w-full h-full min-h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#BAE6FD" />
                                            <XAxis
                                                dataKey="month"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#0EA5E9', fontSize: 12 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#0EA5E9', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #BAE6FD', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
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
                                                stroke="#DC2626"
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
