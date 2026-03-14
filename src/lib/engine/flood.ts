/**
 * Flood Calculation Engine (Legacy Proxy)
 * =====================================
 * This file acts as a bridge between legacy implementations and the new
 * SNI 2415:2016 standard engine.
 * 
 * @deprecated Use functions from `@/lib/engine/flood/index` for new code.
 */

import { z } from 'zod';
import { SNI_VALIDATION_LIMITS } from '../constants/sni';
import { 
 calculateRationalDischarge as calculateRationalSNI,
 calculateHSSNakayasu as calculateHSSNakayasuSNI,
 validateRationalInput as validateRationalSNI,
 validateHSSNakayasuInput as validateHSSNakayasuSNI
} from './flood/sni2415';

import type {
 RationalMethodInput,
 RationalMethodOutput,
 HSSNakayasuInput,
 HSSNakayasuOutput,
 HSSGamma1Input,
 HSSGamma1Output,
 HSSSnyderInput,
 HSSSnyderOutput,
 MelchiorInput,
 MelchiorOutput,
 HaspersInput,
 HaspersOutput,
 DerWeduwenInput,
 DerWeduwenOutput,
 HSSClarkInput,
 HSSClarkOutput,
 HSSSCSInput,
 HSSSCSOutput,
 ConvolutionInput,
 ConvolutionOutput,
} from '@/types/hydrology';

// ─── DELEGATED SNI 2415:2016 FUNCTIONS ───────────────────────────────

export const calculateRational = (input: RationalMethodInput): RationalMethodOutput => {
 return calculateRationalSNI(input);
};

export const calculateHSSNakayasu = (input: HSSNakayasuInput): HSSNakayasuOutput => {
 return calculateHSSNakayasuSNI(input);
};

export const validateRationalInput = (input: RationalMethodInput): boolean => {
 validateRationalSNI(input);
 return true;
};

export const validateHSSNakayasuInput = (input: HSSNakayasuInput): boolean => {
 validateHSSNakayasuSNI(input);
 return true;
};

// ─── HSS METHODS ─────────────────────────────────────────────────────

const HSSGamma1InputSchema = z.object({
 Ro: z.number().min(SNI_VALIDATION_LIMITS.unitRainfall.min).max(SNI_VALIDATION_LIMITS.unitRainfall.max),
 A: z.number().positive(),
 L: z.number().positive(),
 S: z.number().positive(),
 SF: z.number().min(0.0001).max(100),
 SIM: z.number().min(0.0001).max(100),
 JN: z.number().min(0.0001).max(100),
 SN: z.number().min(0.0001).max(1.0),
 RUA: z.number().min(0.0001).max(1.0),
});

export const calculateHSSGamma1 = (input: HSSGamma1Input): HSSGamma1Output => {
 const validated = HSSGamma1InputSchema.parse(input);
 const { Ro, A, L, S, SF, SIM, JN, SN, RUA } = validated;

 const TR = 0.43 * Math.pow(L / (100 * SF), 3) + 1.0665 * SIM + 1.2775;
 const QP = 0.1836 * Math.pow(A, 0.5886) * Math.pow(TR, -0.4008) * Math.pow(JN, 0.2381);
 const TB = 27.4132 * Math.pow(TR, 0.1457) * Math.pow(S, -0.0986) * Math.pow(SN, 0.7344) * Math.pow(RUA, 0.2574);
 const K = (TB - TR) / 3;

 const hydrograph: Array<{ time: number; discharge: number }> = [];
 const dt = 0.1;
 const maxTime = Math.max(TB, 24);

 for (let t = 0; t <= maxTime; t += dt) {
 let Q = 0;
 if (t <= TR) {
 Q = (QP / TR) * t;
 } else {
 Q = QP * Math.exp(-(t - TR) / K);
 }
 hydrograph.push({ 
 time: parseFloat(t.toFixed(2)), 
 discharge: parseFloat((Q * Ro).toFixed(4)) 
 });
 }

 return { Qp: parseFloat((QP * Ro).toFixed(3)), Tp: parseFloat(TR.toFixed(2)), Tb: parseFloat(TB.toFixed(2)), hydrograph };
};

