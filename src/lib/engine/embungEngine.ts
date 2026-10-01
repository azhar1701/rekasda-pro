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
  MassCurvePoint,
  StageDischargeCurve,
  SpillwayConfig,
  RegionalSedimentInput,
  RegionalSedimentResult
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
 * Helper: Linear Interpolation with boundary clamping
 */
export function linearInterpolate(x: number, xArr: number[], yArr: number[]): number {
  if (xArr.length === 0 || yArr.length === 0) return 0;
  if (x <= xArr[0]) return yArr[0];
  if (x >= xArr[xArr.length - 1]) return yArr[yArr.length - 1];
  for (let i = 0; i < xArr.length - 1; i++) {
    if (x >= xArr[i] && x <= xArr[i + 1]) {
      const denom = xArr[i + 1] - xArr[i];
      if (denom === 0) return yArr[i];
      const factor = (x - xArr[i]) / denom;
      return yArr[i] + factor * (yArr[i + 1] - yArr[i]);
    }
  }
  return yArr[0];
}

/**
 * 2a. Spillway Stage-Discharge Curve Generator
 * Pd. T-03-2005-A / SNI 03-3432-1994: Q = Cd * B * (H - Hcrest)^1.5
 * Menghasilkan kurva elevasi vs debit keluar pelimpah.
 */
export function generateSpillwayDischargeCurve(
  elevations: number[],
  config: SpillwayConfig
): StageDischargeCurve {
  const { crestElevation, crestLength, dischargeCoefficient } = config;
  
  // Ambil set unik elevasi, pastikan crestElevation juga ada di dalam kurva
  const elevSet = new Set<number>(elevations);
  elevSet.add(crestElevation);
  
  const sortedElev = Array.from(elevSet).sort((a, b) => a - b);
  
  const discharge = sortedElev.map(elev => {
    if (elev <= crestElevation) return 0;
    const head = elev - crestElevation;
    return dischargeCoefficient * crestLength * Math.pow(head, 1.5);
  });

  return {
    elevation: sortedElev,
    discharge
  };
}

/**
 * 2b. Flood Routing (Modified Puls Method)
 * Menelusuri hidrograf banjir melewati waduk (Level-Pool Routing).
 */
export function calculateFloodRouting(input: FloodRoutingInput): FloodRoutingResult {
  const { inflowHydrograph, stageStorageCurve, stageDischargeCurve, deltaT, initialElevation } = input;
  
  if (inflowHydrograph.length < 2) throw new Error("Inflow hydrograph must have at least 2 points");

  const n = stageStorageCurve.elevation.length;
  if (n === 0) throw new Error("Stage storage curve is empty");

  // 1. Build extended curves to ensure 1-to-1 alignment and accommodate peak surcharge without clamping
  const extElevations = [...stageStorageCurve.elevation];
  const extStorages = [...stageStorageCurve.storage];
  const extOutflows = extElevations.map(e =>
    linearInterpolate(e, stageDischargeCurve.elevation, stageDischargeCurve.discharge)
  );

  // Extrapolate upwards 10 meters in 0.5m steps above top contour
  const topElev = extElevations[n - 1];
  const topStorage = extStorages[n - 1];
  const topArea = stageStorageCurve.area?.[n - 1] ?? (
    n > 1 ? (extStorages[n - 1] - extStorages[n - 2]) / (extElevations[n - 1] - extElevations[n - 2]) : 50000
  );

  const topDischarge = extOutflows[n - 1];
  const prevDischarge = n > 1 ? extOutflows[n - 2] : 0;
  const dQdE = (topDischarge - prevDischarge) / ((extElevations[n - 1] - (n > 1 ? extElevations[n - 2] : 1)) || 1);

  // Find crest elevation where discharge begins
  const crestElev = stageDischargeCurve.elevation.find((_, idx) => stageDischargeCurve.discharge[idx] > 0) ?? (topElev - 1);

  for (let s = 1; s <= 20; s++) {
    const extraH = s * 0.5;
    const curElev = topElev + extraH;
    extElevations.push(curElev);
    // Extrapolate storage using surface area prism: S = S_top + A_top * extraH
    extStorages.push(topStorage + topArea * extraH);

    // Extrapolate outflow using weir discharge scaling if crest is known, otherwise tangent slope
    const baseHead = topElev - crestElev;
    const curHead = curElev - crestElev;
    if (baseHead > 0 && topDischarge > 0) {
      extOutflows.push(topDischarge * Math.pow(curHead / baseHead, 1.5));
    } else {
      extOutflows.push(topDischarge + dQdE * extraH);
    }
  }

  // 2. Auxiliary Puls Indicator: (2S/dt) + O
  const fPulsValues: number[] = extElevations.map((_, idx) => {
    return (2 * extStorages[idx] / deltaT) + extOutflows[idx];
  });

  const steps: RoutingTimeStep[] = [];
  
  // Initial condition
  let S1 = linearInterpolate(initialElevation, extElevations, extStorages);
  let O1 = linearInterpolate(initialElevation, extElevations, extOutflows);
  
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
    
    // Find O2, S2, H2 from ruasKiri using 1-to-1 aligned extended arrays
    const O2 = linearInterpolate(ruasKiri, fPulsValues, extOutflows);
    const S2 = linearInterpolate(ruasKiri, fPulsValues, extStorages);
    const H2 = linearInterpolate(S2, extStorages, extElevations);

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
  
  // Trap Efficiency (Brune, 1953) - Median Curve via Tabular Interpolation
  let trapEfficiency = 0; 
  if (reservoirCapacity && input.annualInflow) {
      const cr = reservoirCapacity / input.annualInflow; // Capacity-Inflow ratio
      
      // Brune Median Curve Table: [C/I, TE(%)]
      const BRUNE_TABLE: [number, number][] = [
        [0.001, 0.0], [0.005, 16.0], [0.01, 43.0], [0.02, 63.0],
        [0.05, 78.0], [0.1, 87.0], [0.2, 93.0], [0.3, 95.0],
        [0.5, 96.0], [1.0, 98.0], [2.0, 99.0], [10.0, 100.0]
      ];

      if (cr <= 0.001) {
          trapEfficiency = 0;
      } else if (cr >= 10.0) {
          trapEfficiency = 100;
      } else {
          for (let i = 0; i < BRUNE_TABLE.length - 1; i++) {
              const [cr0, te0] = BRUNE_TABLE[i];
              const [cr1, te1] = BRUNE_TABLE[i + 1];
              if (cr >= cr0 && cr <= cr1) {
                  const fraction = (cr - cr0) / (cr1 - cr0);
                  trapEfficiency = te0 + fraction * (te1 - te0);
                  break;
              }
          }
      }
  } else {
      // Brown (1944) Alternative Curve for small reservoirs without known C/I
      // TE = 100 * (1 - (1 / (1 + 0.0021 * D * (C/W))))
      // simplified to a conservative default of 95% if no data is provided.
      trapEfficiency = 95;
  }

  const trappedVolumeM3 = (trapEfficiency / 100) * totalVolumeM3;
  const specificYield = totalLoadTonnes / luasDas;
  const erosionRateMm = (totalVolumeM3 / (luasDas * 1000000)) * 1000;
  const lifespanYears = (input.deadStorageM3 && input.deadStorageM3 > 0 && trappedVolumeM3 > 0)
    ? input.deadStorageM3 / trappedVolumeM3
    : undefined;

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
    specificYield,
    lifespanYears
  };
}

