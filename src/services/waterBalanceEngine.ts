// Water Balance Calculation Engine - SNI 19-6728.1-2002, SNI 6738:2015 & UU No. 17/2019

import { z } from 'zod';
import { SNI_WATER_SCARCITY_CATEGORIES, WaterScarcityCategory } from '@/lib/constants/sni';

export interface WaterBalanceInputs {
  population: number;
  agricultureArea: number; // Ha
  domesticStandard: number; // L/capita/day
  irrigationDemand: number; // L/s/Ha (fallback if dynamicIrrigationDemand not provided)
  monthlySupply: number[]; // 12 or 24 periods Q80 (m³/s)
  dynamicIrrigationDemand?: number[]; // Array of DR (m³/s) computed per KP-01
  industrialDemand?: number; // m³/s
  environmentalFlowRatio?: number; // fraction of supply, default 0.10 (UU 17/2019)
  periodLabels?: string[]; // optional custom labels (e.g. 12 months or 24 half-months)
}

// Zod validation schema
const WaterBalanceInputsSchema = z.object({
  population: z.number().min(0, 'Jumlah penduduk harus ≥ 0'),
  agricultureArea: z.number().min(0, 'Luas lahan pertanian harus ≥ 0'),
  domesticStandard: z.number().min(0, 'Standar kebutuhan air harus ≥ 0').max(500, 'Standar kebutuhan air tidak realistis'),
  irrigationDemand: z.number().min(0, 'Kebutuhan irigasi harus ≥ 0').max(10, 'Kebutuhan irigasi tidak realistis'),
  monthlySupply: z.array(z.number().min(0, 'Debit bulanan harus ≥ 0')).min(1, 'Data pasokan air tidak boleh kosong'),
  dynamicIrrigationDemand: z.array(z.number().min(0)).optional(),
  industrialDemand: z.number().min(0).optional(),
  environmentalFlowRatio: z.number().min(0).max(1).optional(),
  periodLabels: z.array(z.string()).optional(),
});

export interface WaterBalanceResult {
  month: string;
  supply: number; // m³/s
  domesticDemand: number; // m³/s
  agricultureDemand: number; // m³/s
  industrialDemand?: number; // m³/s
  environmentalFlow: number; // m³/s (UU 17/2019)
  totalDemand: number; // m³/s
  balance: number; // m³/s
  status: 'Surplus' | 'Defisit' | 'Seimbang';
}

export const DEFAULT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const DEFAULT_DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Menghitung Kebutuhan Air Domestik
 * Sesuai SNI 6728.1:2015 & SNI 19-6728.1-2002
 * 
 * @param population - Jumlah penduduk (jiwa)
 * @param standard - Standar kebutuhan (L/capita/day)
 * @returns Kebutuhan air domestik (m³/s)
 */
export const calculateDomesticDemand = (population: number, standard: number = 100): number => {
  // Konversi: (jiwa × L/capita/day) / (1000 L/m³ × 86400 s/day)
  return (population * standard) / 86400000;
};

/**
 * Menghitung Kebutuhan Air Pertanian Konvensional (Flat)
 * 
 * @param area - Luas lahan pertanian (Ha)
 * @param demand - Kebutuhan irigasi (L/s/Ha)
 * @returns Kebutuhan air pertanian (m³/s)
 */
export const calculateAgricultureDemand = (area: number, demand: number = 1.0): number => {
  // Konversi: (Ha × L/s/Ha) / (1000 L/m³)
  return (area * demand) / 1000;
};

/**
 * Menghitung Neraca Air Bulanan / Setengah Bulanan
 * Sesuai SNI 19-6728.1-2002, SNI 6738:2015 & UU No. 17/2019 Pasal 22
 * 
 * Mendukung kebutuhan irigasi dinamis (KP-01 NFR/DR) jika disediakan.
 * 
 * @param inputs - Parameter neraca air
 * @returns Array hasil neraca air per periode
 */
