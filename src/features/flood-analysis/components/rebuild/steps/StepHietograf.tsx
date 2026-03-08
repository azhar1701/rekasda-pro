import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { CloudRain, Droplets, Calculator, TrendingUp } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { useFrequencyAnalysis } from '@/hooks/useFrequencyAnalysis';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateABMTable } from '@/lib/utils/hydrologyMath';
import { toast } from '@/hooks/useToast';
import { calculateEffectiveRainfallByC, calculateEffectiveRainfallByCN } from '@/lib/utils/hydrology/runoff';

interface StepHietografProps {
    onComplete: () => void;
    isCompleted: boolean;
}

export const StepHietograf: React.FC<StepHietografProps> = ({ onComplete }) => {
    const { getR24, selectedKalaUlang } = useFrequencyAnalysis();
    const {
        tutupanLahan,
        setHujanEfektif,
        setDistribusiHujanJamJaman,
        setDurasiHujan,
        durasiHujan: storeDurasi,
        hujanEfektif: storeHujanEfektif
    } = useHydrologyStore();

    const [returnPeriod, setReturnPeriod] = useState(selectedKalaUlang || 25);
    const [durasi, setLocalDurasi] = useState(storeDurasi || 6);
    const [lossMethod, setLossMethod] = useState<'C' | 'CN'>('C');
    const [calculated, setCalculated] = useState(!!storeHujanEfektif);

    const R24 = getR24(returnPeriod) || 0;
    const C = tutupanLahan?.koefisienPengaliranGabungan || 0.65;
    const CN = tutupanLahan?.curveNumberGabungan || 75;

    // Sync dengan store kala ulang
    useEffect(() => {
        if (selectedKalaUlang) setReturnPeriod(selectedKalaUlang);
    }, [selectedKalaUlang]);

    // Generate ABM Table
    const abmTable = useMemo(() => {
        if (R24 <= 0) return [];
        // generateABMTable(R24, durasi, timeStep)
        return generateABMTable(R24, durasi, 1);
    }, [R24, durasi]);

    // Calculate Effective Rainfall & Hyetograph
    const calculationResults = useMemo(() => {
        if (abmTable.length === 0) return { hyetograph: [], effective: [], losses: [] };

        const hyetograph = abmTable.map(row => row.hyetograph);
        let effective: number[] = [];

        if (lossMethod === 'C') {
            effective = hyetograph.map(p => calculateEffectiveRainfallByC(p, C));
        } else {
            effective = hyetograph.map(p => calculateEffectiveRainfallByCN(p, CN));
        }

        const losses = hyetograph.map((p, i) => p - effective[i]);

        return { hyetograph, effective, losses };
    }, [abmTable, lossMethod, C, CN]);

    const chartData = useMemo(() => {
        return calculationResults.hyetograph.map((p, i) => ({
            jam: i + 1,
            total: Number(p.toFixed(2)),
            efektif: Number(calculationResults.effective[i].toFixed(2)),
            losses: Number(calculationResults.losses[i].toFixed(2))
        }));
    }, [calculationResults]);

    const handleCalculate = () => {
        if (R24 <= 0) {
            toast.error('Data Hujan Rencana (R24) belum tersedia. Selesaikan Analisis Frekuensi.');
            return;
        }
        setCalculated(true);
        toast.success(`Hietograf hasil ABM (Q${returnPeriod}) berhasil dihitung`);
    };

    const handleComplete = () => {
        setDistribusiHujanJamJaman(calculationResults.hyetograph);
        setHujanEfektif(calculationResults.effective);
        setDurasiHujan(durasi);
        onComplete();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Contextual Header */}
            <div className="bg-pupr-blue/5 border border-pupr-blue/20 rounded-md p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <CloudRain className="w-5 h-5 text-pupr-blue" />
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Hujan Rencana Terpilih</p>
                        <p className="text-sm font-bold text-slate-900">Q{returnPeriod} = {R24.toFixed(2)} mm</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">SNI 2415:2016</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-5 bg-white border border-slate-300 shadow-sm rounded-md lg:col-span-1">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-pupr-blue" />
                        Parameter Distribusi
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Durasi Hujan (jam)</label>
                            <input
                                type="number"
                                value={durasi}
                                onChange={(e) => setLocalDurasi(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md font-bold focus:ring-1 focus:ring-pupr-blue focus:outline-none"
                                min="1"
                                max="24"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Metode Reduksi (Losses)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setLossMethod('C')}
                                    className={`py-2 text-xs font-bold rounded-md border-2 transition-all ${lossMethod === 'C' ? 'border-pupr-blue bg-pupr-blue/5 text-pupr-blue' : 'border-slate-200 text-slate-500'
                                        }`}
                                >
                                    Koef. C ({C.toFixed(2)})
                                </button>
                                <button
                                    onClick={() => setLossMethod('CN')}
                                    className={`py-2 text-xs font-bold rounded-md border-2 transition-all ${lossMethod === 'CN' ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500'
                                        }`}
                                >
                                    SCS-CN ({CN.toFixed(0)})
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleCalculate}
                            className="w-full py-3 bg-[#0c3a66] hover:bg-[#0d4578] text-white font-bold rounded-md shadow-sm transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            <TrendingUp className="w-4 h-4" />
                            Hitung Hietograf
                        </button>
                    </div>
                </Card>

                <Card className="p-5 bg-white border border-slate-300 shadow-sm rounded-md lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-pupr-blue" />
                            Hyetograph (Distribusi Jam-jaman)
                        </h3>
                        <div className="flex items-center gap-4 text-[10px] font-bold">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-slate-400" /> LOSSES</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-pupr-blue" /> EFEKTIF</div>
                        </div>
                    </div>

                    <div className="h-[250px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="jam" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }}
                                />
                                <Bar dataKey="losses" stackId="a" fill="#cbd5e1" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="efektif" stackId="a" fill="#0c3a66" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {calculated && (
                <Card className="p-4 bg-green-50 border border-green-200 flex justify-between items-center rounded-md">
                    <div>
                        <p className="text-xs font-bold text-green-700 uppercase">Hujan Efektif Kumulatif</p>
                        <p className="text-xl font-black text-green-900 tabular-nums">
                            {calculationResults.effective.reduce((a, b) => a + b, 0).toFixed(2)} <span className="text-sm font-normal">mm</span>
                        </p>
                    </div>
                    <button
                        onClick={handleComplete}
                        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md shadow-md hover:shadow-lg transition-all"
                    >
                        Terapkan & Lanjut ke HSS →
                    </button>
                </Card>
            )}
        </div>
    );
};