const HSSSnyderInputSchema = z.object({
 Ro: z.number().min(SNI_VALIDATION_LIMITS.unitRainfall.min).max(SNI_VALIDATION_LIMITS.unitRainfall.max),
 A: z.number().min(SNI_VALIDATION_LIMITS.catchmentArea.min).max(SNI_VALIDATION_LIMITS.catchmentArea.max),
 L: z.number().min(SNI_VALIDATION_LIMITS.riverLength.min).max(SNI_VALIDATION_LIMITS.riverLength.max),
 Lc: z.number().min(0.01).max(SNI_VALIDATION_LIMITS.riverLength.max),
 Ct: z.number().min(0.1).max(10),
 Cp: z.number().min(0.1).max(10),
});

export const calculateHSSSnyder = (input: HSSSnyderInput): HSSSnyderOutput => {
 const validated = HSSSnyderInputSchema.parse(input);
 const { Ro, A, L, Lc, Ct, Cp } = validated;

 const tpR = Ct * Math.pow(L * Lc, 0.3);
 const tr = tpR / 5.5;
 const Tp = tpR + 0.25 * tr;
 const Qp = (2.78 * Cp * A * Ro) / Tp;
 const Tb = Tp + (3 + 0.125 * (Tp / 24)) * 24; 

 const hydrograph: Array<{ time: number; discharge: number }> = [];
 const dt = 0.2;
 for (let t = 0; t <= Tb; t += dt) {
 let Q = 0;
 if (t <= Tp) Q = Qp * Math.pow(t / Tp, 2.0);
 else Q = Qp * Math.pow((Tb - t) / (Tb - Tp), 1.2);
 hydrograph.push({ time: parseFloat(t.toFixed(2)), discharge: parseFloat(Q.toFixed(4)) });
 }

 return { Qp: parseFloat(Qp.toFixed(3)), Tp: parseFloat(Tp.toFixed(2)), Tb: parseFloat(Tb.toFixed(2)), hydrograph };
};

const HSSSCSInputSchema = z.object({
 Ro: z.number().min(SNI_VALIDATION_LIMITS.unitRainfall.min).max(SNI_VALIDATION_LIMITS.unitRainfall.max),
 A: z.number().min(SNI_VALIDATION_LIMITS.catchmentArea.min).max(SNI_VALIDATION_LIMITS.catchmentArea.max),
 L: z.number().min(0.1).max(1000),
 S: z.number().min(0.0001).max(1.0),
 Tc: z.number().optional(),
});

export const calculateHSSSCS = (input: HSSSCSInput): HSSSCSOutput => {
 const validated = HSSSCSInputSchema.parse(input);
 let { Ro, A, L, S, Tc } = validated;
 if (!Tc) Tc = 0.0195 * Math.pow(L * 1000, 0.77) * Math.pow(S, -0.385) / 60;
 const Tp = 0.6 * Tc + 0.5;
 const Qp = (0.208 * A * Ro) / Tp;
 const Tb = 5 * Tp;

 const hydrograph: Array<{ time: number; discharge: number }> = [];
 for (let t = 0; t <= Tb; t += 0.5) {
 const ratio = t / Tp;
 let Q = ratio <= 1 ? Qp * Math.pow(ratio, 1.5) * Math.exp(1.5 * (1 - ratio)) : Qp * Math.pow(ratio, -1.5) * Math.exp(-1.5 * (ratio - 1));
 hydrograph.push({ time: parseFloat(t.toFixed(2)), discharge: parseFloat(Q.toFixed(4)) });
 }
 return { Qp: parseFloat(Qp.toFixed(3)), Tp: parseFloat(Tp.toFixed(2)), Tb: parseFloat(Tb.toFixed(2)), hydrograph };
};

const HSSClarkInputSchema = z.object({
 Ro: z.number().min(SNI_VALIDATION_LIMITS.unitRainfall.min).max(SNI_VALIDATION_LIMITS.unitRainfall.max),
 A: z.number().min(SNI_VALIDATION_LIMITS.catchmentArea.min).max(SNI_VALIDATION_LIMITS.catchmentArea.max),
 Tc: z.number().min(0.1).max(48),
 R: z.number().min(0.1).max(48),
});

