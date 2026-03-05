with open("src/features/embung/components/SedimentationTab.tsx", "w", encoding="utf-8") as f:
    f.write("""import { useState } from 'react';
import { CardGovTech } from "@/components/ui/CardGovTech";
import { ButtonGovTech } from "@/components/ui/ButtonGovTech";
import { TableGovTech } from "@/components/ui/TableGovTech";
import { Input } from "@/components/ui/input";
import { Calculator, Info, Mountain, CalendarClock, ArrowRightSquare, Trash2, Sparkles, Layers } from 'lucide-react';
import { calculateSedimentYield } from '@/lib/engine/embung';
import { toast } from '@/hooks/useToast';
import { HydroValidationError } from '@/features/embung/types/embung.types';
import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';

const DEFAULT_PARAMS = { catchmentArea: 45.5, bulkDensity: 1.2, bedLoadPercentage: 15 };
const DEFAULT_SAMPLES = [
    { id: 1, q: 2.5, cs: 150, days: 120 },
    { id: 2, q: 5.1, cs: 280, days: 125 },
    { id: 3, q: 8.2, cs: 420, days: 80 },
    { id: 4, q: 15.6, cs: 890, days: 30 },
    { id: 5, q: 45.0, cs: 2100, days: 10 },
];

interface SedimentationTabProps {
    onConsultAI?: (data: any, result: any) => void;
}

export const SedimentationTab: React.FC<SedimentationTabProps> = ({ onConsultAI }) => {
    const [params, setParams] = useState(DEFAULT_PARAMS);
    const [samples, setSamples] = useState(DEFAULT_SAMPLES);
    const [result, setResult] = useState<any | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const handleParamChange = (field: string, val: string) => {
        setParams(prev => ({ ...prev, [field]: parseFloat(val) || 0 }));
    };

    const handleSampleChange = (id: number, field: string, val: string) => {
        setSamples(prev => prev.map(s => s.id === id ? { ...s, [field]: parseFloat(val) || 0 } : s));
    };

    const handleAddSample = () => {
        setSamples(prev => [...prev, { id: Date.now(), q: 0, cs: 0, days: 0 }]);
    };

    const handleRemoveSample = (id: number) => {
        setSamples(prev => prev.filter(s => s.id !== id));
    };

    const handleCalculate = () => {
        setIsCalculating(true);
        setResult(null);

        setTimeout(() => {
            try {
                const totalDays = samples.reduce((sum, s) => sum + s.days, 0);
                if (totalDays !== 365) {
                    throw new HydroValidationError(`Total hari sampel arus adalah ${totalDays}. Harus tepat 365 hari.`);
                }

                const mappedSamples = samples.map(s => ({
                    discharge: s.q,
                    concentration: s.cs,
                    durationDays: s.days
                }));

                const r = calculateSedimentYield(params, mappedSamples);
                setResult(r);
                toast.success('Kalkulasi laju sedimentasi selesai');
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

    const tableColumns = [
        { key: 'q', label: 'Debit Q (m³/s)', align: 'left' as const },
        { key: 'cs', label: 'Konsentrasi Cs (mg/L)', align: 'left' as const },
        { key: 'days', label: 'Durasi (Hari)', align: 'left' as const },
        { key: 'actions', label: '', align: 'center' as const }
    ];

    const tableData = samples.map((s) => ({
        q: <Input type="number" value={s.q} className="h-8 tabular-nums border-slate-200" onChange={e => handleSampleChange(s.id, 'q', e.target.value)} />,
        cs: <Input type="number" value={s.cs} className="h-8 tabular-nums border-slate-200" onChange={e => handleSampleChange(s.id, 'cs', e.target.value)} />,
        days: <Input type="number" value={s.days} className="h-8 tabular-nums border-slate-200" onChange={e => handleSampleChange(s.id, 'days', e.target.value)} />,
        actions: (
            <button onClick={() => handleRemoveSample(s.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md">
                <Trash2 className="w-4 h-4" />
            </button>
        )
    }));

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="mb-2">
                <FormulaAccordion 
                    title="Laju Sedimentasi"
                    subtitle="Analisis Sedimen Layang (Suspended) & Dasar (Bed Load)"
                    theme="amber"
                    formulas={[
                        { label: "Laju Sedimen Layang (Qs)", math: "Q_s = 0.0864 \\cdot Q \\cdot C_s" },
                        { label: "Volume Sedimen Tahunan", math: "V_s = \\frac{\\sum (Q_{si} \\cdot \\Delta t_i) \\cdot (1 + p_{bed})}{B_d}" },
                        { label: "Laju Degradasi Spesifik", math: "S_y = \\frac{V_s}{A}" }
                    ]}
                    parameters={[
                        { symbol: "Q_s", description: "Laju sedimen layang harian", unit: "ton/hari" },
                        { symbol: "Q", description: "Debit aliran", unit: "m³/s" },
                        { symbol: "C_s", description: "Konsentrasi sedimen suspensi", unit: "mg/L" },
                        { symbol: "V_s", description: "Volume sedimen total tahunan", unit: "m³/tahun" },
                        { symbol: "p_{bed}", description: "Persentase bed load (umumnya 10-20%)", unit: "-" },
                        { symbol: "B_d", description: "Berat isi (Bulk density) sedimen", unit: "ton/m³" },
                        { symbol: "S_y", description: "Laju sedimentasi spesifik (Specific yield)", unit: "mm/tahun" }
                    ]}
                    reference="SNI 2411:2011 (Tata cara perhitungan sedimen layang)"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">
                    <CardGovTech title="Parameter DAS & Sifat Sedimen">
                        <div className="grid grid-cols-1 gap-3 mt-4">
                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                <span className="text-xs font-bold text-slate-700">Luas DAS (A)</span>
                                <div className="flex items-center gap-2">
                                    <Input type="number" value={params.catchmentArea} onChange={e => handleParamChange('catchmentArea', e.target.value)} className="w-24 h-8 tabular-nums text-right" />
                                    <span className="text-xs font-medium text-slate-500 w-10">km²</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                <span className="text-xs font-bold text-slate-700">Bulk Density</span>
                                <div className="flex items-center gap-2">
                                    <Input type="number" value={params.bulkDensity} onChange={e => handleParamChange('bulkDensity', e.target.value)} className="w-24 h-8 tabular-nums text-right" />
                                    <span className="text-xs font-medium text-slate-500 w-10">t/m³</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                <span className="text-xs font-bold text-slate-700">Porsi Bed Load</span>
                                <div className="flex items-center gap-2">
                                    <Input type="number" value={params.bedLoadPercentage} onChange={e => handleParamChange('bedLoadPercentage', e.target.value)} className="w-24 h-8 tabular-nums text-
