// Water Balance Calculation Engine - SNI 6738:2015 & UU No. 17/2019

import { z } from 'zod';

export interface WaterBalanceInputs {
  population: number;
  agricultureArea: number; // Ha
  domesticStandard: number; // L/capita/day
  irrigationDemand: number; // L/s/Ha
  monthlySupply: number[]; // 12 months Q80 (m³/s)
}

// Zod validation schema
const WaterBalanceInputsSchema = z.object({
  population: z.number().min(0, 'Jumlah penduduk harus ≥ 0'),
  agricultureArea: z.number().min(0, 'Luas lahan pertanian harus ≥ 0'),
  domesticStandard: z.number().min(0, 'Standar kebutuhan air harus ≥ 0').max(500, 'Standar kebutuhan air tidak realistis'),
  irrigationDemand: z.number().min(0, 'Kebutuhan irigasi harus ≥ 0').max(5, 'Kebutuhan irigasi tidak realistis'),
  monthlySupply: z.array(z.number().min(0, 'Debit bulanan harus ≥ 0')).length(12, 'Harus ada 12 data bulanan')
});

export interface WaterBalanceResult {
  month: string;
  supply: number; // m³/s
  domesticDemand: number; // m³/s
  agricultureDemand: number; // m³/s
  environmentalFlow: number; // m³/s (UU 17/2019)
  totalDemand: number; // m³/s
  balance: number; // m³/s
  status: 'Surplus' | 'Defisit' | 'Seimbang';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/**
 * Menghitung Kebutuhan Air Domestik
 * Sesuai SNI 6728.1:2015 Pasal 5.2
 * 
 * @param population - Jumlah penduduk (jiwa)
 * @param standard - Standar kebutuhan (L/capita/day)
 *   - Kota Besar: 120-150 L/capita/day
 *   - Kota Sedang: 100-120 L/capita/day
 *   - Kota Kecil: 80-100 L/capita/day
 *   - Pedesaan: 60-80 L/capita/day
 * @returns Kebutuhan air domestik (m³/s)
 */
export const calculateDomesticDemand = (population: number, standard: number = 100): number => {
  // Konversi: (jiwa × L/capita/day) / (1000 L/m³ × 86400 s/day)
  return (population * standard) / 86400000;
};

/**
 * Menghitung Kebutuhan Air Pertanian
 * Sesuai SNI 6738:2015 Pasal 6.3
 * 
 * @param area - Luas lahan pertanian (Ha)
 * @param demand - Kebutuhan irigasi (L/s/Ha)
 *   - Padi: 1.0-1.5 L/s/Ha
 *   - Palawija: 0.5-0.8 L/s/Ha
 *   - Perkebunan: 0.3-0.5 L/s/Ha
 * @returns Kebutuhan air pertanian (m³/s)
 */
export const calculateAgricultureDemand = (area: number, demand: number = 1.0): number => {
  // Konversi: (Ha × L/s/Ha) / (1000 L/m³)
  return (area * demand) / 1000;
};

/**
 * Menghitung Neraca Air Bulanan
 * Sesuai SNI 6738:2015 & UU No. 17/2019 Pasal 22
 * 
 * @param inputs - Parameter neraca air
 * @returns Array hasil neraca air 12 bulan
 */
export const calculateWaterBalance = (inputs: WaterBalanceInputs): WaterBalanceResult[] => {
  const validated = WaterBalanceInputsSchema.parse(inputs);
  const domesticDemand = calculateDomesticDemand(validated.population, validated.domesticStandard);
  const agricultureDemand = calculateAgricultureDemand(validated.agricultureArea, validated.irrigationDemand);
  
  return validated.monthlySupply.map((supply, index) => {
    // Debit Lingkungan (Environmental Flow) - UU No. 17/2019 Pasal 22
    // Minimum 10% dari debit tersedia untuk ekosistem
    const environmentalFlow = supply * 0.10;
    
    // Total kebutuhan air
    const totalDemand = domesticDemand + agricultureDemand + environmentalFlow;
    
    // Neraca air (surplus/defisit)
    const balance = supply - totalDemand;
    
    // Status neraca
    let status: 'Surplus' | 'Defisit' | 'Seimbang';
    if (balance > 0.01) status = 'Surplus';
    else if (balance < -0.01) status = 'Defisit';
    else status = 'Seimbang';
    
    return {
      month: MONTHS[index],
      supply: parseFloat(supply.toFixed(3)),
      domesticDemand: parseFloat(domesticDemand.toFixed(3)),
      agricultureDemand: parseFloat(agricultureDemand.toFixed(3)),
      environmentalFlow: parseFloat(environmentalFlow.toFixed(3)),
      totalDemand: parseFloat(totalDemand.toFixed(3)),
      balance: parseFloat(balance.toFixed(3)),
      status
    };
  });
};

/**
 * Mendapatkan Ringkasan Statistik Neraca Air
 * 
 * @param results - Hasil perhitungan neraca air
 * @returns Ringkasan statistik
 */
export const getWaterBalanceSummary = (results: WaterBalanceResult[]) => {
  const surplusMonths = results.filter(r => r.status === 'Surplus').length;
  const deficitMonths = results.filter(r => r.status === 'Defisit').length;
  const totalDeficit = results.reduce((sum, r) => sum + (r.balance < 0 ? Math.abs(r.balance) : 0), 0);
  const totalSurplus = results.reduce((sum, r) => sum + (r.balance > 0 ? r.balance : 0), 0);
  const criticalMonth = results.reduce((min, r) => r.balance < min.balance ? r : min, results[0]);
  
  // Reliabilitas pasokan air (% bulan surplus)
  const reliability = (surplusMonths / 12) * 100;
  
  return {
    surplusMonths,
    deficitMonths,
    totalDeficit: parseFloat(totalDeficit.toFixed(3)),
    totalSurplus: parseFloat(totalSurplus.toFixed(3)),
    criticalMonth,
    reliability: parseFloat(reliability.toFixed(1))
  };
};