export const calculateWaterBalance = (inputs: WaterBalanceInputs): WaterBalanceResult[] => {
  const validated = WaterBalanceInputsSchema.parse(inputs);
  const domesticDemand = calculateDomesticDemand(validated.population, validated.domesticStandard);
  const flatAgriDemand = calculateAgricultureDemand(validated.agricultureArea, validated.irrigationDemand);
  const industrialDemand = validated.industrialDemand || 0;
  const envRatio = validated.environmentalFlowRatio !== undefined ? validated.environmentalFlowRatio : 0.10;
  const periodCount = validated.monthlySupply.length;
  
  const labels = validated.periodLabels && validated.periodLabels.length === periodCount
    ? validated.periodLabels
    : (periodCount === 12 ? DEFAULT_MONTHS : Array.from({ length: periodCount }, (_, i) => `P-${i + 1}`));

  return validated.monthlySupply.map((supply, index) => {
    // 1. Agriculture Demand: prioritize dynamic KP-01 DR if supplied
    let agricultureDemand: number;
    if (validated.dynamicIrrigationDemand && validated.dynamicIrrigationDemand.length === periodCount) {
      agricultureDemand = validated.dynamicIrrigationDemand[index];
    } else {
      agricultureDemand = flatAgriDemand;
    }

    // 2. Environmental Flow (Debit Pemeliharaan Sungai) - UU No. 17/2019 Pasal 22
    // Minimum 10% dari debit ketersediaan untuk ekosistem
    const environmentalFlow = supply * envRatio;

    // 3. Total Kebutuhan
    const totalDemand = domesticDemand + agricultureDemand + industrialDemand + environmentalFlow;

    // 4. Neraca Air
    const balance = supply - totalDemand;

    // 5. Status
    let status: 'Surplus' | 'Defisit' | 'Seimbang';
    if (balance > 0.001) status = 'Surplus';
    else if (balance < -0.001) status = 'Defisit';
    else status = 'Seimbang';

    return {
      month: labels[index] || `P-${index + 1}`,
      supply: parseFloat(supply.toFixed(4)),
      domesticDemand: parseFloat(domesticDemand.toFixed(4)),
      agricultureDemand: parseFloat(agricultureDemand.toFixed(4)),
      industrialDemand: parseFloat(industrialDemand.toFixed(4)),
      environmentalFlow: parseFloat(environmentalFlow.toFixed(4)),
      totalDemand: parseFloat(totalDemand.toFixed(4)),
      balance: parseFloat(balance.toFixed(4)),
      status,
    };
  });
};

/**
 * Klasifikasi Indeks Kekritisan Air (IKA) sesuai SNI 19-6728.1-2002
 * IKA = (Total Kebutuhan / Total Ketersediaan) × 100%
 */
export function classifyWaterScarcity(totalDemand: number, totalSupply: number): {
  ikaRatio: number;
  ikaPercent: number;
  status: WaterScarcityCategory['status'];
  description: string;
  badgeColor: WaterScarcityCategory['badgeColor'];
} {
  if (totalSupply <= 0) {
    return {
      ikaRatio: Infinity,
      ikaPercent: 999,
      status: 'Sangat Kritis',
      description: 'Tidak ada ketersediaan air terukur (Defisit total).',
      badgeColor: 'rose',
    };
  }

  const ratio = totalDemand / totalSupply;
  const percent = parseFloat((ratio * 100).toFixed(1));

  const category = SNI_WATER_SCARCITY_CATEGORIES.find(c => ratio <= c.maxRatio) 
    || SNI_WATER_SCARCITY_CATEGORIES[SNI_WATER_SCARCITY_CATEGORIES.length - 1];

  return {
    ikaRatio: parseFloat(ratio.toFixed(3)),
    ikaPercent: percent,
    status: category.status,
    description: category.description,
    badgeColor: category.badgeColor,
  };
}

export interface WaterBalanceSummary {
  surplusMonths: number;
  deficitMonths: number;
  totalDeficit: number;
  totalSurplus: number;
  criticalMonth: WaterBalanceResult;
  reliability: number;
  totalSupply: number;
  totalDemand: number;
  netBalance: number;
  waterScarcity: ReturnType<typeof classifyWaterScarcity>;
  storageRequiredM3: number;
  storageRequiredJutaM3: number;
}

/**
 * Mendapatkan Ringkasan Statistik Neraca Air Terpadu (SNI 19-6728.1-2002)
 * 
 * @param results - Hasil perhitungan neraca air
 * @returns Ringkasan statistik, IKA, dan analisis kebutuhan waduk
 */
