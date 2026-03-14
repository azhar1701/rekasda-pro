/**
 * =============================================================================
 * Embung Engine — Centralized Hydrology Logic for Situ & Waduk
 * =============================================================================
 * This engine handles:
 * 1. Capacity Analysis (Sequent Peak / Rippl Method)
 * 2. Flood Routing (Modified Puls / Level-Pool Routing)
 * 3. Reservoir Operation / Monthly Water Balance
 * 4. Sedimentation & Lifespan Prediction
 * =============================================================================
 */

import type {
 SequentPeakInput,
 SequentPeakResult,
 FloodRoutingInput,
 FloodRoutingResult,
 RoutingTimeStep,
 WaterBalanceConfig,
 WaterBalanceStepInput,
 WaterBalanceResult,
 WaterBalanceTimeStep,
 SedimentationInput,
 SedimentYieldResult,
 MassCurvePoint
} from '@/features/embung/types/embung.types';

/**
 * 1. Sequent Peak Algorithm (Metode Rippl)
 * Menghitung volume tampungan efektif yang dibutuhkan untuk memenuhi demand.
 */
export function calculateSequentPeak(input: SequentPeakInput): SequentPeakResult {
 const { inflow, outflow } = input;
 const n = inflow.length;
 
 const netFlow: number[] = [];
 const cumulativeNetFlow: number[] = [0];
 const massCurveData: MassCurvePoint[] = [];
 
 let cumInflow = 0;
 let cumOutflow = 0;
 let cumNet = 0;

 for (let i = 0; i < n; i++) {
 const net = inflow[i] - outflow[i];
 netFlow.push(net);
 
 cumInflow += inflow[i];
 cumOutflow += outflow[i];
 cumNet += net;
 
 cumulativeNetFlow.push(cumNet);
 
 massCurveData.push({
 period: i + 1,
 month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Des'][i % 12],
 cumulativeInflow: cumInflow,
 cumulativeOutflow: cumOutflow,
 cumulativeNetFlow: cumNet
 });
 }

 // Sequent Peak Algorithm
 // S(t) = max(0, S(t-1) + Demand(t) - Inflow(t))
 // Or: S(t) = max(0, S(t-1) - NetFlow(t))
 const sequentPeak: number[] = [0];
 const requiredStorage: number[] = [0];
 let maxStorageRequired = 0;

 for (let i = 0; i < n; i++) {
 const s = Math.max(0, sequentPeak[i] - netFlow[i]);
 sequentPeak.push(s);
 requiredStorage.push(s);
 if (s > maxStorageRequired) maxStorageRequired = s;
 }

 return {
 netFlow,
 cumulativeNetFlow: cumulativeNetFlow.slice(1),
 sequentPeak: sequentPeak.slice(1),
 requiredStorage: requiredStorage.slice(1),
 maxStorageRequired,
 massCurveData
 };
}

/**
 * 2. Flood Routing (Modified Puls Method)
 * Menelusuri hidrograf banjir melewati waduk (Level-Pool Routing).
 */
