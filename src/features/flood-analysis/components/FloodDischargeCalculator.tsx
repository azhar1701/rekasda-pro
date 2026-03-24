import React, { useState, useEffect, useMemo } from 'react';

import RunoffCoefficientInput from './RunoffCoefficientInput';
import AlphaParameterInput from './AlphaParameterInput';
import { FloodHydrographChart } from './FloodHydrographChart';
import { TcCalculator, FrequencyAnalysisCalculator } from '@/features/channel-analysis/components/MiniCalculators';
import { saveFloodCalculation } from '@/services/calculationService';
import { calculateTg, calculateTp, calculateT03, calculateQp, generateHydrograph } from '@/lib/utils/calculations/nakayasu';
import { calculateRationalMethod, convertKm2ToHa } from '@/lib/engine';
import { generateRationalHydrograph as generateRationalHydrographEngine, calculateMononobeIntensity } from '@/lib/engine/flood/hydrograph';
import { useFloodWorker } from '@/hooks/useFloodWorker';
import { useHydrologyStore, HasilKonvolusi } from '@/stores/useHydrologyStore';
import { useSNI2415Workflow } from '@/hooks/useSNI2415Workflow';
import { LocationIdentity } from '@/components/common/LocationIdentity';
import { PilotDataLoader } from '@/components/common/PilotDataLoader';
import { PilotDataRational, PilotDataNakayasu } from '@/data/floodPilotData';
import { SNILabel, ComplianceBadge } from '@/components/ui/data-display/ComplianceComponents';
import { WhiteBoxFormula } from '@/components/ui/WhiteBoxFormula';
import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { RETURN_PERIOD_GUIDANCE } from '@/constants/returnPeriodGuidance';
import { useRasionalModifikasiMutation } from '@/hooks/api/useBanjirApi';

type MethodType = 'RATIONAL' | 'NAKAYASU' | 'HASPERS' | 'DER_WEDUWEN' | 'MELCHIOR';

interface LocationData {
    channelName: string;
    kabupaten: string;
    kecamatan: string;
    desa: string;
    coordinates?: { lat: number; lng: number };
    photoUrl?: string;
}

interface RationalInputs {
    C: number;
    A: number;
    tc: number;
    I: number;
    R24?: number;
    L?: number;
    S?: number;
}

interface NakayasuInputs {
    A: number;
    L: number;
    Ro: number;
    Alpha: number;
    C?: number; // Koefisien limpasan untuk menghitung Ro
}

interface ReturnPeriod {
    period: string;
    rainfall: number;
    qPeak: number;
}

const TOOLTIPS = {
    A: 'Luas daerah tangkapan air hulu hingga titik tinjau (km²)',
    L: 'Panjang sungai utama dari hulu hingga outlet (km)',
    C: 'Rasio antara limpasan permukaan dengan curah hujan total (0-1)',
    tc: 'Waktu yang diperlukan air dari titik terjauh mencapai outlet (menit)',
    I: 'Intensitas curah hujan rata-rata selama waktu konsentrasi (mm/jam)',
    Ro: 'Tinggi hujan efektif (Ro = C × R) yang menjadi limpasan permukaan (mm)',
    Alpha: 'Koefisien karakteristik DAS, tergantung kondisi topografi (1.5-3.0)'
};

interface Props {
    onConsultAI?: () => void;
}