export const getWaterBalanceSummary = (results: WaterBalanceResult[]): WaterBalanceSummary => {
  if (!results || results.length === 0) {
    const dummyRow: WaterBalanceResult = {
      month: '-', supply: 0, domesticDemand: 0, agricultureDemand: 0, industrialDemand: 0,
      environmentalFlow: 0, totalDemand: 0, balance: 0, status: 'Seimbang'
    };
    return {
      surplusMonths: 0,
      deficitMonths: 0,
      totalDeficit: 0,
      totalSurplus: 0,
      criticalMonth: dummyRow,
      reliability: 0,
      totalSupply: 0,
      totalDemand: 0,
      netBalance: 0,
      waterScarcity: classifyWaterScarcity(0, 0),
      storageRequiredM3: 0,
      storageRequiredJutaM3: 0,
    };
  }

  const surplusMonths = results.filter(r => r.status === 'Surplus').length;
  const deficitMonths = results.filter(r => r.status === 'Defisit').length;
  const totalDeficit = results.reduce((sum, r) => sum + (r.balance < 0 ? Math.abs(r.balance) : 0), 0);
  const totalSurplus = results.reduce((sum, r) => sum + (r.balance > 0 ? r.balance : 0), 0);
  const totalSupply = results.reduce((sum, r) => sum + r.supply, 0);
  const totalDemand = results.reduce((sum, r) => sum + r.totalDemand, 0);
  const netBalance = totalSupply - totalDemand;

  const criticalMonth = results.reduce((min, r) => r.balance < min.balance ? r : min, results[0]);
  
  // Reliabilitas pasokan air (% periode surplus)
  const reliability = (surplusMonths / results.length) * 100;

  // Indeks Kekritisan Air (SNI 19-6728.1-2002)
  const waterScarcity = classifyWaterScarcity(totalDemand, totalSupply);

  // Sequent Peak Storage Calculation (Volume in m3)
  const days = results.length === 12 ? DEFAULT_DAYS_PER_MONTH : results.map(() => 15.2);
  const inflowsM3 = results.map((r, i) => r.supply * (days[i] || 30) * 86400);
  const outflowsM3 = results.map((r, i) => r.totalDemand * (days[i] || 30) * 86400);
  const storageRequiredM3 = sequentPeakAlgorithm(inflowsM3, outflowsM3);
  const storageRequiredJutaM3 = parseFloat((storageRequiredM3 / 1e6).toFixed(3));

  return {
    surplusMonths,
    deficitMonths,
    totalDeficit: parseFloat(totalDeficit.toFixed(4)),
    totalSurplus: parseFloat(totalSurplus.toFixed(4)),
    totalSupply: parseFloat(totalSupply.toFixed(4)),
    totalDemand: parseFloat(totalDemand.toFixed(4)),
    netBalance: parseFloat(netBalance.toFixed(4)),
    criticalMonth,
    reliability: parseFloat(reliability.toFixed(1)),
    waterScarcity,
    storageRequiredM3: Math.round(storageRequiredM3),
    storageRequiredJutaM3,
  };
};

/**
 * Algoritma Sequent Peak (SPA)
 * 
 * Menentukan Volume Tampungan Efektif Waduk/Embung yang dibutuhkan untuk
 * mengantisipasi kemarau kritis. Memakai 2 siklus (2 tahun/periode)
 * untuk mengakomodasi defisit lintas akhir tahun.
 * 
 * Xt = Inflow - Outflow - Losses
 * Vt = Vt-1 - Xt
 * Jika Vt < 0 maka Vt = 0.
 * Kapasitas Minimum Waduk (C) = Max(Vt) dari seluruh siklus.
 * 
 * @param inflows Array Ketersediaan (m3)
 * @param outflows Array Kebutuhan Total (m3)
 * @param losses Optional array kehilangan/evaporasi (m3)
 * @returns Kapasitas Tampungan Minimum yang diwajibkan (m3)
 */
export function sequentPeakAlgorithm(
  inflows: number[],
  outflows: number[],
  losses?: number[]
): number {
  if (inflows.length !== outflows.length || inflows.length === 0) return 0;

  // Gandakan array menjadi 2 siklus (mengakomodasi kemarau panjang lintas akhir tahun)
  const cycleInflows = [...inflows, ...inflows];
  const cycleOutflows = [...outflows, ...outflows];
  const cycleLosses = losses ? [...losses, ...losses] : cycleInflows.map(() => 0);

  let currentV = 0;
  let maxV = 0;

  for (let i = 0; i < cycleInflows.length; i++) {
    const Xt = cycleInflows[i] - cycleOutflows[i] - cycleLosses[i];
    currentV = currentV - Xt;

    if (currentV < 0) {
      currentV = 0; // Surplus tidak bisa kurang dari nol
    }

    if (currentV > maxV) {
      maxV = currentV;
    }
  }

  return maxV;
}

export interface RippleCurvePoint {
  period: string;
  monthIndex: number;
  inflowM3: number;
  outflowM3: number;
  cumInflowM3: number;
  cumOutflowM3: number;
  deficitM3: number;
  storageRequiredM3: number;
}

/**
 * Menghitung kurva Ripple Mass Curve untuk analisis tampungan waduk/embung
 */
export function calculateRippleMassCurve(
  results: WaterBalanceResult[],
  daysPerPeriod: number[] = DEFAULT_DAYS_PER_MONTH
): RippleCurvePoint[] {
  let cumInflow = 0;
  let cumOutflow = 0;
  let currentStorage = 0;

  return results.map((r, i) => {
    const days = daysPerPeriod[i] || 30;
    const seconds = days * 86400;
    const inflow = r.supply * seconds;
    const outflow = r.totalDemand * seconds;
    const net = inflow - outflow;

    cumInflow += inflow;
    cumOutflow += outflow;

    currentStorage = Math.max(0, currentStorage - net);

    return {
      period: r.month,
      monthIndex: i,
      inflowM3: Math.round(inflow),
      outflowM3: Math.round(outflow),
      cumInflowM3: Math.round(cumInflow),
      cumOutflowM3: Math.round(cumOutflow),
      deficitM3: net < 0 ? Math.round(Math.abs(net)) : 0,
      storageRequiredM3: Math.round(currentStorage),
    };
  });
}
