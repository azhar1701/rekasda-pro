import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Calculator, Info, Mountain, CalendarClock, ArrowRightSquare, Trash2, Sparkles } from 'lucide-react';
// import { calculateSedimentYield } from '@/lib/engine/embung';
import { toast } from '@/hooks/useToast';
// Mock Data Defaults
const DEFAULT_PARAMS = {
    catchmentArea: 45.5,      // km2
    bulkDensity: 1.2,         // t/m3
    bedLoadPercentage: 15,    // % (10-20%)
};

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
    const [isCalculating, setIsCalculating] = useState(false);

    // States
    const [params, setParams] = useState(DEFAULT_PARAMS);
    const [samples, setSamples] = useState(DEFAULT_SAMPLES);
    const [result, setResult] = useState<any | null>(null);

    const handleParamChange = (field: keyof typeof DEFAULT_PARAMS, value: string) => {
        setParams(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
        setResult(null);
    };

    const handleSampleChange = (index: number, field: string, value: string) => {
        const newSamples = [...samples];
        (newSamples[index] as any)[field] = parseFloat(value) || 0;
        setSamples(newSamples);
        setResult(null);
    };

    const handleAddSample = () => {
        setSamples([...samples, { id: Date.now(), q: 0, cs: 0, days: 0 }]);
    };

    const handleRemoveSample = (index: number) => {
        const newSamples = samples.filter((_, i) => i !== index);
        setSamples(newSamples);
        setResult(null);
    };

    const handleCalculate = async () => {
        setIsCalculating(true);
        setResult(null);

        try {
            // Formatting data arrays for Rating Curve
            // qs in (Ton/hari) = q(m3/s) * cs(mg/L) * 0.0864 (conversion factor)
            const qData = samples.map(s => s.q);
            const qsData = samples.map(s => s.q * s.cs * 0.0864);

            // Flow duration arrays for annual accumulation
            const flowDurationDays = samples.map(s => s.days);
            const flowDurationQ = samples.map(s => s.q);

            const response = await fetch('http://localhost:8000/api/v1/embung/sedimen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qData,
                    qsData,
                    luasDas: params.catchmentArea,
                    beratJenis: params.bulkDensity,
                    bedLoadPercentage: params.bedLoadPercentage,
                    flowDurationDays,
                    flowDurationQ
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Gagal menghitung Sedimentasi di Python Engine');
            }

            const sedResult = await response.json();

            setResult({
                totalVolume: Number(sedResult.totalVolumeM3.toFixed(0)),
                erosionRate: Number(sedResult.erosionRateMm.toFixed(2)),
                totalLoad: Number(sedResult.totalLoadTonnes.toFixed(1)),
                koefisienRating: `Qs = ${sedResult.a.toFixed(4)} Q^${sedResult.b.toFixed(4)}`
            });

            toast.success('Kalkulasi Laju Sedimen REST API Engine berhasil.');
        } catch (error: any) {
            toast.error(`Terjadi kesalahan: ${error.message || 'Unknown error'}`);
        } finally {
            setIsCalculating(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Header Info */}
            <div className="flex items-start justify-between bg-blue-50/50 p-4 rounded-md border border-blue-100">
                <div className="flex gap-3">
                    <Info className="w-5 h-5 text-pupr-blue shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-semibold text-blue-900">Perkiraan Sedimentasi & Umur Guna</h3>
                        <p className="text-sm text-blue-700/80 mt-1">
                            Prediksi laju erosi DAS dan sedimentasi tahunan yang masuk ke waduk berdasarkan kurva aliran suspensi (Suspended Sediment) dan durasi hari kejadian.
                        </p>
                    </div>
                </div>
            </div>

            {/* Layout Simple 5-7 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

                {/* KIRI: Input Form (Span 5) */}
                <div className="lg:col-span-5 flex flex-col gap-6 min-h-0">

                    {/* Parameter Das */}
                    <Card className="shadow-sm border-slate-200 shrink-0 bg-slate-50/30">
                        <CardHeader className="py-3 px-5 border-b border-slate-100">
                            <CardTitle className="text-sm text-slate-800">Parameter Catchment Area</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Luas DAS (km²)</label>
                                <Input
                                    type="number"
                                    value={params.catchmentArea}
                                    onChange={(e) => handleParamChange('catchmentArea', e.target.value)}
                                    className="h-9 focus-visible:ring-1 focus-visible:ring-teal-500 bg-white"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Berat Jenis (t/m³)</label>
                                <Input
                                    type="number"
                                    value={params.bulkDensity}
                                    onChange={(e) => handleParamChange('bulkDensity', e.target.value)}
                                    className="h-9 focus-visible:ring-1 focus-visible:ring-teal-500 bg-white"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Bed Load Percentage (%)</label>
                                <Input
                                    type="number"
                                    value={params.bedLoadPercentage}
                                    onChange={(e) => handleParamChange('bedLoadPercentage', e.target.value)}
                                    className="h-9 focus-visible:ring-1 focus-visible:ring-teal-500 bg-white"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Data Sampel */}
                    <Card className="flex-1 shadow-sm border-slate-200 flex flex-col min-h-[250px]">
                        <CardHeader className="py-4 px-5 border-b border-slate-100 bg-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base text-slate-800">Distribusi Debit (Flow Duration)</CardTitle>
                                    <CardDescription className="text-xs mt-0.5">Debit, konsentrasi, dan total hari per tahun</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto p-0">
                            <div className="w-full">
                                <div className="flex w-full sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-semibold text-slate-500 shadow-sm">
                                    <div className="flex-1 py-2 px-2 text-center" title="Debit (m³/s)">Q (m³/s)</div>
                                    <div className="flex-1 py-2 px-2 text-center" title="Konsentrasi (mg/l)">Cs (mg/l)</div>
                                    <div className="flex-1 py-2 px-2 text-center" title="Durasi (Hari/Tahun)">Hari/Thn</div>
                                    <div className="w-10"></div>
                                </div>
                                <div className="w-full">
                                    {samples.map((row, idx) => (
                                        <div key={row.id} className="flex w-full items-center border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <div className="flex-1 py-1.5 px-2">
                                                <Input
                                                    type="number"
                                                    value={row.q}
                                                    onChange={(e) => handleSampleChange(idx, 'q', e.target.value)}
                                                    className="h-8 text-center text-xs focus-visible:ring-1 focus-visible:ring-teal-500"
                                                />
                                            </div>
                                            <div className="flex-1 py-1.5 px-2">
                                                <Input
                                                    type="number"
                                                    value={row.cs}
                                                    onChange={(e) => handleSampleChange(idx, 'cs', e.target.value)}
                                                    className="h-8 text-center text-xs focus-visible:ring-1 focus-visible:ring-teal-500"
                                                />
                                            </div>
                                            <div className="flex-1 py-1.5 px-2">
                                                <Input
                                                    type="number"
                                                    value={row.days}
                                                    onChange={(e) => handleSampleChange(idx, 'days', e.target.value)}
                                                    className="h-8 text-center text-xs focus-visible:ring-1 focus-visible:ring-teal-500"
                                                />
                                            </div>
                                            <div className="w-10 flex justify-center py-1.5 pr-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                                    onClick={() => handleRemoveSample(idx)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={handleAddSample}
                                        className="w-full py-3 text-xs font-medium text-pupr-blue hover:bg-teal-50 transition-colors border-t border-dashed border-teal-200"
                                    >
                                        + Tambah Distribusi Debit
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2">
                            <Button
                                onClick={handleCalculate}
                                disabled={isCalculating}
                                className="flex-1 bg-pupr-blue hover:bg-teal-700 text-white shadow-sm"
                            >
                                {isCalculating ? (
                                    <div className="flex items-center gap-2 justify-center">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-md animate-pulse bg-slate-200 rounded-md" />
                                        <span>Menghitung Laju...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 justify-center">
                                        <Calculator className="w-4 h-4" />
                                        Kalkulasi Sedimentasi
                                    </div>
                                )}
                            </Button>
                            {result && onConsultAI && (
                                <Button
                                    onClick={() => onConsultAI({ params, samples }, result)}
                                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 border-indigo-200 shadow-sm transition-all group shrink-0"
                                    title="Analisis AI"
                                >
                                    <Sparkles className="w-4 h-4 text-pupr-blue group-hover:scale-110 transition-transform" />
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>

                {/* KANAN: Hasil Analisis Big Result (Span 7) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* Laju Sedimen - BIG CARD */}
                    <Card className={`relative overflow-hidden border-2 transition-all duration-500 ${result ? 'bg-amber-50/80 border-amber-200 shadow-md' : 'bg-slate-50 border-dashed border-slate-200 shadow-none'}`}>
                        {result && <Mountain className="absolute -right-8 -bottom-12 w-48 h-48 text-amber-200/50 opacity-40 z-0" />}

                        <CardContent className="p-8 md:p-12 relative z-10 flex flex-col items-center justify-center text-center min-h-[300px]">
                            {isCalculating ? (
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-md animate-pulse bg-slate-200 rounded-md mb-4" />
                                    <p className="text-amber-700 font-medium animate-pulse">Memodelkan erosi DAS...</p>
                                </div>
                            ) : result ? (
                                <div className="space-y-6 animate-in zoom-in-95 duration-500 w-full">
                                    <div>
                                        <p className="text-amber-700/80 text-sm font-bold uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                                            <Mountain className="w-4 h-4" /> Laju Sedimen Tahunan
                                        </p>
                                        <div className="flex items-baseline justify-center gap-3">
                                            <h1 className="text-6xl md:text-7xl font-extrabold text-amber-600 tracking-tight">
                                                {result.totalVolume.toLocaleString('id-ID')}
                                            </h1>
                                            <span className="text-xl font-semibold text-amber-500/80">m³/tahun</span>
                                        </div>
                                        <div className="mt-2 text-amber-700/60 font-medium text-sm">
                                            ({result.totalLoad.toLocaleString('id-ID')} Ton/tahun)
                                        </div>
                                    </div>

                                    <div className="w-full max-w-sm mx-auto h-px bg-amber-200 my-4" />

                                    <div className="grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
                                        <div className="bg-white/60 backdrop-blur-sm rounded-md p-6 border border-amber-100 shadow-sm flex flex-col items-center justify-center">
                                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <CalendarClock className="w-4 h-4" /> Persamaan Rating
                                            </p>
                                            <div className="flex items-baseline justify-center gap-1.5">
                                                <h2 className="text-xl font-bold text-slate-800 break-words">
                                                    {result.koefisienRating}
                                                </h2>
                                            </div>
                                        </div>

                                        <div className="bg-white/60 backdrop-blur-sm rounded-md p-6 border border-amber-100 shadow-sm flex flex-col items-center justify-center">
                                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                                Erosi Spesifik
                                            </p>
                                            <div className="flex items-baseline justify-center gap-1.5">
                                                <h2 className="text-3xl font-bold text-slate-800">
                                                    {result.erosionRate}
                                                </h2>
                                                <span className="text-xs font-semibold text-slate-500">mm/thn</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-slate-400 p-6">
                                    <ArrowRightSquare className="w-16 h-16 opacity-20 mb-4" />
                                    <p className="text-base font-medium">Input parameter dan klik Kalkulasi di panel kiri</p>
                                    <p className="text-sm mt-1 opacity-70">Hasil analisis laju sedimen akan tampil di sini</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Persamaan Rating Curve - Dihapus dari mock diganti Info List */}
                    {result && (
                        <Card className="shadow-sm border-slate-200 bg-white animate-in slide-in-from-bottom-4 duration-500">
                            <CardContent className="p-4 flex items-center gap-4 text-sm text-slate-600 bg-blue-50/50 rounded-md border border-blue-50">
                                <Info className="w-5 h-5 text-pupr-blue shrink-0" />
                                <p>
                                    Perhitungan didasarkan pada total durasi sampel: <strong className="text-slate-800">{samples.reduce((sum, s) => sum + s.days, 0)} hari</strong> dalam setahun. Pastikan total durasi merepresentasikan distribusi aliran tahunan untuk hasil yang akurat.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};
