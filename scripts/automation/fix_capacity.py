with open("src/features/embung/components/CapacityAnalysisTab.tsx", "w", encoding="utf-8") as f:
    f.write("""import { useState, useEffect } from 'react';
import { CardGovTech } from "@/components/ui/CardGovTech";
import { ButtonGovTech } from "@/components/ui/ButtonGovTech";
import { TableGovTech } from "@/components/ui/TableGovTech";
import { Input } from "@/components/ui/input";
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { Download, Calculator, Waves, Spline, Loader2, Sparkles, Droplets } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import { calculateSequentPeak } from '@/lib/engine/embung';
import { HydroValidationError } from '../types/embung.types';
import type { MonthlyData, SequentPeakResult } from '../types/embung.types';
import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { DependencyWarningBanner } from '@/components/ui/DependencyWarningBanner';

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
    const { neracaFinal, isNeracaDirty } = useHydrologyStore();
    const isAutoFilled = Boolean(neracaFinal && neracaFinal.length === 12);

    const [data, setData] = useState<MonthlyData[]>(INITIAL_DATA);
    const [result, setResult] = useState<SequentPeakResult | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    useEffect(() => {
        if (neracaFinal && neracaFinal.length === 12) {
            setData(neracaFinal.map((r: any, i: number) => ({
                id: String(i + 1),
                month: r.month,
                inflow: Number(r.ketersediaan.toFixed(2)),
                outflow: Number(r.totalKebutuhan.toFixed(2))
            })));
        }
    }, [neracaFinal]);

    const handleInputChange = (id: string, field: keyof MonthlyData, value: string) => {
        if (isAutoFilled) return;
        const numValue = parseFloat(value) || 0;
        setData(prev => prev.map(row => row.id === id ? { ...row, [field]: numValue } : row));
    };

    const handleCalculate = () => {
        setIsCalculating(true);
        setResult(null);

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
                }
            } finally {
                setIsCalculating(false);
            }
        }, 50);
    };

    const chartData = result?.massCurveData.map(p => ({
        month: p.month,
        cumulativeInflow: p.cumulativeInflow,
        cumulativeOutflow: p.cumulativeOutflow,
    })) ?? null;

    const tableColumns = [
        { key: 'month', label: 'Bulan', align: 'left' as const },
        { key: 'inflow', label: 'Inflow (Juta m³)', align: 'right' as const },
        { key: 'outflow', label: 'Outflow (Juta m³)', align: 'right' as const },
    ];

    const tableData = data.map((row) => ({
        month: <span className="font-bold text-slate-700">{row.month}</span>,
        inflow: (
            <Input
                type="number"
                value={row.inflow}
                className="h-8 text-right text-sm font-medium tabular-nums tracking-tight border-slate-200"
                onChange={(e) => handleInputChange(row.id, 'inflow', e.target.value)}
                disabled={isAutoFilled}
            />
        ),
        outflow: (
            <Input
                type="number"
                value={row.outflow}
                className="h-8 text-right text-sm font-medium tabular-nums tracking-tight border-slate-200"
                onChange={(e) => handleInputChange(row.id, 'outflow', e.target.value)}
                disabled={isAutoFilled}
            />
        )
    }));

    return (
        <div className="flex flex-col h-full gap-6">
            {isAutoFilled && isNeracaDirty && <DependencyWarningBanner module="neraca" />}
            
            <div className="mb-2">
                <FormulaAccordion 
                    title="Kapasitas Waduk (Kurva Massa Rippl)"
                    subtitle="Penentuan Volume Tampungan Efektif"
                    theme="blue"
                    formulas={[
                        { label: "Selisih Kumulatif", math: "S_t = S_{t-1} + I_t - O_t" },
                        { label: "Kapasitas Tampungan Aktif", math: "V_{aktif} = \\max(S_t) - \\min(S_t)" }
                    ]}
                    parameters={[
                        { symbol: "S_t", description: "Tampungan pada waktu t", unit: "m³" },
                        { symbol: "I_t", description: "Aliran masuk (inflow) pada waktu t", unit: "m³" },
                        { symbol: "O_t", description: "Kebutuhan air (outflow) pada waktu t", unit: "m³" },
                        { symbol: "V_{aktif}", description: "Volume tampungan efektif yang dibutuhkan", unit: "m³" }
                    ]}
                    reference="Metode Kurva Massa Rippl (Kriteria Perencanaan Irigasi KP-02)"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">
                    <CardGovTech 
                        title="Data Hidrologi Bulanan"
                        headerAction={
                            <div className="flex items-center gap-2">
                                <ButtonGovTech
                                    variant="pupr-primary"
                                    onClick={handleCalculate}
                                    disabled={isCalculating}
                                >
                                    {isCalculating ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Menghitung...</>
                                    ) : (
                                        <><Calculator className="w-4 h-4" /> Kalkulasi</>
                                    )}
                                </ButtonGovTech>
                                {result && onConsultAI && (
                                    <ButtonGovTech
                                        variant="pupr-accent"
                                        onClick={() => onConsultAI({ inputData: data }, result)}
                                    >
                                        <Sparkles className="w-4 h-4" /> AI
                                    </ButtonGovTech>
                                )}
                            </div>
                        }
                    >
                        <div className="mt-4">
                            <TableGovTech 
            
