import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { useEmbungStore } from '../../../hooks/useEmbungStore';
import {
    calculateSedimentYield,
    calculateRegionalSedimentYield,
    REGIONAL_SEDIMENT_PRESETS
} from '@/lib/engine/embungEngine';
import { Trash2, Plus, Calculator, BarChart3, Clock, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { toast } from '@/hooks/useToast';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const StepSediment: React.FC = () => {
    const { state, dispatch } = useEmbungStore();
    const { luasDas: storeLuasDas, morfometriDAS } = useHydrologyStore();

    // Method selection: 'rating_curve' (Q vs Qs) or 'regional_sdr' (USLE & SDR)
    const [method, setMethod] = useState<'rating_curve' | 'regional_sdr'>('regional_sdr');

    // Luas DAS from store or geometry
    const initialLuasDas = useMemo(() => {
        const parsed = parseFloat(storeLuasDas);
        if (!isNaN(parsed) && parsed > 0) return parsed;
        if (morfometriDAS?.luasDAS) return morfometriDAS.luasDAS;
        return state.sedimentInput?.luasDas ?? 15;
    }, [storeLuasDas, morfometriDAS, state.sedimentInput?.luasDas]);

    // Dead Storage Volume from Zoning (Step 1)
    const initialDeadStorage = state.zoning?.deadStorageVolume && state.zoning.deadStorageVolume > 0
        ? state.zoning.deadStorageVolume
        : (state.stageStorageCurve && state.stageStorageCurve.storage.length > 1
            ? state.stageStorageCurve.storage[1]
            : 50000);

    const [deadStorageM3, setDeadStorageM3] = useState<number>(initialDeadStorage);

    // Rating Curve Data State
    const [samples, setSamples] = useState(
        state.sedimentInput?.qData?.map((q, i) => ({
            id: String(i),
            q: q,
            qs: state.sedimentInput!.qsData![i]
        })) ?? [
            { id: '1', q: 0.5, qs: 0.1 },
            { id: '2', q: 1.2, qs: 0.4 },
            { id: '3', q: 2.5, qs: 1.1 },
            { id: '4', q: 5.0, qs: 2.8 },
            { id: '5', q: 8.5, qs: 6.2 },
        ]
    );

    const [params, setParams] = useState({
        luasDas: initialLuasDas,
        beratJenis: state.sedimentInput?.beratJenis ?? 1.4,
        bedLoadPercentage: state.sedimentInput?.bedLoadPercentage ?? 15,
    });

    // Regional SDR State (SNI 03-3432-1994)
    const [selectedPresetId, setSelectedPresetId] = useState<string>('jawa_sedang');
    const [erosionRateMmYear, setErosionRateMmYear] = useState<number>(1.5);
    const [customSdr, setCustomSdr] = useState<string>('');
    const [regionalResult, setRegionalResult] = useState<ReturnType<typeof calculateRegionalSedimentYield> | null>(null);

    const handleAddSample = () => {
        setSamples([...samples, { id: String(Date.now()), q: 0, qs: 0 }]);
    };

    const handleRemoveSample = (id: string) => {
        if (samples.length > 2) {
            setSamples(samples.filter(s => s.id !== id));
        }
    };

    const handleSampleChange = (id: string, field: 'q' | 'qs', val: string) => {
        const numVal = parseFloat(val) || 0;
        setSamples(samples.map(s => s.id === id ? { ...s, [field]: numVal } : s));
    };

    const handlePresetChange = (presetId: string) => {
        setSelectedPresetId(presetId);
        const preset = REGIONAL_SEDIMENT_PRESETS.find(p => p.id === presetId);
        if (preset) {
            setErosionRateMmYear(preset.rateMmYear);
        }
    };

    const handleCalculate = () => {
        if (!state.stageStorageCurve) {
            toast.error("Lengkapi data Geometri (Langkah 1) terlebih dahulu!");
            return;
        }

        const maxStorage = state.stageStorageCurve.storage[state.stageStorageCurve.storage.length - 1];

        if (method === 'regional_sdr') {
            try {
                const sdrNum = customSdr ? parseFloat(customSdr) : undefined;
                const regRes = calculateRegionalSedimentYield({
                    luasDasKm2: params.luasDas,
                    erosionRateMmYear,
                    sdr: sdrNum,
                    beratJenisTonM3: params.beratJenis,
                    trapEfficiencyPercent: 95,
                    deadStorageM3
                });

                setRegionalResult(regRes);

                // Dispatch to store with compatible format
                dispatch({
                    type: 'SET_SEDIMENT_RESULT',
                    payload: {
                        a: 0,
                        b: 0,
                        bcf: 1,
                        suspendedLoadTonnes: regRes.sedimentYieldTonnes * (1 - params.bedLoadPercentage / 100),
                        bedLoadTonnes: regRes.sedimentYieldTonnes * (params.bedLoadPercentage / 100),
                        totalLoadTonnes: regRes.sedimentYieldTonnes,
                        totalVolumeM3: regRes.sedimentYieldM3,
                        trapEfficiency: regRes.trapEfficiencyPercent,
                        trappedVolumeM3: regRes.trappedVolumeM3,
                        erosionRateMm: regRes.erosionRateMmYear,
                        specificYield: regRes.sedimentYieldTonnes / params.luasDas,
                        lifespanYears: regRes.lifespanYears
                    }
                });

                // Sync umurSedimen to global store
                const curHasil = useHydrologyStore.getState().hasilEmbung;
                if (curHasil && regRes.lifespanYears) {
                    useHydrologyStore.getState().setHasilEmbung({
                        ...curHasil,
                        umurSedimen: Math.round(regRes.lifespanYears)
                    });
                }

                toast.success(`Estimasi Umur Guna: ${regRes.lifespanYears ? regRes.lifespanYears.toFixed(0) : '-'} Tahun`);
            } catch (err: any) {
                toast.error(`Kalkulasi Gagal: ${err.message}`);
            }
        } else {
            // Rating Curve method
            try {
                const result = calculateSedimentYield({
                    qData: samples.map(s => s.q),
                    qsData: samples.map(s => s.qs),
                    luasDas: params.luasDas,
                    beratJenis: params.beratJenis,
                    bedLoadPercentage: params.bedLoadPercentage,
                    reservoirCapacity: maxStorage, // In m³ directly (FIXED: no * 1000000 multiplier)
                    annualInflow: samples.reduce((a, b) => a + b.q, 0) * 86400 * 365,
                    deadStorageM3: deadStorageM3
                });

                dispatch({ type: 'SET_SEDIMENT_RESULT', payload: result });
                dispatch({
                    type: 'SET_SEDIMENT_INPUT', payload: {
                        ...params,
                        qData: samples.map(s => s.q),
                        qsData: samples.map(s => s.qs),
                        deadStorageM3
                    }
                });

                // Sync umurSedimen to global store
                const curHasil = useHydrologyStore.getState().hasilEmbung;
                if (curHasil && result.lifespanYears) {
                    useHydrologyStore.getState().setHasilEmbung({
                        ...curHasil,
                        umurSedimen: Math.round(result.lifespanYears)
                    });
                }

                toast.success(`Analisis Selesai. Umur guna: ${result.lifespanYears ? result.lifespanYears.toFixed(0) : '-'} Tahun`);
            } catch (err: any) {
                toast.error(`Kalkulasi Gagal: ${err.message}`);
            }
        }
    };

    const effectiveLifespan = method === 'regional_sdr'
        ? (regionalResult?.lifespanYears ?? 0)
        : (state.sedimentResult?.lifespanYears ?? 0);

    const effectiveTrappedVolume = method === 'regional_sdr'
        ? (regionalResult?.trappedVolumeM3 ?? 0)
        : (state.sedimentResult?.trappedVolumeM3 ?? 0);

    const effectiveTrapEfficiency = method === 'regional_sdr'
        ? (regionalResult?.trapEfficiencyPercent ?? 95)
        : (state.sedimentResult?.trapEfficiency ?? 0);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="flex items-start gap-3 bg-rose-50 p-4 rounded-lg border border-rose-100">
                <AlertTriangle className="w-5 h-5 text-rose-600 mt-1 shrink-0" />
                <div>
                    <h3 className="text-sm font-bold text-rose-900">Analisis Sedimentasi & Estimasi Umur Guna Embung (SNI 03-3432-1994)</h3>
                    <p className="text-xs text-rose-800/80 mt-1 leading-relaxed">
                        Evaluasi volume sedimen tahunan yang masuk dan terperangkap di waduk untuk memastikan kapasitas tampungan mati (dead storage) mencukupi masa layan teknis embung (target standar SNI: minimal 25–50 tahun).
                    </p>
                </div>
            </div>

            {/* Method Toggle */}
            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Metode Analisis:</span>
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                        <button
                            type="button"
                            onClick={() => setMethod('regional_sdr')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-l-lg border transition-colors ${
                                method === 'regional_sdr'
                                    ? 'bg-pupr-blue text-white border-pupr-blue'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            Laju Erosi Regional & SDR (Standar SNI)
                        </button>
                        <button
                            type="button"
                            onClick={() => setMethod('rating_curve')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-r-lg border transition-colors ${
                                method === 'rating_curve'
                                    ? 'bg-pupr-blue text-white border-pupr-blue'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            Kurva Sedimen Observasi (Q vs Qs)
                        </button>
                    </div>
                </div>
                <Button size="sm" onClick={handleCalculate} className="bg-pupr-blue hover:bg-teal-700 h-8 text-xs font-semibold text-white">
                    <Calculator className="w-3.5 h-3.5 mr-1.5" /> Hitung Laju & Umur Guna
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Inputs Column */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    {/* Common Parameters */}
                    <Card className="border-slate-200">
                        <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-xs font-bold text-slate-700">Parameter Karakteristik DAS & Tampungan Mati</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">LUAS DAS (KM²)</label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={params.luasDas}
                                    className="h-8 text-xs font-semibold"
                                    onChange={(e) => setParams({ ...params, luasDas: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">VOLUME DEAD STORAGE (M³)</label>
                                <Input
                                    type="number"
                                    step="1000"
                                    value={deadStorageM3}
                                    className="h-8 text-xs font-semibold text-amber-700 bg-amber-50/30 border-amber-200"
                                    onChange={(e) => setDeadStorageM3(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">BERAT JENIS (TON/M³)</label>
                                <Input
                                    type="number"
                                    step="0.05"
                                    value={params.beratJenis}
                                    className="h-8 text-xs"
                                    onChange={(e) => setParams({ ...params, beratJenis: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">BED LOAD RATIO (%)</label>
                                <Input
                                    type="number"
                                    step="1"
                                    value={params.bedLoadPercentage}
                                    className="h-8 text-xs"
                                    onChange={(e) => setParams({ ...params, bedLoadPercentage: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Method-Specific Inputs */}
                    {method === 'regional_sdr' ? (
                        <Card className="border-slate-200">
                            <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/50">
                                <CardTitle className="text-xs font-bold text-slate-700">Preset Laju Erosi Permukaan Regional</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 block mb-1">KONDISI BIOFISIK & TIPE DAS</label>
                                    <select
                                        value={selectedPresetId}
                                        onChange={(e) => handlePresetChange(e.target.value)}
                                        className="w-full h-8 text-xs rounded-md border border-slate-300 bg-white px-2 focus:ring-1 focus:ring-pupr-blue"
                                    >
                                        {REGIONAL_SEDIMENT_PRESETS.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.label} ({p.rateMmYear} mm/thn)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 block mb-1">LAJU EROSI (MM/THN)</label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={erosionRateMmYear}
                                            className="h-8 text-xs font-bold text-slate-800"
                                            onChange={(e) => setErosionRateMmYear(parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 block mb-1">SDR (KOSONG = RUMUS BOYD)</label>
                                        <Input
                                            type="number"
                                            step="0.05"
                                            placeholder="Otomatis Boyd"
                                            value={customSdr}
                                            className="h-8 text-xs"
                                            onChange={(e) => setCustomSdr(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-slate-200">
                            <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                                <CardTitle className="text-xs font-bold text-slate-700">Sampel Debit & Sedimen Suspensi</CardTitle>
                                <Button size="sm" variant="outline" onClick={handleAddSample} className="h-7 text-[10px]">
                                    <Plus className="w-3 h-3 mr-1" /> Sampel
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0 max-h-[280px] overflow-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-10 border-b border-slate-100">
                                        <tr>
                                            <th className="px-3 py-2">No</th>
                                            <th className="px-2 py-2 text-right">Q (m³/s)</th>
                                            <th className="px-2 py-2 text-right">Qs (ton/hari)</th>
                                            <th className="w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {samples.map((s, idx) => (
                                            <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-3 py-1.5 text-slate-400 font-medium">{idx + 1}</td>
                                                <td className="px-2 py-1.5">
                                                    <Input type="number" step="0.1" value={s.q} className="h-7 text-right border-transparent hover:border-slate-200 bg-transparent text-xs" onChange={(e) => handleSampleChange(s.id, 'q', e.target.value)} />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <Input type="number" step="0.1" value={s.qs} className="h-7 text-right border-transparent hover:border-slate-200 bg-transparent text-xs" onChange={(e) => handleSampleChange(s.id, 'qs', e.target.value)} />
                                                </td>
                                                <td className="px-1 py-1.5">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600" onClick={() => handleRemoveSample(s.id)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Results & Prediction Column */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Card className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg">
                            <Clock className="w-4 h-4 text-rose-400 mb-1.5" />
                            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Estimasi Umur Guna</p>
                            <div className="flex items-baseline gap-1.5">
                                <h1 className="text-3xl font-extrabold text-white">
                                    {effectiveLifespan > 0 ? effectiveLifespan.toFixed(0) : '-'}
                                </h1>
                                <span className="text-xs font-medium text-slate-400">Tahun</span>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                                Target SNI: ≥ 25 tahun
                            </span>
                        </Card>

                        <Card className="p-4 border-slate-200 bg-white">
                            <BarChart3 className="w-4 h-4 text-pupr-blue mb-1.5" />
                            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Sedimen Terperangkap</p>
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-2xl font-bold text-slate-700">
                                    {effectiveTrappedVolume > 0 ? effectiveTrappedVolume.toLocaleString('id-ID', { maximumFractionDigits: 0 }) : '-'}
                                </h3>
                                <span className="text-xs text-slate-400">m³/thn</span>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                                Trap Eff: {effectiveTrapEfficiency.toFixed(0)}%
                            </span>
                        </Card>

                        <Card className="p-4 border-amber-200 bg-amber-50/30">
                            <ShieldCheck className="w-4 h-4 text-amber-600 mb-1.5" />
                            <p className="text-[10px] font-bold text-amber-800 tracking-wider uppercase mb-1">Tampungan Mati</p>
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-2xl font-bold text-amber-900">
                                    {deadStorageM3.toLocaleString('id-ID')}
                                </h3>
                                <span className="text-xs text-amber-700">m³</span>
                            </div>
                            <span className="text-[10px] text-amber-700 mt-1 block">
                                Elevasi MAD: {state.zoning?.deadStorageElevation ?? '-'} m
                            </span>
                        </Card>
                    </div>

                    {/* Status Banner */}
                    {effectiveLifespan > 0 && (
                        <div className={`p-3 rounded-lg border flex items-center gap-3 text-xs ${
                            effectiveLifespan >= 25
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}>
                            <ShieldCheck className="w-5 h-5 shrink-0" />
                            <div>
                                <span className="font-bold">
                                    {effectiveLifespan >= 25
                                        ? 'Memenuhi Syarat Masa Layan SNI 03-3432-1994 (≥ 25 Tahun)'
                                        : 'Peringatan: Masa Layan Kurang dari Rekomendasi SNI (< 25 Tahun)'}
                                </span>
                                <p className="text-[11px] mt-0.5 opacity-90">
                                    {effectiveLifespan >= 25
                                        ? `Kapasitas kantong lumpur dead storage (${deadStorageM3.toLocaleString()} m³) diprediksi cukup untuk menampung sedimen selama ${effectiveLifespan.toFixed(1)} tahun.`
                                        : `Pertimbangkan untuk menaikkan elevasi MAD/tampungan mati atau melakukan tindakan konservasi DAS/Check Dam.`}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Visualizer */}
                    {method === 'rating_curve' ? (
                        <Card className="flex-1 border-slate-200 min-h-[300px]">
                            <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/50">
                                <CardTitle className="text-xs font-bold text-slate-700">Rating Curve Sedimen (Log-Log Regression)</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis type="number" dataKey="q" name="Debit" unit=" m³/s" tick={{ fontSize: 10 }} label={{ value: 'Debit (Q, m³/s)', position: 'bottom', fontSize: 10, offset: 0 }} />
                                        <YAxis type="number" dataKey="qs" name="Sedimen" unit=" ton/hari" tick={{ fontSize: 10 }} label={{ value: 'Sedimen (Qs, ton/hari)', angle: -90, position: 'left', fontSize: 10 }} />
                                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                        <Scatter name="Data Observasi" data={samples} fill="#0ea5e9" />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-slate-200 bg-slate-50/40 p-4 space-y-2 text-xs">
                            <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-pupr-blue" />
                                Rincian Perhitungan Laju Erosi Regional & SDR
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2">
                                <div className="bg-white p-2.5 rounded border border-slate-100">
                                    <span className="text-slate-400 block text-[10px]">EROSI KOTOR DAS (GROSS EROSION)</span>
                                    <strong>{regionalResult ? regionalResult.grossErosionM3.toLocaleString() : '-'} m³/thn</strong>
                                </div>
                                <div className="bg-white p-2.5 rounded border border-slate-100">
                                    <span className="text-slate-400 block text-[10px]">SEDIMENT DELIVERY RATIO (SDR)</span>
                                    <strong>{regionalResult ? (regionalResult.sdr * 100).toFixed(1) : '-'} %</strong>
                                </div>
                                <div className="bg-white p-2.5 rounded border border-slate-100">
                                    <span className="text-slate-400 block text-[10px]">HASIL SEDIMEN DI INLET WADUK</span>
                                    <strong>{regionalResult ? regionalResult.sedimentYieldM3.toLocaleString() : '-'} m³/thn</strong>
                                </div>
                                <div className="bg-white p-2.5 rounded border border-slate-100">
                                    <span className="text-slate-400 block text-[10px]">TRAP EFFICIENCY WADUK</span>
                                    <strong>{regionalResult ? regionalResult.trapEfficiencyPercent : '95'} %</strong>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

