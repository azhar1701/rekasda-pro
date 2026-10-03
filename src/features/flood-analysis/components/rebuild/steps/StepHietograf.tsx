import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { CloudRain, Droplets, Calculator, TrendingUp, ShieldCheck, Info } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { useFrequencyAnalysis } from '@/hooks/useFrequencyAnalysis';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateHourlyDistributionTable, type HourlyRainfallMethod } from '@/lib/utils/hydrologyMath';
import { toast } from '@/hooks/useToast';
import { calculateEffectiveRainfallByC, calculateCumulativeSCSCNRunoff } from '@/lib/utils/hydrology/runoff';

interface StepHietografProps {
    onComplete: () => void;
    isCompleted: boolean;
}

const RETURN_PERIOD_OPTIONS = [2, 5, 10, 20, 25, 50, 100];

export const StepHietograf: React.FC<StepHietografProps> = ({ onComplete }) => {
    const { getR24, selectedKalaUlang } = useFrequencyAnalysis();
    const {
        tutupanLahan,
        morfometriDAS,
        activeRainfallSource,
        hasilARF,
        setSelectedKalaUlang,
        setHujanEfektif,
        setDistribusiHujanJamJaman,
        setDurasiHujan,
        durasiHujan: storeDurasi,
        hujanEfektif: storeHujanEfektif
    } = useHydrologyStore();

    const [returnPeriod, setReturnPeriod] = useState<number>(selectedKalaUlang || 25);
    const [durasi, setLocalDurasi] = useState<number>(storeDurasi || 6);
    const [distMethod, setDistMethod] = useState<HourlyRainfallMethod>('abm');
    const [lossMethod, setLossMethod] = useState<'C' | 'CN'>('C');
    const [useARF, setUseARF] = useState<boolean>(true);
    const [calculated, setCalculated] = useState(!!storeHujanEfektif);

    // Ambil R24 titik dari analisis frekuensi
    const rawR24 = getR24(returnPeriod) || 0;
    const luasDAS = morfometriDAS?.luasDAS || 0;
    const isArealSource = activeRainfallSource === 'thiessen' || activeRainfallSource === 'aljabar' || activeRainfallSource === 'isohyet';

    // Perhitungan faktor reduksi luas (ARF)
    const arfValue = useMemo(() => {
        if (isArealSource) return 1.0; // Sudah hujan wilayah, tidak perlu reduksi ganda
        if (hasilARF?.arfValue) return hasilARF.arfValue;
        if (luasDAS <= 20) return 1.0;
        // Formula Horton/Bell standar metrik untuk durasi 24 jam
        const calculated = Math.max(0.70, Math.min(1.0, 1.0 - 0.04 * Math.log10(luasDAS / 20)));
        return parseFloat(calculated.toFixed(3));
    }, [isArealSource, hasilARF, luasDAS]);

    // Hujan rencana efektif wilayah yang diterapkan ke DAS
    const effectiveR24 = useMemo(() => {
        if (isArealSource || !useARF) return rawR24;
        return rawR24 * arfValue;
    }, [rawR24, arfValue, isArealSource, useARF]);

    const C = tutupanLahan?.koefisienPengaliranGabungan || 0.65;
    const CN = tutupanLahan?.curveNumberGabungan || 75;

    // Sinkronisasi dengan store
    useEffect(() => {
        if (selectedKalaUlang && selectedKalaUlang !== returnPeriod) {
            setReturnPeriod(selectedKalaUlang);
        }
    }, [selectedKalaUlang]);

    const handleReturnPeriodChange = (tr: number) => {
        setReturnPeriod(tr);
        setSelectedKalaUlang(tr);
    };

    // Generate tabel distribusi jam-jaman multi-metode
    const distributionTable = useMemo(() => {
        if (effectiveR24 <= 0) return [];
        return generateHourlyDistributionTable(distMethod, effectiveR24, durasi);
    }, [distMethod, effectiveR24, durasi]);

    // Hitung hujan efektif dan kehilangan (losses)
    const calculationResults = useMemo(() => {
        if (distributionTable.length === 0) return { hyetograph: [], effective: [], losses: [] };

        const hyetograph = distributionTable.map(row => row.hujanJam);
        let effective: number[] = [];

        if (lossMethod === 'C') {
            effective = hyetograph.map(p => calculateEffectiveRainfallByC(p, C));
        } else {
            // Standar NRCS NEH-4: Kumulatif Abstraksi Badai
            effective = calculateCumulativeSCSCNRunoff(hyetograph, CN);
        }

        const losses = hyetograph.map((p, i) => Math.max(0, p - (effective[i] || 0)));

        return { hyetograph, effective, losses };
    }, [distributionTable, lossMethod, C, CN]);

    const chartData = useMemo(() => {
        return calculationResults.hyetograph.map((p, i) => ({
            jam: i + 1,
            total: Number(p.toFixed(2)),
            efektif: Number((calculationResults.effective[i] || 0).toFixed(2)),
            losses: Number((calculationResults.losses[i] || 0).toFixed(2))
        }));
    }, [calculationResults]);

    const handleCalculate = () => {
        if (effectiveR24 <= 0) {
            toast.error('Data Hujan Rencana (R24) belum tersedia. Selesaikan Analisis Frekuensi terlebih dahulu.');
            return;
        }
        setCalculated(true);
        const methodName = distMethod === 'abm' ? 'ABM' : distMethod === 'pusair' ? 'Pusair' : distMethod === 'mononobe_forward' ? 'Mononobe' : 'Uniform';
        toast.success(`Hietograf hujan jam-jaman ${methodName} (Q${returnPeriod}) berhasil dihitung.`);
    };

    const handleComplete = () => {
        setDistribusiHujanJamJaman(calculationResults.hyetograph);
        setHujanEfektif(calculationResults.effective);
        setDurasiHujan(durasi);
        onComplete();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header Konteks Kala Ulang & Hujan Rencana */}
            <div className="bg-pupr-blue/5 border border-pupr-blue/20 rounded-md p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pupr-blue/10 rounded-lg text-pupr-blue">
                            <CloudRain className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Kala Ulang Rencana Terpilih</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-extrabold text-slate-900">Periode Ulang {returnPeriod} Tahun (Q{returnPeriod})</span>
                                <span className="text-xs text-pupr-blue font-bold font-mono">
                                    R24 = {effectiveR24.toFixed(2)} mm
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Selector Periode Ulang */}
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                        {RETURN_PERIOD_OPTION_BUTTONS(RETURN_PERIOD_OPTIONS, returnPeriod, handleReturnPeriodChange)}
                    </div>
                </div>

                {/* Banner ARF / Proteksi Reduksi Luas */}
                <div className="mt-3 pt-3 border-t border-pupr-blue/10 flex flex-wrap items-center justify-between text-xs">
                    {isArealSource ? (
                        <div className="flex items-center gap-2 text-green-700 font-medium">
                            <ShieldCheck className="w-4 h-4 text-green-600" />
                            <span>Input merupakan <b>Hujan Wilayah Komposit</b> (ARF = 1.00 — Reduksi ganda dicegah otomatis).</span>
                        </div>
                    ) : luasDAS > 20 ? (
                        <div className="flex items-center gap-3 text-slate-700">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-pupr-blue" />
                                <span>Luas DAS {luasDAS.toFixed(1)} km² (&gt; 20 km²): Faktor Reduksi Luas (ARF = {arfValue.toFixed(3)}).</span>
                            </div>
                            <label className="flex items-center gap-1 cursor-pointer text-pupr-blue font-bold">
                                <input
                                    type="checkbox"
                                    checked={useARF}
                                    onChange={(e) => setUseARF(e.target.checked)}
                                    className="rounded border-slate-300 text-pupr-blue focus:ring-pupr-blue"
                                />
                                <span>Terapkan ARF ({rawR24.toFixed(1)} mm &rarr; {effectiveR24.toFixed(1)} mm)</span>
                            </label>
                        </div>
                    ) : (
                        <div className="text-slate-500">
                            Luas DAS &le; 20 km²: Hujan titik setara hujan wilayah (ARF = 1.00).
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Pengaturan Hietograf */}
                <Card className="p-5 bg-white border border-slate-300 shadow-sm rounded-md lg:col-span-1">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-pupr-blue" />
                        Parameter Distribusi Hujan
                    </h3>

                    <div className="space-y-4">
                        {/* Selector Metode Distribusi Jam-jaman */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                Pola Distribusi Jam-jaman
                            </label>
                            <div className="grid grid-cols-1 gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setDistMethod('abm')}
                                    className={`p-2 text-left text-xs rounded-md border transition-all ${
                                        distMethod === 'abm'
                                            ? 'border-pupr-blue bg-pupr-blue/5 text-pupr-blue font-bold shadow-xs'
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold">ABM (Mononobe)</span>
                                        <span className="text-[9px] px-1.5 py-0.5 bg-pupr-blue text-white rounded font-bold">SNI 2415</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Alternating block: puncak hujan di tengah badai</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDistMethod('pusair')}
                                    className={`p-2 text-left text-xs rounded-md border transition-all ${
                                        distMethod === 'pusair'
                                            ? 'border-pupr-blue bg-pupr-blue/5 text-pupr-blue font-bold shadow-xs'
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold">Pola Pusair (Ditjen SDA)</span>
                                        <span className="text-[9px] px-1.5 py-0.5 bg-amber-600 text-white rounded font-bold">Empiris ID</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Studi empiris penakar hujan wilayah Indonesia (puncak jam ke-2)</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDistMethod('mononobe_forward')}
                                    className={`p-2 text-left text-xs rounded-md border transition-all ${
                                        distMethod === 'mononobe_forward'
                                            ? 'border-pupr-blue bg-pupr-blue/5 text-pupr-blue font-bold shadow-xs'
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <span className="font-bold">Mononobe Terurut Menurun</span>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Intensitas terbesar di awal durasi badai</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDistMethod('uniform')}
                                    className={`p-2 text-left text-xs rounded-md border transition-all ${
                                        distMethod === 'uniform'
                                            ? 'border-pupr-blue bg-pupr-blue/5 text-pupr-blue font-bold shadow-xs'
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <span className="font-bold">Distribusi Seragam (Uniform)</span>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Curah hujan terbagi rata setiap jam</p>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Durasi Hujan Total</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={durasi}
                                    onChange={(e) => setLocalDurasi(Math.max(1, Math.min(24, Number(e.target.value))))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-bold focus:ring-1 focus:ring-pupr-blue focus:outline-none"
                                    min="1"
                                    max="24"
                                />
                                <span className="absolute right-3 top-2 text-slate-400 font-semibold text-sm">jam</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Standar teknis hidrograf rencana: 4, 6, 8, s/d 24 jam</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Metode Reduksi Limpasan (Losses)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setLossMethod('C')}
                                    className={`py-2 px-3 text-xs font-bold rounded-md border-2 transition-all ${
                                        lossMethod === 'C'
                                            ? 'border-pupr-blue bg-pupr-blue/5 text-pupr-blue shadow-sm'
                                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    Koefisien C ({C.toFixed(2)})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLossMethod('CN')}
                                    className={`py-2 px-3 text-xs font-bold rounded-md border-2 transition-all ${
                                        lossMethod === 'CN'
                                            ? 'border-green-600 bg-green-50 text-green-700 shadow-sm'
                                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    SCS-CN ({CN.toFixed(0)})
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">
                                {lossMethod === 'C' ? 'Pengurangan proporsional P_eff = P × C' : 'Abstraksi kumulatif NRCS NEH-4 (Ia = 0.2S)'}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleCalculate}
                            className="w-full py-3 bg-pupr-blue hover:bg-pupr-blue/90 text-white font-bold rounded-md shadow-sm transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            <TrendingUp className="w-4 h-4" />
                            Hitung Distribusi {distMethod === 'abm' ? 'ABM' : distMethod === 'pusair' ? 'Pusair' : distMethod === 'mononobe_forward' ? 'Mononobe' : 'Seragam'}
                        </button>
                    </div>
                </Card>

                {/* Grafik Hietograf Jam-jaman */}
                <Card className="p-5 bg-white border border-slate-300 shadow-sm rounded-md lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Droplets className="w-4 h-4 text-pupr-blue" />
                                Hietograf Hujan Jam-jaman ({distMethod === 'abm' ? 'Alternating Block Method' : distMethod === 'pusair' ? 'Pola Pusair Ditjen SDA' : distMethod === 'mononobe_forward' ? 'Mononobe Menurun' : 'Distribusi Seragam'})
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium">Hujan rencana terdistribusi ke badai jam-jaman siap konvolusi</p>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] font-bold">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm bg-slate-300" />
                                <span className="text-slate-500">INFILTRASI / LOSSES</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm bg-pupr-blue" />
                                <span className="text-pupr-blue font-extrabold">HUJAN EFEKTIF</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[250px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="jam"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700 }}
                                    label={{ value: 'Jam Ke-', position: 'insideBottom', offset: -4, style: { fontSize: 10, fontWeight: 700 } }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700 }}
                                    label={{ value: 'Presipitasi (mm)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fontWeight: 700 } }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    formatter={(value: any, name: string) => [
                                        `${Number(value).toFixed(2)} mm`,
                                        name === 'efektif' ? 'Hujan Efektif' : 'Infiltrasi (Losses)'
                                    ]}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                                />
                                <Bar dataKey="losses" stackId="a" fill="#cbd5e1" radius={[0, 0, 0, 0]} name="losses" />
                                <Bar dataKey="efektif" stackId="a" fill="#0c3a66" radius={[2, 2, 0, 0]} name="efektif" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Rekap Hujan Efektif & Tombol Lanjut */}
            {calculated && (
                <Card className="p-4 bg-green-50 border border-green-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-md">
                    <div>
                        <p className="text-xs font-bold text-green-700 uppercase">Hujan Efektif Rencana (Total Limpasan Langsung)</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-green-900 tabular-nums">
                                {calculationResults.effective.reduce((a, b) => a + b, 0).toFixed(2)}
                            </span>
                            <span className="text-sm font-bold text-green-700">mm</span>
                            <span className="text-xs text-slate-500 ml-2">
                                (dari total curah hujan {effectiveR24.toFixed(2)} mm)
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleComplete}
                        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md shadow-md hover:shadow-lg transition-all"
                    >
                        Terapkan & Lanjut ke Analisis Debit →
                    </button>
                </Card>
            )}
        </div>
    );
};

function RETURN_PERIOD_OPTION_BUTTONS(options: number[], current: number, onSelect: (tr: number) => void) {
    return options.map(tr => (
        <button
            key={tr}
            type="button"
            onClick={() => onSelect(tr)}
            className={`px-2.5 py-1 text-xs font-bold rounded transition-all ${
                current === tr
                    ? 'bg-pupr-blue text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
            Q{tr}
        </button>
    ));
}