/**
 * Presets laju erosi permukaan lahan per regional / tutupan lahan
 * Sumber: SNI 03-3432-1994, Formula USLE Erosi Lahan
 */
export const REGIONAL_SEDIMENT_PRESETS = [
  { id: 'jawa_kritis', label: 'Jawa — DAS Kritis (Pertanian Lahan Miring/Gundul)', rateMmYear: 2.5 },
  { id: 'jawa_sedang', label: 'Jawa — DAS Sedang (Campuran Permukiman & Kebun)', rateMmYear: 1.5 },
  { id: 'jawa_hutan', label: 'Jawa — DAS Baik / Kawasan Lindung', rateMmYear: 0.8 },
  { id: 'luar_jawa_kebun', label: 'Luar Jawa — DAS Perkebunan & Semak', rateMmYear: 1.8 },
  { id: 'luar_jawa_hutan', label: 'Luar Jawa — DAS Hutan Primer / Alami', rateMmYear: 0.5 },
];

/**
 * 4b. Estimasi Laju Sedimen Berdasarkan Erosi Regional & SDR (Sediment Delivery Ratio)
 * Berdasarkan SNI 03-3432-1994 & Formula Boyd (1976)
 * Cocok untuk embung kecil yang belum memiliki stasiun pengamatan suspensi sedimen harian.
 */
export function calculateRegionalSedimentYield(input: RegionalSedimentInput): RegionalSedimentResult {
  const {
    luasDasKm2,
    erosionRateMmYear,
    sdr: customSdr,
    beratJenisTonM3 = 1.4,
    trapEfficiencyPercent = 95,
    deadStorageM3
  } = input;

  if (luasDasKm2 <= 0) throw new Error("Luas DAS harus lebih besar dari 0");
  if (erosionRateMmYear <= 0) throw new Error("Laju erosi harus lebih besar dari 0");

  // 1. Gross surface erosion volume: E = Rate(mm/yr) * Area(m²) * 10^-3 = Rate * Area(km²) * 1000
  const grossErosionM3 = erosionRateMmYear * luasDasKm2 * 1000;
  const grossErosionTonnes = grossErosionM3 * beratJenisTonM3;

  // 2. Sediment Delivery Ratio (SDR)
  // Boyd (1976): SDR = 0.47 * (A)^-0.125 where A is DAS area in km² (capped between 0.1 and 1.0)
  const calculatedSdr = customSdr !== undefined && customSdr > 0
    ? customSdr
    : Math.min(1.0, Math.max(0.1, 0.47 * Math.pow(luasDasKm2, -0.125)));

  // 3. Sediment Yield at Embung Inlet
  const sedimentYieldM3 = grossErosionM3 * calculatedSdr;
  const sedimentYieldTonnes = sedimentYieldM3 * beratJenisTonM3;

  // 4. Trapped sediment volume in reservoir
  const trappedVolumeM3 = sedimentYieldM3 * (trapEfficiencyPercent / 100);

  // 5. Lifespan of dead storage
  const lifespanYears = deadStorageM3 && deadStorageM3 > 0 && trappedVolumeM3 > 0
    ? deadStorageM3 / trappedVolumeM3
    : undefined;

  return {
    grossErosionM3,
    grossErosionTonnes,
    sdr: calculatedSdr,
    sedimentYieldM3,
    sedimentYieldTonnes,
    trapEfficiencyPercent,
    trappedVolumeM3,
    erosionRateMmYear,
    lifespanYears
  };
}

