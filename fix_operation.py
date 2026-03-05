with open("src/features/embung/components/OperationPatternTab.tsx", "w", encoding="utf-8") as f:
    content = """import { useState, useEffect } from 'react';
import { CardGovTech } from "@/components/ui/CardGovTech";
import { ButtonGovTech } from "@/components/ui/ButtonGovTech";
import { TableGovTech } from "@/components/ui/TableGovTech";
import { Input } from "@/components/ui/input";
import { Area, AreaChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Calculator, Info, Waves, CheckCircle2, AlertCircle, Droplets, Sparkles } from 'lucide-react';
import { simulateReservoirOperation } from '@/lib/engine/embung';
import { toast } from '@/hooks/useToast';
import { HydroValidationError } from '@/features/embung/types/embung.types';
import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { DependencyWarningBanner } from '@/components/ui/DependencyWarningBanner';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Des'];

const DEFAULT_INPUTS = MONTHS.map((m, i) => ({
    id: String(i),
    month: m,
    inflow: Math.floor(Math.random() * 50) + 20,
    demand: 30,
    evap: 120,
    rain: Math.floor(Math.random() * 200),
}));

const CONFIG = {
    surfaceArea: 5,
    initialStorage: 100,
    deadStorage: 20,
    maxStorage: 250,
};

interface OperationPatternTabProps {
    onConsultAI?: (data: any, result: any) => void;
}

export const OperationPatternTab: React.FC<OperationPatternTabProps> = ({ onConsultAI }) => {
    const { neracaFinal, isNeracaDirty } = useHydrologyStore();
    const isAutoFilled = Boolean(neracaFinal && neracaFinal.length === 12);

    const [inputs, setInputs] = useState(() => {
        if (neracaFinal && neracaFinal.length === 12) {
            return DEFAULT_INPUTS.map((def, i) => ({
                ...def,
                inflow: Number(neracaFinal[i].ketersediaan.toFixed(2)),
                demand: Number(neracaFinal[i].totalKebutuhan.toFixed(2))
            }));
        }
        return DEFAULT_INPUTS;
    });

    const [config, setConfig] = useState(CONFIG);
    const [result, setResult] = useState<any | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    useEffect(() => {
        if (neracaFinal && neracaFinal.length === 12) {
            setInputs(prev => prev.map((p, i) => ({
                ...p,
                inflow: Number(neracaFinal[i].ketersediaan.toFixed(2)),
                demand: Number(neracaFinal[i].totalKebutuhan.toFixed(2))
            })));
        }
    }, [neracaFinal]);

    const handleInputChange = (id: string, field: string, value: string) => {
        if (isAutoFilled && (field === 'inflow' || field === 'demand')) return;
        setInputs(prev => prev.map(r => r.id === id ? { ...r, [field]: parseFloat(value) || 0 } : r));
    };
    
    const handleConfigChange = (field: string, value: string) => {
        setConfig(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    const handleCalculate = () => {
        setIsCalculating(true);
        setResult(null);

        setTimeout(() => {
            try {
                const configParams = {
                    surfaceArea: config.surfaceArea * 10000,
                    initialStorage: config.initialStorage * 1000,
                    deadStorage: config.deadStorage * 1000,
                    maxStorage: config.maxStorage * 1000,
                };

                const monthlyData = inputs.map(r => ({
                    inflow: r.inflow * 1000,
                    demand: r.demand * 1000,
                    evaporation: r.evap / 1000,
                    precipitation: r.rain / 1000,
                }));

                const r = simulateReservoirOperation(configParams, monthlyData);
                const chartData = r.monthlyResults.map((m, i) => ({
                    month: MONTHS[i],
                    volume: m.endStorage / 1000,
                    spill: m.spill / 1000,
                    deficit: m.deficit / 1000
                }));
                
                setResult({ ...r, chartData });
                toast.success(`Pola Operasi Selesai. Total Spill: ${(r.totalSpill/1000).toFixed(2)} Ribu m³, Defisit: ${(r.totalDeficit/1000).toFixed(2)} Ribu m³`);
            } catch (error: unknown) {
                if (error instanceof HydroValidationError) toast.error(`Validasi gagal: ${error.message}`);
                else if (error instanceof Error) toast.error(`Terjadi kesalahan: ${error.message}`);
            } finally {
                setIsCalculating(false);
            }
        }, 50);
    };

    const tableColumns = [
        { key: 'month', label: 'Bulan', align: 'left' as const },
        { key: 'inflow', label: 'Inflow (10³ m³)', align: 'right' as const },
        { key: 'demand', label: 'Kebutuhan (10³ m³)', align: 'right' as const },
        { key: 'evap', label: 'Evap (mm)', align: 'right' as const },
        { key: 'rain', label: 'Hujan (mm)', align: 'right' as const }
    ];

    const tableData = inputs.map((row) => ({
        month: <span className="font-bold text-slate-700">{row.month}</span>,
        inflow: <Input type="number" value={row.inflow} className="h-8 text-right tabular-nums border-slate-200" onChange={e => handleInputChange(row.id, 'inflow', e.target.value)} disabled={isAutoFilled} />,
        demand: <Input type="number" value={row.demand} className="h-8 text-right tabular-nums border-slate-200" onChange={e => handleInputChange(row.id, 'demand', e.target.value)} disabled={isAutoFilled} />,
        evap: <Input type="number" value={row.evap} className="h-8 text-right tabular-nums border-slate-200" onChange={e => handleInputChange(row.id, 'evap', e.target.value)} />,
        rain: <Input type="number" value={row.rain} className="h-8 text-right tabular-nums border-slate-200" onChange={e => handleInputChange(row.id, 'rain', e.target.value)} />
    }));

    return (
        <div className="flex flex-col h-full gap-6">
            {isAutoFilled && isNeracaDirty && <DependencyWarningBanner module="neraca" />}
            
            <div className="mb-2">
                <FormulaAccordion 
                    title="Simulasi Pola Operasi Waduk"
                    subtitle="Persamaan Keseimbangan Air Waduk"
                    theme="emerald"
                    formulas={[
                        { label: "Keseimbangan Air", math: "S_{t+1} = S_t + I_t + P_t - E_t - D_t - Sp_t" },
                        { label: "Evaporasi Volume", math: "E_t = e_t \\cdot A" },
                        { label: "Presipitasi Volume", math: "P_t = p_t \\cdot A" }
                    ]}
                    parameters={[
                        { symbol: "S_t", description: "Tampungan awal", unit: "m³" },
                        { symbol: "S_{t+1}", description: "Tampungan akhir", unit: "m³" },
                        { symbol: "I_t", description: "Inflow dari sungai", unit: "m³" },
                        { symbol: "D_t", description: "Demand / Kebutuhan pelepasan", unit: "m³" },
                        { symbol: "P_t, p_t", description: "Hujan di atas permukaan waduk", unit: "m³ / mm" },
                        { symbol: "E_t, e_t", description: "Evaporasi permukaan waduk", unit: "m³ / mm" },
                        { symbol: "Sp_t", description: "Limpasan (Spill) jika S > Max Storage", unit: "m³" }
                    ]}
                    reference="Kriteria Perencanaan Irigasi KP-02 (Pola Operasi Waduk)"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">
                    <CardGovTech title="Konfigurasi Waduk">
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="flex flex-col gap-1 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                                <span className="text-[10px] font-bold text-slat
