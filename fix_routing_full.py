with open("src/features/embung/components/RoutingAnalysisTab.tsx", "w", encoding="utf-8") as f:
    f.write("""import { useState, useEffect } from 'react';
import { CardGovTech } from "@/components/ui/CardGovTech";
import { ButtonGovTech } from "@/components/ui/ButtonGovTech";
import { TableGovTech } from "@/components/ui/TableGovTech";
import { Input } from "@/components/ui/input";
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { Download, Calculator, Activity, ArrowDownRight, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { calculateFloodRouting } from '@/lib/engine/embung';
import { toast } from '@/hooks/useToast';
import { HydroValidationError } from '@/features/embung/types/embung.types';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { DependencyWarningBanner } from '@/components/ui/DependencyWarningBanner';
import { ProjectContextBanner } from '@/components/ui/ProjectContextBanner';
import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';

const DEFAULT_HYDROGRAPH = [
    { time: 0, inflow: 0 }, { time: 1, inflow: 15 }, { time: 2, inflow: 45 },
    { time: 3, inflow: 120 }, { time: 4, inflow: 85 }, { time: 5, inflow: 50 },
    { time: 6, inflow: 25 }, { time: 7, inflow: 10 }, { time: 8, inflow: 0 },
];
const MOCK_STAGE_STORAGE = { elevation: [100, 101, 102, 103, 104, 105], area: [0, 10000, 22000, 35000, 50000, 67000] };
const MOCK_STAGE_DISCHARGE = { elevation: [100, 101, 102, 103, 104, 105], discharge: [0, 5, 15, 35, 65, 110] };

interface RoutingAnalysisTabProps {
    onConsultAI?: (data: any, result: any) => void;
}

export const RoutingAnalysisTab: React.FC<RoutingAnalysisTabProps> = ({ onConsultAI }) => {
    const [isCalculating, setIsCalculating] = useState(false);
    const { hasilBanjir, isBanjirDirty, setHasilEmbung } = useHydrologyStore();
    const isAutoFilled = Boolean(hasilBanjir?.hidrograf?.length);

    const [hydrograph, setHydrograph] = useState(DEFAULT_HYDROGRAPH);

    useEffect(() => {
        if (isAutoFilled && hasilBanjir) {
            setHydrograph(hasilBanjir.hidrograf.map(h => ({ time: h.time, inflow: h.inflow })));
            setResultData(null);
            setSummary(null);
        }
    }, [isAutoFilled, hasilBanjir]);

    const [resultData, setResultData] = useState<any[] | null>(null);
    const [summary, setSummary] = useState<{ peakInflow: number, peakOutflow: number, attenuation: number } | null>(null);

    const handleInflowChange = (index: number, val: string) => {
        const newHydro = [...hydrograph];
        newHydro[index].inflow = parseFloat(val) || 0;
        setHydrograph(newHydro);
        setResultData(null);
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

        setTimeout(() => {
            try {
                const dt = 3600; 
                const result = calculateFloodRouting(
                    hydrograph,
                    MOCK_STAGE_STORAGE.elevation,
                    MOCK_STAGE_STORAGE.area,
                    MOCK_STAGE_DISCHARGE.discharge,
                    dt
                );

                const chartFormat = result.routingTable.map(r => ({
                    time: r.time,
                    Inflow: r.inflow,
                    Outflow: r.outflow,
                    Elevasi: r.elevation
                }));

                setResultData(chartFormat);
                const s = {
                    peakInflow: result.peakInflow,
                    peakOutflow: result.peakOutflow,
                    attenuation: result.attenuationPercent
                };
                setSummary(s);
                
                setHasilEmbung({
                    isAman: s.peakOutflow <= s.peakInflow,
                    reduksiPuncak: s.attenuation,
                    umurSedimen: 50 // mock
                });

                toast.success(`Routing selesai. Puncak debit tereduksi sebesar ${result.attenuationPercent.toFixed(1)}%`);
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

    const tableColumns = [
        { key: 'time', label: 'Waktu (Jam)', align: 'left' as const },
        { key: 'inflow', label: 'Inflow (m³/s)', align: 'right' as const, numeric: true }
    ];

    const tableData = hydrograph.map((row, index) => ({
        time: <span className="font-bold text-slate-700">{row.time}</span>,
        inflow: (
            <Input
                type="number"
                value={row.inflow}
                className="h-8 text-right text-sm font-medium tabular-nums tracking-tight border-slate-200"
                onChange={(e) => handleInflowChange(index, e.target.value)}
                readOnly={isAutoFilled}
            />
        )
    }));

    return (
        <div className="flex flex-col h-full gap-6">
            <ProjectContextBanner />

            {isAutoFilled && isBanjirDirty && (
                <DependencyWarningBanner module="banjir" />
            )}

            <div className="mb-2">
                <FormulaAccordion 
                    title="Penelusuran Banjir (Flood Routing)"
                    subtitle="Persamaan Kontinuitas Waduk (Level-Pool Routing)"
                    theme="purple"
                    formulas={[
                        { label: "Persamaan Kontinuitas Waduk", math: "\\frac{I_1 + I_2}{2} - \\frac{O_1 + O_2}{2} = \\frac{S_2 - S_1}{\\Delta t}" },
                        { label: "Bentuk Modifikasi (Fungsi Indikator)", math: "\\left( \\frac{I_1 + I_2}{2} \\right) + \\left( \\frac{S_1}{\\Delta t} - \\frac{O_1}{2} \\right) = \\left( \\frac{S_2}{\\Delta t} + \\frac{O_2}{2} \\right)" }
                    ]}
                    parameters={[
                        { symbol: "I_1, I_2", description: "Debit masuk (inflow) pada t_1 dan t_2", unit: "m³/s" },
                        { symbol: "O_1, O_2", description: "Debit keluar (outflow) pada t_1 dan t_2", unit: "m³/s" },
                        { symbol: "S_1, S_2", description: "Volume tampungan pada t_1 dan t_2", unit: "m³" },
                        { symbol: "\\Delta t", description: "Interval waktu routing", unit: "detik" }
                    ]}
                    reference="Chow, V.T. (1988). Applied Hydrology. Tata Cara Penelusuran Banjir Embung"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
                    <CardGovTech 
                        title="Hidrograf Inflow"
                        headerAction={
                            <div className="flex items-center gap-2">
                                <ButtonGovTech
                                    variant="pupr-primary"
                                    onClick={handleCalculate}
                                    disabled={isCalculating}
                                >
                                    {isCalculating ? 'Menghitung...' : 'Kalkulasi'}
                                </ButtonGovTech>
                            </div>
                        }
                    >
                        <div className="mt-4">
                            <TableGovTech 
                                columns={tableColumns}
                                data={tabl
