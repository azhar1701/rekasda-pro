// Water Balance Calculation Engine - SNI 6728.1:2015

export interface WaterBalanceInputs {
  population: number;
  agricultureArea: number; // Ha
  domesticStandard: number; // L/capita/day
  irrigationDemand: number; // L/s/Ha
  monthlySupply: number[]; // 12 months Q80 (m³/s)
}

export interface WaterBalanceResult {
  month: string;
  supply: number; // m³/s
  domesticDemand: number; // m³/s
  agricultureDemand: number; // m³/s
  totalDemand: number; // m³/s
  balance: number; // m³/s
  status: 'Surplus' | 'Defisit' | 'Seimbang';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/**
 * Calculate domestic water demand (SNI 6728-1:2015)
 * @param population - Jumlah penduduk (jiwa)
 * @param standard - Standar kebutuhan air (L/capita/day), default 60-120
 * @returns Kebutuhan air domestik (m³/s)
 */
export const calculateDomesticDemand = (population: number, standard: number = 100): number => {
  // Convert L/capita/day to m³/s
  // Formula: (population × standard) / (1000 × 86400)
  return (population * standard) / 86400000;
};

/**
 * Calculate agriculture water demand
 * @param area - Luas lahan pertanian (Ha)
 * @param demand - Kebutuhan irigasi (L/s/Ha), default 1.0
 * @returns Kebutuhan air pertanian (m³/s)
 */
export const calculateAgricultureDemand = (area: number, demand: number = 1.0): number => {
  // Convert L/s/Ha to m³/s
  return (area * demand) / 1000;
};

/**
 * Calculate water balance for 12 months
 * @param inputs - Water balance inputs
 * @returns Array of monthly water balance results
 */
export const calculateWaterBalance = (inputs: WaterBalanceInputs): WaterBalanceResult[] => {
  const domesticDemand = calculateDomesticDemand(inputs.population, inputs.domesticStandard);
  const agricultureDemand = calculateAgricultureDemand(inputs.agricultureArea, inputs.irrigationDemand);
  
  return inputs.monthlySupply.map((supply, index) => {
    const totalDemand = domesticDemand + agricultureDemand;
    const balance = supply - totalDemand;
    
    let status: 'Surplus' | 'Defisit' | 'Seimbang';
    if (balance > 0.01) status = 'Surplus';
    else if (balance < -0.01) status = 'Defisit';
    else status = 'Seimbang';
    
    return {
      month: MONTHS[index],
      supply: parseFloat(supply.toFixed(3)),
      domesticDemand: parseFloat(domesticDemand.toFixed(3)),
      agricultureDemand: parseFloat(agricultureDemand.toFixed(3)),
      totalDemand: parseFloat(totalDemand.toFixed(3)),
      balance: parseFloat(balance.toFixed(3)),
      status
    };
  });
};

/**
 * Get summary statistics
 */
export const getWaterBalanceSummary = (results: WaterBalanceResult[]) => {
  const surplusMonths = results.filter(r => r.status === 'Surplus').length;
  const deficitMonths = results.filter(r => r.status === 'Defisit').length;
  const totalDeficit = results.reduce((sum, r) => sum + (r.balance < 0 ? Math.abs(r.balance) : 0), 0);
  const totalSurplus = results.reduce((sum, r) => sum + (r.balance > 0 ? r.balance : 0), 0);
  
  return {
    surplusMonths,
    deficitMonths,
    totalDeficit: parseFloat(totalDeficit.toFixed(3)),
    totalSurplus: parseFloat(totalSurplus.toFixed(3)),
    criticalMonth: results.reduce((min, r) => r.balance < min.balance ? r : min, results[0])
  };
};