export function calculateFloodRouting(input: FloodRoutingInput): FloodRoutingResult {
 const { inflowHydrograph, stageStorageCurve, stageDischargeCurve, deltaT, initialElevation } = input;
 
 if (inflowHydrograph.length < 2) throw new Error("Inflow hydrograph must have at least 2 points");

 // Auxiliary function: (2S/dt) + O
 const calculateFPuls = (elevation: number) => {
 const s = interpolate(elevation, stageStorageCurve.elevation, stageStorageCurve.storage);
 const o = interpolate(elevation, stageDischargeCurve.elevation, stageDischargeCurve.discharge);
 return (2 * s / deltaT) + o;
 };

 // Interpolate function (helper)
 const interpolate = (x: number, xArr: number[], yArr: number[]) => {
 if (x <= xArr[0]) return yArr[0];
 if (x >= xArr[xArr.length - 1]) return yArr[yArr.length - 1];
 for (let i = 0; i < xArr.length - 1; i++) {
 if (x >= xArr[i] && x <= xArr[i+1]) {
 const factor = (x - xArr[i]) / (xArr[i+1] - xArr[i]);
 return yArr[i] + factor * (yArr[i+1] - yArr[i]);
 }
 }
 return yArr[0];
 };

 // Build Indicator Curve: FPuls vs O and FPuls vs S
 const fPulsValues: number[] = stageStorageCurve.elevation.map(calculateFPuls);

 const steps: RoutingTimeStep[] = [];
 
 // Initial condition
 let S1 = interpolate(initialElevation, stageStorageCurve.elevation, stageStorageCurve.storage);
 let O1 = interpolate(initialElevation, stageDischargeCurve.elevation, stageDischargeCurve.discharge);
 
 steps.push({
 time: inflowHydrograph[0].time,
 inflowAvg: inflowHydrograph[0].discharge,
 outflow: O1,
 storage: S1,
 elevation: initialElevation
 });

 for (let i = 1; i < inflowHydrograph.length; i++) {
 const I1 = inflowHydrograph[i-1].discharge;
 const I2 = inflowHydrograph[i].discharge;
 const dt = deltaT;

 // Puls Indicator: (2S1/dt - O1) + I1 + I2 = 2S2/dt + O2
 const pulsIndicator = (2 * S1 / dt) - O1;
 const ruasKiri = I1 + I2 + pulsIndicator;
 
 // Find O2 and S2 from ruasKiri
 const O2 = interpolate(ruasKiri, fPulsValues, stageDischargeCurve.discharge);
 const S2 = interpolate(ruasKiri, fPulsValues, stageStorageCurve.storage);
 const H2 = interpolate(S2, stageStorageCurve.storage, stageStorageCurve.elevation);

 steps.push({
 time: inflowHydrograph[i].time,
 inflowAvg: (I1 + I2) / 2,
 outflow: O2,
 storage: S2,
 elevation: H2
 });

 S1 = S2;
 O1 = O2;
 }

 const peakInflow = Math.max(...inflowHydrograph.map(h => h.discharge));
 const peakOutflow = Math.max(...steps.map(s => s.outflow));

 return {
 steps,
 peakInflow,
 peakOutflow,
 maxElevation: Math.max(...steps.map(s => s.elevation)),
 maxStorage: Math.max(...steps.map(s => s.storage)),
 attenuationRatio: peakInflow > 0 ? (peakInflow - peakOutflow) / peakInflow : 0
 };
}

/**
 * 3. Reservoir Operation (Water Balance)
 * Simulasi volume tampungan bulanan.
 */
export function calculateReservoirOperation(
 config: WaterBalanceConfig,
 stepsIn: WaterBalanceStepInput[]
): WaterBalanceResult {
 const { maxStorage, deadStorage, initialStorage, surfaceArea, seepageLoss = 0 } = config;
 
 let currentStorage = initialStorage;
 const stepsOut: WaterBalanceTimeStep[] = [];
 let totalOverflow = 0;
 let totalDeficit = 0;
 let satisfiedPeriods = 0;

 stepsIn.forEach((input, index) => {
 const storageStart = currentStorage;
 const rainfallGain = (input.rainfall / 1000) * surfaceArea;
 const evaporationLoss = (input.evaporation / 1000) * surfaceArea;
 
 // Potentially storage before release
 let potentialStorage = storageStart + input.inflow + rainfallGain - evaporationLoss - seepageLoss;
 
 let release = 0;
 let deficit = 0;
 let overflow = 0;
 let status: WaterBalanceTimeStep['status'] = 'normal';

 // Calculate Release and Deficit
 if (potentialStorage - input.demand >= deadStorage) {
 release = input.demand;
 potentialStorage -= release;
 satisfiedPeriods++;
 } else {
 release = Math.max(0, potentialStorage - deadStorage);
 deficit = input.demand - release;
 potentialStorage = deadStorage;
 status = 'deficit';
 }

 // Calculate Overflow
 if (potentialStorage > maxStorage) {
 overflow = potentialStorage - maxStorage;
 potentialStorage = maxStorage;
 status = 'spill';
 } else if (status === 'normal' && potentialStorage > storageStart) {
 status = 'surplus';
 }

 currentStorage = potentialStorage;
 totalOverflow += overflow;
 totalDeficit += deficit;

 stepsOut.push({
 period: index,
 storageStart,
 inflow: input.inflow,
 release,
 deficit,
 rainfallGain,
 evaporationLoss,
 seepageLoss,
 overflow,
 storageEnd: currentStorage,
 status
 });
 });

 return {
 steps: stepsOut,
 totalOverflow,
 totalDeficit,
 reliability: (satisfiedPeriods / stepsIn.length) * 100
 };
}