export const FloodDischargeCalculator: React.FC<Props> = ({ onConsultAI }) => {
    const [method, setMethod] = useState<MethodType>('RATIONAL');
    const [locationData, setLocationData] = useState<LocationData | null>(null);
    const [rationalInputs, setRationalInputs] = useState<RationalInputs>({
        C: 0.7,
        A: 0.5,
        tc: 30,
        I: 100,
        R24: 100,
        L: 1.5,
        S: 0.01
    });
    const [nakayasuInputs, setNakayasuInputs] = useState<NakayasuInputs>({
        A: 50,
        L: 15,
        Ro: 10, // Hujan satuan 10 mm (bukan 100 mm)
        Alpha: 2,
        C: 0.7, // Koefisien limpasan default
    });
    const [returnPeriods, setReturnPeriods] = useState<ReturnPeriod[]>([
        { period: 'Q2', rainfall: 80, qPeak: 0 },
        { period: 'Q5', rainfall: 100, qPeak: 0 },
        { period: 'Q10', rainfall: 120, qPeak: 0 },
        { period: 'Q25', rainfall: 140, qPeak: 0 },
        { period: 'Q50', rainfall: 160, qPeak: 0 },
        { period: 'Q100', rainfall: 180, qPeak: 0 }
    ]);
    const [hydrographData, setHydrographData] = useState<any[]>([]);
    const [qPeak, setQPeak] = useState<number>(0);
    const [tPeak, setTPeak] = useState<number>(0);
    const [volume, setVolume] = useState<number>(0);
    const [showTcCalc, setShowTcCalc] = useState(false);
    const [showFreqAnalysis, setShowFreqAnalysis] = useState(false);
    const [rainfallDataSource, setRainfallDataSource] = useState<'manual' | 'frequency'>('manual');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [loadMessage, setLoadMessage] = useState<string | null>(null);
    const [convolutionResult, setConvolutionResult] = useState<HasilKonvolusi | null>(null);
    const [unitHydrographData, setUnitHydrographData] = useState<any[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(35);
    const [isResizing, setIsResizing] = useState(false);
    const [engineWarnings, setEngineWarnings] = useState<string[]>([]);
    // FIX BUG-2: useRef to avoid stale closure in resize handler
    const sidebarWidthRef = React.useRef(sidebarWidth);
    React.useEffect(() => { sidebarWidthRef.current = sidebarWidth; }, [sidebarWidth]);
    // FIX BUG-3: ref guard against re-entrant useEffect for return periods
    const lastRainfallKeyRef = React.useRef('');

    // Hydrology Store Integration
    const { distribusiHujanJamJaman, setHasilKonvolusi } = useHydrologyStore();

    // Web Worker Integration
    const { isWorkerReady, calculateFloodAsync, calculateBatchFloodAsync } = useFloodWorker();

    // SNI 2415:2016 Workflow Validation
    const sniWorkflow = useMemo(() => {
        const area = method === 'RATIONAL' ? rationalInputs.A : nakayasuInputs.A;
        return useSNI2415Workflow(area);
    }, [method, rationalInputs.A, nakayasuInputs.A]);

    const rasionalMutation = useRasionalModifikasiMutation();
    const [calculateRationalDischarge, setCalculateRationalDischarge] = useState({ qPeak: 0, warnings: [] as string[] });

    useEffect(() => {
        let active = true;
        const fetchRational = async () => {
            try {
                if (method === 'HASPERS' || method === 'DER_WEDUWEN' || method === 'MELCHIOR') {
                    const res = await rasionalMutation.mutateAsync({
                        method: method === 'DER_WEDUWEN' ? 'der_weduwen' : method.toLowerCase() as any,
                        A: rationalInputs.A,
                        L: rationalInputs.L || 1.5,
                        S: rationalInputs.S || 0.01,
                        I: rationalInputs.I,
                        C: method === 'MELCHIOR' ? rationalInputs.C : undefined
                    });
                    if (active) setCalculateRationalDischarge({ qPeak: res.qPeak, warnings: res.warnings || [] });
                } else {
                    const areaHa = convertKm2ToHa(rationalInputs.A);
                    const result = calculateRationalMethod({
                        C: rationalInputs.C,
                        I: rationalInputs.I,
                        A: areaHa
                    });
                    if (active) setCalculateRationalDischarge({ qPeak: result.Q, warnings: result.warnings || [] });
                }
            } catch {
                if (active) setCalculateRationalDischarge({ qPeak: 0, warnings: ['Error: API gagal dihubungi'] });
            }
        };
        fetchRational();
        return () => { active = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [method, rationalInputs.C, rationalInputs.I, rationalInputs.A, rationalInputs.L, rationalInputs.S, rationalInputs.R24]);

    // FIX BUG-1 (continued): Sync warnings from pure useMemo result via useEffect
    React.useEffect(() => {
        setEngineWarnings(calculateRationalDischarge.warnings);
    }, [calculateRationalDischarge.warnings]);

    useEffect(() => {
        const saved = localStorage.getItem('flood-sidebar-width');
        if (saved) setSidebarWidth(parseFloat(saved));
    }, []);

    // FIX BUG-2: Use ref to get latest sidebarWidth in mouseup, avoiding stale closure
    useEffect(() => {
        if (!isResizing) return;
        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = (e.clientX / window.innerWidth) * 100;
            const clampedWidth = Math.min(Math.max(newWidth, 25), 50);
            setSidebarWidth(clampedWidth);
        };
        const handleMouseUp = () => {
            setIsResizing(false);
            localStorage.setItem('flood-sidebar-width', sidebarWidthRef.current.toString());
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const generateRationalHydrograph = (Q: number, tc: number) => {
        const result = generateRationalHydrographEngine({ Q, tc });
        return result.data.hydrograph;
    };

    const generateNakayasuHydrograph = (Qp: number, Tp: number, Tg: number, Alpha: number) => {
        const T03 = Alpha * Tg;
        return generateHydrograph(Qp, Tp, T03, 0.1);
    };

    useEffect(() => {
        if (method === 'RATIONAL' || method === 'HASPERS' || method === 'DER_WEDUWEN' || method === 'MELCHIOR') {
            const Q = calculateRationalDischarge.qPeak;
            const tcHours = rationalInputs.tc / 60;
            const vol = Q * tcHours * 3600;
            setQPeak(Q);
            setTPeak(tcHours);
            setVolume(vol);
            setHydrographData(generateRationalHydrograph(Q, rationalInputs.tc));
        } else {
            // HSS Nakayasu - SNI 2415:2016 Pasal 6.3
            const Tg = calculateTg(nakayasuInputs.L);
            const Tp = calculateTp(Tg);
            const T03 = calculateT03(nakayasuInputs.Alpha, Tg);
            const Q = calculateQp(nakayasuInputs.A, nakayasuInputs.Ro, Tp, T03);

            const uhOrdinates = generateNakayasuHydrograph(Q, Tp, Tg, nakayasuInputs.Alpha);
            setUnitHydrographData(uhOrdinates);

            // PRODUCTION FEATURE F-04: Auto-Convolution with ABM via Web Worker
            if (distribusiHujanJamJaman && distribusiHujanJamJaman.length > 0 && isWorkerReady) {
                setIsCalculating(true);
                calculateFloodAsync({
                    unitHydrograph: uhOrdinates,
                    abmRainfall: distribusiHujanJamJaman,
                    uhTimeStep: 0.1
                }).then(conv => {
                    setConvolutionResult(conv);
                    setHasilKonvolusi(conv);
                    setQPeak(conv.peakDischarge);
                    setTPeak(conv.timeToPeak);
                    setVolume(conv.totalVolume);
                    setHydrographData(conv.floodHydrograph);
                })
                    .catch(console.error)
                    .finally(() => setIsCalculating(false));
            } else {
                setConvolutionResult(null);
                setHasilKonvolusi(null);
                setQPeak(Q);
                setTPeak(Tp);
                setVolume(Q * Tp * 3600); // Simple volume estimate for UH
                setHydrographData(uhOrdinates);
            }
        }
    }, [method, rationalInputs, nakayasuInputs, calculateRationalDischarge, distribusiHujanJamJaman, setHasilKonvolusi, isWorkerReady]);

    // FIX BUG-3: Stabilize dependency — use ref guard to prevent infinite re-trigger.
    // The rainfall key only changes when the user edits rainfall values or loads pilot data.
    useEffect(() => {
        const rainfallKey = returnPeriods.map(r => r.rainfall).join(',');
        if (rainfallKey === lastRainfallKeyRef.current) return;
        lastRainfallKeyRef.current = rainfallKey;

        if (method === 'RATIONAL') {
            const updated = returnPeriods.map(rp => {
                const tcHours = rationalInputs.tc / 60;
                const I = (rp.rainfall / 24) * Math.pow(24 / tcHours, 2 / 3);
                const areaHa = convertKm2ToHa(rationalInputs.A);
                try {
                    const result = calculateRationalMethod({ C: rationalInputs.C, I, A: areaHa });
                    return { ...rp, qPeak: result.Q };
                } catch {
                    return { ...rp, qPeak: 0 };
                }
            });
            setReturnPeriods(updated);
        } else {
            // HSS Nakayasu untuk berbagai kala ulang
            const Tg = calculateTg(nakayasuInputs.L);
            const Tp = calculateTp(Tg);
            const T03 = calculateT03(nakayasuInputs.Alpha, Tg);

            if (distribusiHujanJamJaman && distribusiHujanJamJaman.length > 0 && isWorkerReady) {
                setIsCalculating(true);
                const batchInputs = returnPeriods.map(rp => {
                    const Qp = calculateQp(nakayasuInputs.A, rp.rainfall, Tp, T03);
                    const uhOrdinates = generateNakayasuHydrograph(Qp, Tp, Tg, nakayasuInputs.Alpha);
                    return {
                        unitHydrograph: uhOrdinates,
                        abmRainfall: distribusiHujanJamJaman,
                        uhTimeStep: 0.1
                    };
                });

                calculateBatchFloodAsync(batchInputs)
                    .then(results => {
                        const updated = returnPeriods.map((rp, idx) => ({
                            ...rp,
                            qPeak: results[idx].peakDischarge
                        }));
                        setReturnPeriods(updated);
                    })
                    .catch(console.error)
                    .finally(() => setIsCalculating(false));
            } else {
                const updated = returnPeriods.map(rp => {
                    const Qp = calculateQp(nakayasuInputs.A, rp.rainfall, Tp, T03);
                    return { ...rp, qPeak: Qp };
                });
                setReturnPeriods(updated);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [returnPeriods, method, rationalInputs.tc, rationalInputs.A, rationalInputs.C, nakayasuInputs.L, nakayasuInputs.A, nakayasuInputs.Alpha, isWorkerReady]);

    const handleSaveToDB = async () => {
        const projectName = locationData?.channelName;
        if (!projectName) {
            setSaveMessage({ type: 'error', text: 'Mohon isi Nama Saluran di Identitas Lokasi terlebih dahulu' });
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }

        setIsSaving(true);
        setSaveMessage(null);
        try {
            const inputs = method === 'RATIONAL' || method === 'HASPERS' || method === 'DER_WEDUWEN' || method === 'MELCHIOR'
                ? { ...rationalInputs, location: locationData }
                : { ...nakayasuInputs, location: locationData };
            const results = { qPeak, tPeak, volume, returnPeriods, hydrographData };

            // Convert modified rational methods to RATIONAL for saving
            let saveMethod: 'RATIONAL' | 'NAKAYASU';
            if (method === 'NAKAYASU') {
                saveMethod = 'NAKAYASU';
            } else {
                saveMethod = 'RATIONAL';
            }

            const { error } = await saveFloodCalculation({ method: saveMethod, projectName, inputs, results });

            if (error) {
                setSaveMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message });
            } else {
                setSaveMessage({ type: 'success', text: '✓ Berhasil menyimpan perhitungan!' });
            }
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui';
            setSaveMessage({ type: 'error', text: 'Error: ' + errorMessage });
            setTimeout(() => setSaveMessage(null), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLoadRationalPilot = (data: PilotDataRational) => {
        setRationalInputs(data.inputs);
        setLocationData(data.location);
        const updated = returnPeriods.map((rp, idx) => ({
            ...rp,
            rainfall: data.returnPeriods[idx]?.rainfall || rp.rainfall
        }));
        setReturnPeriods(updated);
        setLoadMessage(`✓ Data pilot "${data.name}" berhasil dimuat`);
        setTimeout(() => setLoadMessage(null), 3000);
    };

    const handleLoadNakayasuPilot = (data: PilotDataNakayasu) => {
        setNakayasuInputs(data.inputs);
        setLocationData(data.location);
        const updated = returnPeriods.map((rp, idx) => ({
            ...rp,
            rainfall: data.returnPeriods[idx]?.rainfall || rp.rainfall
        }));
        setReturnPeriods(updated);
        setLoadMessage(`✓ Data pilot "${data.name}" berhasil dimuat`);
        setTimeout(() => setLoadMessage(null), 3000);
    };

    const TooltipIcon = ({ text }: { text: string }) => (
        <div className="group relative inline-block ml-1">
            <svg className="w-4 h-4 text-slate-500 hover:text-emerald-600 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-64 z-50">
                {text}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-800 p-3 md:p-5">
            <div className="max-w-[1600px] mx-auto">

                {/* Header */}
                <div className="mb-2 md:mb-3 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">Analisis Banjir & Hidrologi</h1>
                        <p className="text-xs md:text-sm text-slate-500 mt-1">Perhitungan debit puncak banjir rencana • Metode Empiris & HSS Nakayasu • SNI 2415:2016</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-900 px-3 py-1.5 rounded tracking-widest uppercase border border-slate-200 dark:border-slate-700 ">SNI 2415:2016</span>
                </div>

                {/* Method Selector - Moved to top */}
                <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 p-5 mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Metode Perhitungan</h2>
                        <ComplianceBadge sniCode="SNI 2415:2016" />
                    </div>
                    <div className="space-y-2">
                        {/* Primary Methods */}
                        <div className="flex gap-2 p-2 bg-slate-100 rounded-sm">
                            <button
                                onClick={() => setMethod('RATIONAL')}
                                className={`flex-1 py-2.5 px-3 rounded-sm text-xs font-bold transition-all relative ${method === 'RATIONAL' ? 'bg-white dark:bg-slate-900 text-teal-600 ' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'
                                    }`}
                            >
                                Rasional
                                {rationalInputs.A <= 3 && <CheckCircle2 className="w-3 h-3 text-emerald-500 absolute top-1 right-1" />}
                            </button>
                            <button
                                onClick={() => setMethod('NAKAYASU')}
                                className={`flex-1 py-2.5 px-3 rounded-sm text-xs font-bold transition-all ${method === 'NAKAYASU' ? 'bg-white dark:bg-slate-900 text-teal-600 ' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'
                                    }`}
                            >
                                Nakayasu
                            </button>
                        </div>

                        {/* Modified Rational Methods */}
                        <div className="grid grid-cols-3 gap-2 p-2 bg-indigo-50 rounded-sm border border-indigo-200">
                            <button
                                onClick={() => setMethod('HASPERS')}
                                className={`py-2 px-2 rounded-sm text-[10px] font-bold transition-all relative ${method === 'HASPERS' ? 'bg-white dark:bg-slate-900 text-indigo-600 ' : 'text-slate-600 dark:text-slate-500 hover:text-indigo-700'
                                    }`}
                            >
                                Haspers
                                {rationalInputs.A > 3 && rationalInputs.A <= 100 && <CheckCircle2 className="w-3 h-3 text-emerald-500 absolute top-0.5 right-0.5" />}
                            </button>
                            <button
                                onClick={() => setMethod('DER_WEDUWEN')}
                                className={`py-2 px-2 rounded-sm text-[10px] font-bold transition-all relative ${method === 'DER_WEDUWEN' ? 'bg-white dark:bg-slate-900 text-indigo-600 ' : 'text-slate-600 dark:text-slate-500 hover:text-indigo-700'
                                    }`}
                            >
                                Weduwen
                                {rationalInputs.A > 3 && rationalInputs.A <= 100 && <CheckCircle2 className="w-3 h-3 text-emerald-500 absolute top-0.5 right-0.5" />}
                            </button>
                            <button
                                onClick={() => setMethod('MELCHIOR')}
                                className={`py-2 px-2 rounded-sm text-[10px] font-bold transition-all relative ${method === 'MELCHIOR' ? 'bg-white dark:bg-slate-900 text-indigo-600 ' : 'text-slate-600 dark:text-slate-500 hover:text-indigo-700'
                                    }`}
                            >
                                Melchior
                                {rationalInputs.A > 100 && <CheckCircle2 className="w-3 h-3 text-emerald-500 absolute top-0.5 right-0.5" />}
                            </button>
                        </div>
                    </div>
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-sm flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800">
                            <p className="font-semibold mb-1">Panduan Pemilihan Metode:</p>
                            <p>• <strong>Rasional:</strong> DAS ≤ 3 km² (metode sederhana)</p>
                            <p>• <strong>Haspers/Weduwen:</strong> 3-100 km² (modifikasi rasional)</p>
                            <p>• <strong>Melchior:</strong> &gt; 100 km² (DAS besar)</p>
                            <p>• <strong>Nakayasu:</strong> DAS &gt; 3 km² (hidrograf satuan sintetik)</p>
                        </div>
                    </div>
                </div>

                {/* Messages Toast */}
                {loadMessage && (
                    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-sm border border-slate-200 dark:border-slate-700 bg-purple-50 text-purple-800 flex items-center gap-3 animate-fade-in max-w-md">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        <span className="font-medium text-sm">{loadMessage}</span>
                    </div>
                )}
                {saveMessage && (
                    <div className={`fixed top-24 right-6 z-[110] px-6 py-3 rounded-sm border flex items-center gap-3 animate-fade-in max-w-md ${saveMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {saveMessage.type === 'success' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            )}
                        </svg>
                        <span className="font-medium text-sm">{saveMessage.text}</span>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-6 relative z-0">

                    {/* LEFT SIDEBAR */}
                    <div className="w-full lg:w-auto" style={{ width: window.innerWidth >= 1024 ? `${sidebarWidth}%` : '100%', position: 'relative' }}>
                        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-100px)] lg:overflow-y-auto lg:pr-2 space-y-3 md:space-y-4">
                            {/* Pilot Data Loader */}
                            <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 p-5">
                                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-4">Data Pilot</h2>
                                <PilotDataLoader
                                    method={method === 'NAKAYASU' ? 'NAKAYASU' : 'RATIONAL'}
                                    onLoadRational={handleLoadRationalPilot}
                                    onLoadNakayasu={handleLoadNakayasuPilot}
                                />
                            </div>

                            {/* Smart Warnings from Engine */}
                            {method === 'RATIONAL' && engineWarnings.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-sm p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="text-sm font-bold text-amber-900 mb-2">Peringatan Validasi</h3>
                                            <ul className="space-y-1">
                                                {engineWarnings.map((warning, idx) => (
                                                    <li key={idx} className="text-xs text-amber-800">{warning}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SNI 2415:2016 Compliance Warning */}
                            {sniWorkflow.warning && (
                                <div className="bg-red-50 border border-red-200 rounded-sm p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="text-sm font-bold text-red-900 mb-2">Peringatan SNI 2415:2016</h3>
                                            <p className="text-xs text-red-800">{sniWorkflow.warning}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Location Identity */}
                            <LocationIdentity onLocationChange={setLocationData} />

                            {/* Input Sections */}
                            {method === 'RATIONAL' || method === 'HASPERS' || method === 'DER_WEDUWEN' || method === 'MELCHIOR' ? (
                                <>
                                    <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 p-5">
                                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-4">Geometri DAS</h2>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-500 uppercase tracking-wide mb-2">
                                                    Luas DAS (A)
                                                    <TooltipIcon text={TOOLTIPS.A} />
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={rationalInputs.A}
                                                        onChange={e => setRationalInputs({ ...rationalInputs, A: parseFloat(e.target.value) || 0 })}
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-sm p-3 pr-16 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">km²</span>
                                                </div>
                                            </div>
                                            {(method === 'HASPERS' || method === 'DER_WEDUWEN' || method === 'MELCHIOR') && (
                                                <>
                                                    <div>
                                                        <label className="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-500 uppercase tracking-wide mb-2">
                                                            Panjang Sungai (L)
                                                            <TooltipIcon text={TOOLTIPS.L} />
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                value={rationalInputs.L || 1.5}
                                                                onChange={e => setRationalInputs({ ...rationalInputs, L: parseFloat(e.target.value) || 0 })}
                                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-sm p-3 pr-16 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">km</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-500 uppercase tracking-wide mb-2">
                                                            Kemiringan (S)
                                                            <TooltipIcon text="Kemiringan sungai utama (m/m)" />
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                step="0.001"
                                                                value={rationalInputs.S || 0.01}
                                                                onChange={e => setRationalInputs({ ...rationalInputs, S: parseFloat(e.target.value) || 0 })}
                                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-sm p-3 pr-16 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">m/m</span>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            {method === 'RATIONAL' && (
                                                <div>
                                                    <label className="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-500 uppercase tracking-wide mb-2">
                                                        Waktu Konsentrasi (tc)
                                                        <TooltipIcon text={TOOLTIPS.tc} />
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <div className="relative flex-1">
                                                            <input
                                                                type="number"
                                                                value={rationalInputs.tc}
                                                                onChange={e => setRationalInputs({ ...rationalInputs, tc: parseFloat(e.target.value) || 0 })}
                                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-sm p-3 pr-16 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">menit</span>
                                                        </div>
                                                        <button
                                                            onClick={() => setShowTcCalc(!showTcCalc)}
                                                            className="px-3 py-2 bg-pupr-surface text-pupr-blue rounded-sm hover:bg-blue-100 transition-colors border border-pupr-border text-xs font-bold whitespace-nowrap"
                                                        >
                                                            Hitung tc
                                                        </button>
                                                    </div>
                                                    {showTcCalc && (
                                                        <TcCalculator
                                                            onApply={(tc) => setRationalInputs({ ...rationalInputs, tc })}
                                                            onClose={() => setShowTcCalc(false)}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 p-5">
                                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-4">Parameter Hidrologi</h2>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="mb-2">
                                                    <SNILabel
                                                        label="Koefisien Pengaliran (C)"
                                                        tooltip="Koefisien pengaliran berdasarkan karakteristik tata guna lahan DAS"
                                                        sniCode="SNI 2415:2016 (Lampiran A) & Permen PU 12/2014"
                                                    />
                                                </div>
                                                <RunoffCoefficientInput
                                                    value={rationalInputs.C}
                                                    onChange={(v) => setRationalInputs({ ...rationalInputs, C: v || 0 })}
                                                    required={true}
                                                />
                                            </div>
                                            <div>
                                                <SNILabel
                                                    label="Intensitas Hujan (I)"
                                                    tooltip="Intensitas hujan dihitung otomatis dari R₂₄ menggunakan rumus Mononobe"
                                                    sniCode="SNI 2415:2016 Pasal 4"
                                                />
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={rationalInputs.I}
                                                        readOnly
                                                        className="min-h-[44px] w-full bg-slate-100 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-sm p-3 pr-20 outline-none cursor-not-allowed"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">mm/jam</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">Dihitung otomatis: I = (R₂₄/24) × (24/tc)^(2/3)</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 p-5">
                                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-4">Data Curah Hujan</h2>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-500 block mb-2">Sumber Data</label>
                                                <div className="flex gap-2 p-1 bg-slate-100 rounded-sm">
                                                    <button
                                                        onClick={() => setRainfallDataSource('manual')}
                                                        className={`flex-1 py-2 px-3 rounded-sm text-xs font-bold transition-all ${rainfallDataSource === 'manual' ? 'bg-white dark:bg-slate-900 text-teal-600 ' : 'text-slate-500'
                                                            }`}
                                                    >
                                                        Input Manual
                                                    </button>
                                                    <button
                                                        onClick={() => setRainfallDataSource('frequency')}
                                                        className={`flex-1 py-2 px-3 rounded-sm text-xs font-bold transition-all ${rainfallDataSource === 'frequency' ? 'bg-white dark:bg-slate-900 text-teal-600 ' : 'text-slate-500'
                                                            }`}
                                                    >
                                                        Analisis Frekuensi
                                                    </button>
                                                </div>
                                            </div>

                                            {rainfallDataSource === 'manual' ? (
                                                <div>
                                                    <label className="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-500 uppercase tracking-wide mb-2">
                                                        Curah Hujan Harian (R₂₄)
                                                        <TooltipIcon text="Curah hujan maksimum harian untuk kala ulang tertentu" />
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={rationalInputs.R24 || 100}
                                                            onChange={e => {
                                                                const R24 = parseFloat(e.target.value) || 0;
                                                                const tcHours = rationalInputs.tc / 60;
                                                                const I = calculateMononobeIntensity(R24, tcHours);
                                                                setRationalInputs({ ...rationalInputs, R24, I });
                                                            }}
                                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-sm p-3 pr-16 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">mm</span>
                                                    </div>
                                                    <div className="mt-2 p-2 bg-pupr-surface border border-pupr-border rounded-sm">
                                                        <p className="text-xs text-blue-800">
                                                            <span className="font-semibold">Auto-calculate:</span> I = {rationalInputs.I.toFixed(2)} mm/jam (Mononobe)
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-pupr-blue text-white border border-teal-200 rounded-sm">
                                                    <p className="text-xs text-slate-700 dark:text-slate-300 mb-3">Gunakan analisis frekuensi untuk menghitung hujan rencana berbagai kala ulang</p>
                                                    <button
                                                        onClick={() => setShowFreqAnalysis(true)}
                                                        className="w-full px-4 py-2.5 bg-pupr-blue text-white rounded-sm hover:bg-teal-700 transition-colors text-xs font-bold flex items-center justify-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                        Buka Analisis Frekuensi
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 p-5">
                                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-4">Geometri DAS</h2>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-500 uppercase tracking-wide mb-2">
                                                    Luas DAS (A)
                                                    <TooltipIcon text={TOOLTIPS.A} />
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={nakayasuInputs.A}
                                                        onChange={e => setNakayasuInputs({ ...nakayasuInputs, A: parseFloat(e.target.value) || 0 })}
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-sm p-3 pr-16 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">km²</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-500 uppercase tracking-wide mb-2">
                                                    Panjang Sungai (L)
                                                    <TooltipIcon text={TOOLTIPS.L} />
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={nakayasuInputs.L}
                                                        onChange={e => setNakayasuInputs({ ...nakayasuInputs, L: parseFloat(e.target.value) || 0 })}
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-sm p-3 pr-16 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">km</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 p-5">
                                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-4">Parameter Hidrologi</h2>
                                        <div className="space-y-4">
                                            <div>
                                                <SNILabel
                                                    label="Koefisien Limpasan (C)"
                                                    tooltip="Koefisien untuk mengubah curah hujan total menjadi hujan efektif (Ro = C × R). Nilai tergantung tata guna lahan."
                                                    sniCode="Permen PU 12/2014"
                                                />
                                                <RunoffCoefficientInput
                                                    value={nakayasuInputs.C || 0.7}
                                                    onChange={(v) => {
                                                        const R = nakayasuInputs.Ro / (nakayasuInputs.C || 0.7);
                                                        const newRo = R * (v || 0.7);
                                                        setNakayasuInputs({ ...nakayasuInputs, C: v || 0.7, Ro: newRo });
                                                    }}
                                                    required={true}
                                                />
                                            </div>
                                            <div>
                                                <label className="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-500 uppercase tracking-wide mb-2">
                                                    Hujan Efektif (Ro)
                                                    <TooltipIcon text={TOOLTIPS.Ro} />
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={nakayasuInputs.Ro}
                                                        readOnly
                                                        className="min-h-[44px] w-full bg-slate-100 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-sm p-3 pr-16 outline-none cursor-not-allowed"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">mm</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">Dihitung otomatis: Ro = C × R</p>
                                            </div>
                                            <div>
                                                <SNILabel
                                                    label="Koefisien Alpha (α)"
                                                    tooltip="Parameter karakteristik DAS yang mempengaruhi bentuk hidrograf. Kisaran normal 1.5 - 3.0 tergantung kondisi topografi dan tata guna lahan"
                                                    sniCode="SNI 2415:2016"
                                                />
                                                <AlphaParameterInput
                                                    value={nakayasuInputs.Alpha}
                                                    onChange={(v) => setNakayasuInputs({ ...nakayasuInputs, Alpha: v || 2.0 })}
                                                    required={true}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 p-5">
                                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-4">Data Curah Hujan</h2>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-500 block mb-2">Sumber Data</label>
                                                <div className="flex gap-2 p-1 bg-slate-100 rounded-sm">
                                                    <button
                                                        onClick={() => setRainfallDataSource('manual')}
                                                        className={`flex-1 py-2 px-3 rounded-sm text-xs font-bold transition-all ${rainfallDataSource === 'manual' ? 'bg-white dark:bg-slate-900 text-teal-600 ' : 'text-slate-500'
                                                            }`}
                                                    >
                                                        Input Manual
                                                    </button>
                                                    <button
                                                        onClick={() => setRainfallDataSource('frequency')}
                                                        className={`flex-1 py-2 px-3 rounded-sm text-xs font-bold transition-all ${rainfallDataSource === 'frequency' ? 'bg-white dark:bg-slate-900 text-teal-600 ' : 'text-slate-500'
                                                            }`}
                                                    >
                                                        Analisis Frekuensi
                                                    </button>
                                                </div>
                                            </div>

                                            {rainfallDataSource === 'manual' ? (
                                                <div>
                                                    <label className="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-500 uppercase tracking-wide mb-2">
                                                        Curah Hujan Rencana (R)
                                                        <TooltipIcon text="Curah hujan untuk kala ulang tertentu yang akan dikonversi menjadi hujan efektif" />
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={nakayasuInputs.Ro / (nakayasuInputs.C || 0.7)}
                                                            onChange={e => {
                                                                const R = parseFloat(e.target.value) || 0;
                                                                const Ro = R * (nakayasuInputs.C || 0.7);
                                                                setNakayasuInputs({ ...nakayasuInputs, Ro });
                                                            }}
                                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-sm p-3 pr-16 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">mm</span>
                                                    </div>
                                                    <div className="mt-2 p-2 bg-pupr-surface border border-pupr-border rounded-sm">
                                                        <p className="text-xs text-blue-800">
                                                            <span className="font-semibold">Auto-calculate:</span> Ro = {nakayasuInputs.Ro.toFixed(2)} mm (C × R)
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-pupr-blue text-white border border-teal-200 rounded-sm">
                                                    <p className="text-xs text-slate-700 dark:text-slate-300 mb-3">Gunakan analisis frekuensi untuk menghitung hujan rencana berbagai kala ulang</p>
                                                    <button
                                                        onClick={() => setShowFreqAnalysis(true)}
                                                        className="w-full px-4 py-2.5 bg-pupr-blue text-white rounded-sm hover:bg-teal-700 transition-colors text-xs font-bold flex items-center justify-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                        Buka Analisis Frekuensi
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div
                        onMouseDown={() => setIsResizing(true)}
                        className={`hidden lg:block w-1 cursor-col-resize hover:bg-pupr-blue transition-colors flex-shrink-0 relative ${isResizing ? 'bg-pupr-blue' : 'bg-transparent'}`}
                        style={{ userSelect: 'none' }}
                    >
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-20 bg-slate-300 rounded-sm hover:bg-pupr-blue transition-colors"></div>
                    </div>

                    {/* MAIN CONTENT */}
                    <div className="w-full lg:w-auto space-y-3 md:space-y-4" style={{ width: window.innerWidth >= 1024 ? `${100 - sidebarWidth}%` : '100%' }}>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-3 relative z-0">
                            {method === 'RATIONAL' ? (
                                <>
                                    <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 p-5 group relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                                Koefisien Limpasan
                                                <svg className="w-3 h-3 text-slate-500 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                                                    Rasio antara limpasan permukaan dengan curah hujan total
                                                </div>
                                            </span>
                                            <div className="w-10 h-10 rounded-sm bg-emerald-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-emerald-600 font-mono">{rationalInputs.C.toFixed(2)}</div>
                                        <div className="text-xs text-slate-500 font-medium mt-1">Koefisien C</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 p-5 group relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                                Intensitas Hujan
                                                <svg className="w-3 h-3 text-slate-500 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                                                    Intensitas curah hujan rata-rata selama waktu konsentrasi
                                                </div>
                                            </span>
                                            <div className="w-10 h-10 rounded-sm bg-blue-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-pupr-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-pupr-blue font-mono">{rationalInputs.I.toFixed(1)}</div>
                                        <div className="text-xs text-slate-500 font-medium mt-1">mm/jam</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 p-5 group relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                                Luas DAS
                                                <svg className="w-3 h-3 text-slate-500 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                                                    Luas daerah tangkapan air hulu hingga titik tinjau
                                                </div>
                                            </span>
                                            <div className="w-10 h-10 rounded-sm bg-teal-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-teal-600 font-mono">{rationalInputs.A.toFixed(2)}</div>
                                        <div className="text-xs text-slate-500 font-medium mt-1">km²</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 p-5 group relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                                Waktu Konsentrasi
                                                <svg className="w-3 h-3 text-slate-500 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                                                    Waktu yang diperlukan air dari titik terjauh mencapai outlet
                                                </div>
                                            </span>
                                            <div className="w-10 h-10 rounded-sm bg-slate-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-slate-600 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-slate-600 dark:text-slate-500 font-mono">{rationalInputs.tc.toFixed(0)}</div>
                                        <div className="text-xs text-slate-500 font-medium mt-1">menit</div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 p-5 group relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                                Luas DAS
                                                <svg className="w-3 h-3 text-slate-500 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                                                    Luas daerah tangkapan air hulu hingga titik tinjau
                                                </div>
                                            </span>
                                            <div className="w-10 h-10 rounded-sm bg-teal-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-teal-600 font-mono">{nakayasuInputs.A.toFixed(1)}</div>
                                        <div className="text-xs text-slate-500 font-medium mt-1">km²</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 p-5 group relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                                Panjang Sungai
                                                <svg className="w-3 h-3 text-slate-500 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                                                    Panjang sungai utama dari hulu hingga outlet
                                                </div>
                                            </span>
                                            <div className="w-10 h-10 rounded-sm bg-blue-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-pupr-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-pupr-blue font-mono">{nakayasuInputs.L.toFixed(1)}</div>
                                        <div className="text-xs text-slate-500 font-medium mt-1">km</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 p-5 group relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                                Hujan Efektif
                                                <svg className="w-3 h-3 text-slate-500 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                                                    Tinggi hujan efektif yang menjadi limpasan permukaan
                                                </div>
                                            </span>
                                            <div className="w-10 h-10 rounded-sm bg-purple-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-purple-600 font-mono">{nakayasuInputs.Ro.toFixed(1)}</div>
                                        <div className="text-xs text-slate-500 font-medium mt-1">mm</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 p-5 group relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                                Koefisien Alpha
                                                <svg className="w-3 h-3 text-slate-500 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="absolute top-2 left-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-56 z-50">
                                                    Koefisien karakteristik DAS, tergantung kondisi topografi
                                                </div>
                                            </span>
                                            <div className="w-10 h-10 rounded-sm bg-slate-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-slate-600 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-slate-600 dark:text-slate-500 font-mono">{nakayasuInputs.Alpha.toFixed(1)}</div>
                                        <div className="text-xs text-slate-500 font-medium mt-1">α</div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Chart */}
                        <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 p-6 relative overflow-hidden">
                            {isCalculating && (
                                <div className="absolute inset-0 z-10 bg-white dark:bg-slate-900 ] flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-sm animate-spin"></div>
                                        <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">Menghitung...</span>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                        Hidrograf Banjir Rencana
                                        {method === 'NAKAYASU' && (
                                            <span className={`text-[10px] px-2 py-0.5 rounded-sm font-medium ${convolutionResult ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                                                {convolutionResult ? 'Konvolusi Aktif (DFH)' : 'Unit Hydrograph (Ro=10mm)'}
                                            </span>
                                        )}
                                    </h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-xs text-slate-500">
                                            Metode: <span className="font-bold text-indigo-600">{method.replace(/_/g, ' ')}</span> |
                                            Debit Puncak: <span className="font-bold text-teal-600">{qPeak.toFixed(2)} m³/s</span>
                                        </p>
                                        {method === 'RATIONAL' && (
                                            <WhiteBoxFormula
                                                title="Metode Rasional (SNI 2415:2016)"
                                                theoretical="Q = 0.278 \times C \times I \times A"
                                                substituted={`Q = 0.278 \times ${rationalInputs.C.toFixed(2)} \times ${rationalInputs.I.toFixed(1)} \times ${rationalInputs.A.toFixed(2)}`}
                                                result={`Q = ${qPeak.toFixed(2)} \text{ m}^3/s`}
                                                variables={{ 'C': rationalInputs.C, 'I': rationalInputs.I, 'A': rationalInputs.A }}
                                            />
                                        )}
                                        {(method === 'HASPERS' || method === 'DER_WEDUWEN' || method === 'MELCHIOR') && (
                                            <WhiteBoxFormula
                                                title={`Metode ${method.replace(/_/g, ' ')} (Empiris)`}
                                                theoretical="Q = \alpha \times \beta \times q \times A"
                                                substituted={`Q = \text{API Calculated for } ${rationalInputs.A} \text{ km}^2`}
                                                result={`Q = ${qPeak.toFixed(2)} \text{ m}^3/s`}
                                                variables={{ 'A': rationalInputs.A, 'L': rationalInputs.L || 0, 'S': rationalInputs.S || 0 }}
                                            />
                                        )}
                                        {method === 'NAKAYASU' && (
                                            <WhiteBoxFormula
                                                title="HSS Nakayasu (SNI 2415:2016)"
                                                theoretical="Q_p = \frac{A \times R_o}{3.6 \times (0.3 T_p + T_{0.3})}"
                                                substituted={`Q_p = \frac{${nakayasuInputs.A} \times ${nakayasuInputs.Ro.toFixed(1)}}{3.6 \times (0.3 \times ${tPeak.toFixed(2)} + ${(nakayasuInputs.Alpha * (tPeak / 1.8)).toFixed(2)})}`}
                                                result={`Q_p = ${qPeak.toFixed(2)} \text{ m}^3/s`}
                                                variables={{ 'A': nakayasuInputs.A, 'R_o': nakayasuInputs.Ro, 'T_p': tPeak, '\alpha': nakayasuInputs.Alpha }}
                                            />
                                        )}
                                    </div>
                                </div>
                                <ComplianceBadge sniCode="SNI 2415:2016" />
                            </div>
                            {qPeak > 500 && (
                                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-sm flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs text-amber-800">
                                        <p className="font-semibold">Peringatan: Debit sangat tinggi ({qPeak.toFixed(0)} m³/s)</p>
                                        <p className="mt-1">Pastikan satuan input sudah benar:</p>
                                        <ul className="list-disc ml-4 mt-1">
                                            <li>Luas DAS (A) dalam km²</li>
                                            <li>Hujan satuan (Ro) dalam mm (biasanya 10-20 mm, bukan 100 mm)</li>
                                            <li>Panjang sungai (L) dalam km</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                            <FloodHydrographChart
                                data={hydrographData}
                                secondaryData={convolutionResult ? unitHydrographData : undefined}
                                qPeak={qPeak}
                                tPeak={tPeak}
                                volume={volume}
                                title="Hidrograf Banjir Rencana"
                                primaryColor="#0d9488"
                                height={window.innerWidth < 768 ? 250 : 350}
                            />
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-600 dark:text-slate-500">
                                    <span className="font-semibold">Catatan:</span> Perhitungan debit banjir rencana ini mengacu pada tata cara <span className="font-semibold text-teal-600">SNI 2415:2016</span>. Pastikan parameter hujan rencana telah melalui analisis frekuensi (Log Pearson III/Gumbel) sesuai standar.
                                </p>
                            </div>
                        </div>

                        {/* Return Period Analysis */}
                        <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 p-6">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Analisis Kala Ulang</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-slate-500 mt-1">Hasil perhitungan debit untuk berbagai kala ulang</p>
                                    {rainfallDataSource === 'manual' && (
                                        <button
                                            onClick={() => setShowFreqAnalysis(true)}
                                            className="px-3 py-2 bg-teal-50 text-teal-600 rounded-sm hover:bg-teal-100 transition-colors border border-teal-200 text-xs font-bold"
                                        >
                                            Analisis Frekuensi
                                        </button>
                                    )}
                                </div>
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                                <th className="text-left py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300 text-xs uppercase">Kala Ulang</th>
                                                <th className="text-right py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300 text-xs uppercase">Hujan (mm)</th>
                                                <th className="text-right py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300 text-xs uppercase">Qpeak (m³/s)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {returnPeriods.map((rp, idx) => {
                                                const guidance = RETURN_PERIOD_GUIDANCE[rp.period];
                                                return (
                                                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 dark:bg-slate-800">
                                                        <td className="py-2.5 px-3 tabular-nums tracking-tight">
                                                            <div className="font-bold text-slate-900 dark:text-slate-100">{rp.period}</div>
                                                            <div className={`text-[10px] ${guidance?.color || 'text-slate-500'} font-medium mt-0.5`}>{guidance?.infrastructure}</div>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right tabular-nums tracking-tight">
                                                            <input
                                                                type="number"
                                                                value={rp.rainfall}
                                                                onChange={e => {
                                                                    const updated = [...returnPeriods];
                                                                    updated[idx].rainfall = parseFloat(e.target.value) || 0;
                                                                    setReturnPeriods(updated);
                                                                }}
                                                                className="w-20 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm font-bold focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none"
                                                            />
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right font-bold text-teal-600 tabular-nums tracking-tight">{rp.qPeak.toFixed(2)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-3">
                                    {returnPeriods.map((rp, idx) => {
                                        const guidance = RETURN_PERIOD_GUIDANCE[rp.period];
                                        return (
                                            <div key={idx} className="bg-slate-50 dark:bg-slate-800 rounded-sm p-4 border border-slate-200 dark:border-slate-700">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <span className="text-base font-bold text-slate-900 dark:text-slate-100">{rp.period}</span>
                                                        <div className={`text-xs ${guidance?.color || 'text-slate-500'} font-medium mt-0.5`}>{guidance?.infrastructure}</div>
                                                    </div>
                                                    <span className="text-lg font-bold text-teal-600">{rp.qPeak.toFixed(2)} m³/s</span>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 font-medium mb-1 block">Hujan (mm)</label>
                                                    <input
                                                        type="number"
                                                        value={rp.rainfall}
                                                        onChange={e => {
                                                            const updated = [...returnPeriods];
                                                            updated[idx].rainfall = parseFloat(e.target.value) || 0;
                                                            setReturnPeriods(updated);
                                                        }}
                                                        className="w-full text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm px-3 py-2 font-bold focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex flex-col md:flex-row gap-2 pt-2">
                                    <button
                                        onClick={handleSaveToDB}
                                        disabled={isSaving}
                                        className="flex-1 min-h-[44px] px-4 py-2.5 bg-pupr-blue text-white rounded-sm hover:bg-blue-700 active:bg-blue-800 transition-colors font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                        </svg>
                                        {isSaving ? 'Menyimpan...' : 'Simpan Hasil'}
                                    </button>
                                    {onConsultAI && (
                                        <button
                                            onClick={onConsultAI}
                                            className="w-full md:w-auto min-h-[44px] px-4 py-2.5 bg-slate-700 text-white rounded-sm hover:bg-slate-800 active:bg-slate-900 transition-colors font-bold text-sm flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Analisis AI
                                        </button>
                                    )}
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <div className="flex items-start gap-2">
                                        <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-slate-600 dark:text-slate-500">
                                            Perhitungan ini mengacu pada standar <span className="font-semibold text-slate-700 dark:text-slate-300">SNI 2415:2016</span> tentang Tata Cara Perhitungan Debit Banjir Rencana. Pastikan parameter hujan rencana telah melalui analisis frekuensi (Log Pearson III/Gumbel) sesuai standar.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Frequency Analysis Modal */}
            {showFreqAnalysis && (
                <FrequencyAnalysisCalculator
                    onApply={(rainfalls) => {
                        const updated = returnPeriods.map((rp, idx) => ({
                            ...rp,
                            rainfall: parseFloat(rainfalls[idx].toFixed(1))
                        }));
                        setReturnPeriods(updated);
                    }}
                    onClose={() => setShowFreqAnalysis(false)}
                />
            )}
        </div>
    );
};
