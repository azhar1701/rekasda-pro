import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { calculateTg, calculateTp, calculateT03, calculateQp, generateHydrograph } from '@/lib/utils/calculations/nakayasu';
import { calculateRationalMethod, convertKm2ToHa } from '@/lib/engine';
import { generateRationalHydrograph as generateRationalHydrographEngine } from '@/lib/engine/flood/hydrograph';
import { useFloodWorker } from '@/hooks/useFloodWorker';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { useSNI2415Workflow } from '@/hooks/useSNI2415Workflow';
import { useRasionalModifikasiMutation } from '@/hooks/api/useBanjirApi';

export type MethodType = 'RATIONAL' | 'NAKAYASU' | 'HASPERS' | 'DER_WEDUWEN' | 'MELCHIOR';

export const floodFormSchema = z.object({
    method: z.enum(['RATIONAL', 'NAKAYASU', 'HASPERS', 'DER_WEDUWEN', 'MELCHIOR']),
    rational: z.object({
        C: z.number({ invalid_type_error: "Harus berupa angka" }).min(0.01, "Minimal 0.01").max(1.0, "Maksimal 1.0"),
        A: z.number({ invalid_type_error: "Harus berupa angka" }).positive("Luas (A) harus > 0"),
        tc: z.number({ invalid_type_error: "Harus berupa angka" }).positive("Waktu konsentrasi > 0"),
        I: z.number({ invalid_type_error: "Harus berupa angka" }).positive("Intensitas hujan > 0"),
        R24: z.number({ invalid_type_error: "Harus berupa angka" }).optional().default(100),
        L: z.number({ invalid_type_error: "Harus berupa angka" }).positive("Panjang sungai > 0").default(1.5),
        S: z.number({ invalid_type_error: "Harus berupa angka" }).positive("Kemiringan > 0").default(0.01),
    }),
    nakayasu: z.object({
        A: z.number({ invalid_type_error: "Harus berupa angka" }).positive("Area harus > 0"),
        L: z.number({ invalid_type_error: "Harus berupa angka" }).positive("Panjang sungai > 0"),
        Ro: z.number({ invalid_type_error: "Harus berupa angka" }).positive("Hujan efektif > 0"),
        Alpha: z.number({ invalid_type_error: "Harus berupa angka" }).min(1.5, "Alpha min 1.5").max(3.0, "Alpha max 3.0"),
        C: z.number().optional().default(0.7)
    }),
    returnPeriods: z.array(z.object({
        period: z.string(),
        rainfall: z.number().positive(),
        qPeak: z.number()
    }))
});

export type FloodFormValues = z.infer<typeof floodFormSchema>;