export const calculateHSSClark = (input: HSSClarkInput): HSSClarkOutput => {
 const validated = HSSClarkInputSchema.parse(input);
 const { Ro, A, Tc, R } = validated;
 const Tb = Tc + 3 * R;
 const hydrograph: Array<{ time: number; discharge: number }> = [];
 const dt = 0.5;
 let prevQ = 0;
 const C = dt / (2 * R + dt);
 for (let t = 0; t <= Tb; t += dt) {
 const I = t <= Tc ? (A * Ro / Tc) : 0;
 const Q = C * (I + I) + (1 - 2 * C) * prevQ;
 const safeQ = Math.max(0, Q);
 hydrograph.push({ time: parseFloat(t.toFixed(2)), discharge: parseFloat(safeQ.toFixed(4)) });
 prevQ = safeQ;
 }
 const Qp = Math.max(...hydrograph.map(h => h.discharge));
 const peak = hydrograph.find(h => h.discharge === Qp);
 return { Qp: parseFloat(Qp.toFixed(3)), Tp: peak?.time || 0, Tb: parseFloat(Tb.toFixed(2)), hydrograph };
};

// ─── EMPIRICAL METHODS ───────────────────────────────────────────────

export const calculateMelchior = (input: MelchiorInput): MelchiorOutput => {
 const { A, L, S, R24 } = input;
 const tc = 0.43 * Math.pow(L / Math.sqrt(S), 0.467);
 let Alpha = A > 100 ? Math.max(0.5, 1 - (0.012 * Math.pow(A, 0.5) / Math.pow(tc, 0.2))) : 1.0;
 const Qp = (Alpha * 0.7 * (R24 / 24) * A) / 3.6;
 return { Qp: parseFloat(Qp.toFixed(3)), Alpha: parseFloat(Alpha.toFixed(3)), tc: parseFloat(tc.toFixed(2)) };
};

export const calculateHaspers = (input: HaspersInput): HaspersOutput => {
 const { A, L, S, R24 } = input;
 const tc = 0.1 * L * Math.pow(S, -0.33); 
 const Alpha = 1 / (1 + ((1 + 0.012 * Math.pow(A, 0.7)) / (1 + 0.075 * Math.pow(A, 0.7))) * ((tc + (3.7e-4 * A)) / (Math.pow(tc, 2) + 15)));
 const Qp = (Alpha * (R24 / 24) * ((tc + 1) / tc) * A) / 3.6;
 return { Qp: parseFloat(Qp.toFixed(3)), Alpha: parseFloat(Alpha.toFixed(3)), tc: parseFloat(tc.toFixed(2)) };
};

export const calculateWeduwen = (input: DerWeduwenInput): DerWeduwenOutput => {
 const { A, L, S, R24 } = input;
 const tc = 0.25 * L * Math.pow(S, -0.125); 
 const Alpha = 1 - (Math.sqrt(A) / (Math.sqrt(A) + 3 * tc));
 const Qp = (Alpha * (R24 / 24) * ((67 + tc) / (1.25 + tc)) * A) / 3.6;
 return { Qp: parseFloat(Qp.toFixed(3)), Alpha: parseFloat(Alpha.toFixed(3)), tc: parseFloat(tc.toFixed(2)) };
};

export const calculateConvolution = (input: ConvolutionInput): ConvolutionOutput => {
 const { effectiveRainfall, unitHydrograph } = input;
 const floodHydrograph: Array<{ time: number; discharge: number }> = [];
 const dt = unitHydrograph[1]?.time - unitHydrograph[0]?.time || 1;
 for (let tIdx = 0; tIdx < effectiveRainfall.length + unitHydrograph.length - 1; tIdx++) {
 let Q = 0;
 for (let i = 0; i < effectiveRainfall.length; i++) {
 const idxUH = tIdx - i;
 if (idxUH >= 0 && idxUH < unitHydrograph.length) Q += effectiveRainfall[i] * unitHydrograph[idxUH].discharge;
 }
 floodHydrograph.push({ time: parseFloat((tIdx * dt).toFixed(2)), discharge: parseFloat(Q.toFixed(4)) });
 }
 const Qp = Math.max(...floodHydrograph.map(f => f.discharge));
 const peak = floodHydrograph.find(f => f.discharge === Qp);
 return { hydrograph: floodHydrograph, Qp: parseFloat(Qp.toFixed(3)), Tp: peak?.time || 0 };
};