/**
 * 4. Sedimentation Yield & Lifespan
 * Menggunakan Power Regression Q vs Qs (Ton/hari).
 */
export function calculateSedimentYield(input: SedimentationInput): SedimentYieldResult {
 const { qData, qsData, luasDas, beratJenis, bedLoadPercentage, flowDurationDays, flowDurationQ, reservoirCapacity } = input;

 if (qData.length < 2 || qData.length !== qsData.length) {
 throw new Error("Invalid sediment data samples");
 }

 // Linear Regression on log-log data: log(Qs) = log(a) + b * log(Q)
 const logQ = qData.map(q => Math.log10(q > 0 ? q : 0.0001));
 const logQs = qsData.map(qs => Math.log10(qs > 0 ? qs : 0.0001));

 const n = logQ.length;
 const sumX = logQ.reduce((a, b) => a + b, 0);
 const sumY = logQs.reduce((a, b) => a + b, 0);
 const sumXY = logQ.reduce((acc, x, i) => acc + x * logQs[i], 0);
 const sumX2 = logQ.reduce((acc, x) => acc + x * x, 0);

 const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
 const logA = (sumY - b * sumX) / n;
 const a = Math.pow(10, logA);

 // Bias Correction (Simplified BCF)
 const residuals = logQs.map((y, i) => y - (logA + b * logQ[i]));
 const sumRes2 = residuals.reduce((acc, r) => acc + r * r, 0);
 const syx = Math.sqrt(sumRes2 / (n - 2));
 const bcf = Math.exp(2.651 * Math.pow(syx, 2)); // Ferguson (1986) approximation
 
 // Calculate Annual Total using Flow Duration Curve integration if provided
 let suspendedLoadTonnes = 0;
 if (flowDurationDays && flowDurationQ) {
 flowDurationQ.forEach((q, i) => {
 const qs = a * Math.pow(q, b) * bcf;
 suspendedLoadTonnes += qs * flowDurationDays[i];
 });
 } else {
 // Fallback: average of samples * 365 (less accurate)
 const avgQs = qsData.reduce((p, c) => p + c, 0) / qsData.length;
 suspendedLoadTonnes = avgQs * 365;
 }

 const bedLoadTonnes = (bedLoadPercentage / 100) * suspendedLoadTonnes;
 const totalLoadTonnes = suspendedLoadTonnes + bedLoadTonnes;
 const totalVolumeM3 = totalLoadTonnes / beratJenis;
 
 // Trap Efficiency (Brune, 1953)
 let trapEfficiency = 95; // Default high
 if (reservoirCapacity && input.annualInflow) {
 const cr = reservoirCapacity / input.annualInflow; // Capacity-Inflow ratio
 if (cr > 0.001) {
 trapEfficiency = (cr / (0.0001 + 0.012 * cr + 0.00011 * Math.sqrt(cr))) * 100;
 if (trapEfficiency > 100) trapEfficiency = 100;
 } else {
 trapEfficiency = 0;
 }
 }

 const trappedVolumeM3 = (trapEfficiency / 100) * totalVolumeM3;
 const specificYield = totalLoadTonnes / luasDas;
 const erosionRateMm = (totalVolumeM3 / (luasDas * 1000000)) * 1000;

 return {
 a,
 b,
 bcf,
 suspendedLoadTonnes,
 bedLoadTonnes,
 totalLoadTonnes,
 totalVolumeM3,
 trapEfficiency,
 trappedVolumeM3,
 erosionRateMm,
 specificYield
 };
}