export function useFloodAnalysis() {
    const form = useForm<FloodFormValues>({
        resolver: zodResolver(floodFormSchema),
        defaultValues: {
            method: 'RATIONAL',
            rational: { C: 0.7, A: 0.5, tc: 30, I: 100, R24: 100, L: 1.5, S: 0.01 },
            nakayasu: { A: 50, L: 15, Ro: 10, Alpha: 2, C: 0.7 },
            returnPeriods: [
                { period: 'Q2', rainfall: 80, qPeak: 0 },
                { period: 'Q5', rainfall: 100, qPeak: 0 },
                { period: 'Q10', rainfall: 120, qPeak: 0 },
                { period: 'Q25', rainfall: 140, qPeak: 0 },
                { period: 'Q50', rainfall: 160, qPeak: 0 },
                { period: 'Q100', rainfall: 180, qPeak: 0 }
            ]
        },
        mode: 'onChange' // Validasi seketika (real-time) di UI
    });

    const values = form.watch();
    const { method, rational, nakayasu, returnPeriods } = values;

    const [locationData, setLocationData] = useState<any>(null);
    const [hydrographData, setHydrographData] = useState<any[]>([]);
    const [qPeak, setQPeak] = useState<number>(0);
    const [tPeak, setTPeak] = useState<number>(0);
    const [volume, setVolume] = useState<number>(0);
    const [unitHydrographData, setUnitHydrographData] = useState<any[]>([]);
    
    // Core Engine & Orchestration
    const [isCalculating, setIsCalculating] = useState(false);
    const [calculateRationalDischarge, setCalculateRationalDischarge] = useState({ qPeak: 0, warnings: [] as string[] });
    const { distribusiHujanJamJaman, setHasilKonvolusi } = useHydrologyStore();
    const { isWorkerReady, calculateFloodAsync, calculateBatchFloodAsync } = useFloodWorker();
    const rasionalMutation = useRasionalModifikasiMutation();

    const activeArea = method === 'RATIONAL' || method === 'HASPERS' || method === 'DER_WEDUWEN' || method === 'MELCHIOR' ? rational.A : nakayasu.A;
    const sniWorkflow = useSNI2415Workflow(activeArea || 0);

    const isInputValid = form.formState.isValid;

    // Derived Logic for Rational Method API/Engine
    useEffect(() => {
        let active = true;
        const fetchRational = async () => {
            if (!isInputValid) return; // Tunggu valid sesuai Zod Schema

            try {
                if (method === 'HASPERS' || method === 'DER_WEDUWEN' || method === 'MELCHIOR') {
                    const res = await rasionalMutation.mutateAsync({
                        method: method === 'DER_WEDUWEN' ? 'der_weduwen' : method.toLowerCase() as any,
                        A: rational.A,
                        L: rational.L || 1.5,
                        S: rational.S || 0.01,
                        I: rational.I,
                        C: method === 'MELCHIOR' ? rational.C : undefined
                    });
                    if (active) setCalculateRationalDischarge({ qPeak: res.qPeak, warnings: res.warnings || [] });
                } else {
                    const areaHa = convertKm2ToHa(rational.A);
                    const result = calculateRationalMethod({
                        C: rational.C,
                        I: rational.I,
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
    }, [method, rational.C, rational.I, rational.A, rational.L, rational.S, rational.R24, isInputValid]);

    // Generate Single Hydrograph based on method (Rational or Nakayasu)
    useEffect(() => {
        if (!isInputValid) return;

        if (method === 'RATIONAL' || method === 'HASPERS' || method === 'DER_WEDUWEN' || method === 'MELCHIOR') {
            const Q = calculateRationalDischarge.qPeak;
            const tcHours = rational.tc / 60;
            const vol = Q * tcHours * 3600;
            setQPeak(Q);
            setTPeak(tcHours);
            setVolume(vol);
            const rResult = generateRationalHydrographEngine({ Q, tc: rational.tc });
            setHydrographData(rResult.data.hydrograph);
        } else {
            const Tg = calculateTg(nakayasu.L);
            const Tp = calculateTp(Tg);
            const T03 = calculateT03(nakayasu.Alpha, Tg);
            const Q = calculateQp(nakayasu.A, nakayasu.Ro, Tp, T03);

            const uhOrdinates = generateHydrograph(Q, Tp, T03, 0.1);
            setUnitHydrographData(uhOrdinates);

            if (distribusiHujanJamJaman && distribusiHujanJamJaman.length > 0 && isWorkerReady) {
                setIsCalculating(true);
                calculateFloodAsync({
                    unitHydrograph: uhOrdinates,
                    abmRainfall: distribusiHujanJamJaman,
                    uhTimeStep: 0.1
                }).then(conv => {
                    setHasilKonvolusi(conv);
                    setQPeak(conv.peakDischarge);
                    setTPeak(conv.timeToPeak);
                    setVolume(conv.totalVolume);
                    setHydrographData(conv.floodHydrograph);
                }).catch(console.error).finally(() => setIsCalculating(false));
            } else {
                setHasilKonvolusi(null);
                setQPeak(Q);
                setTPeak(Tp);
                setVolume(Q * Tp * 3600);
                setHydrographData(uhOrdinates);
            }
        }
    }, [method, calculateRationalDischarge, rational.tc, nakayasu, distribusiHujanJamJaman, isWorkerReady, isInputValid]);

    // Batch Process Return Periods
    const lastRainfallKeyRef = useRef('');
    useEffect(() => {
        if (!isInputValid) return;
        const rainfallKey = returnPeriods.map(r => r.rainfall).join(',');
        if (rainfallKey === lastRainfallKeyRef.current) return;
        lastRainfallKeyRef.current = rainfallKey;

        if (method === 'RATIONAL') {
            const updated = returnPeriods.map(rp => {
                const tcHours = rational.tc / 60;
                const I = (rp.rainfall / 24) * Math.pow(24 / tcHours, 2 / 3);
                const areaHa = convertKm2ToHa(rational.A);
                try {
                    const result = calculateRationalMethod({ C: rational.C, I, A: areaHa });
                    return { ...rp, qPeak: result.Q };
                } catch {
                    return { ...rp, qPeak: 0 };
                }
            });
            form.setValue('returnPeriods', updated, { shouldValidate: true });
        } else {
            const Tg = calculateTg(nakayasu.L);
            const Tp = calculateTp(Tg);
            const T03 = calculateT03(nakayasu.Alpha, Tg);

            if (distribusiHujanJamJaman && distribusiHujanJamJaman.length > 0 && isWorkerReady) {
                setIsCalculating(true);
                const batchInputs = returnPeriods.map(rp => {
                    const Qp = calculateQp(nakayasu.A, rp.rainfall, Tp, T03);
                    const uhOrdinates = generateHydrograph(Qp, Tp, T03, 0.1);
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
                        form.setValue('returnPeriods', updated, { shouldValidate: true });
                    }).catch(console.error).finally(() => setIsCalculating(false));
            } else {
                const updated = returnPeriods.map(rp => {
                    const Qp = calculateQp(nakayasu.A, rp.rainfall, Tp, T03);
                    return { ...rp, qPeak: Qp };
                });
                form.setValue('returnPeriods', updated, { shouldValidate: true });
            }
        }
    }, [returnPeriods, method, rational.tc, rational.A, rational.C, nakayasu.L, nakayasu.A, nakayasu.Alpha, isWorkerReady, isInputValid, distribusiHujanJamJaman]);

    return {
        form,
        values,
        locationData,
        setLocationData,
        hydrographData,
        unitHydrographData,
        qPeak,
        tPeak,
        volume,
        isCalculating,
        engineWarnings: calculateRationalDischarge.warnings,
        sniWorkflow
    };
}
