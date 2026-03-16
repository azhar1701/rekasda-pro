/**
 * Satellite-Ground Rainfall Bias Correction Utility
 * Used to adjust CHIRPS/GPM satellite data based on ground truth (PCH)
 */

export interface BiasResult {
 biasFactor: number;
 groundTotal: number;
 satelliteTotal: number;
 overlapYears: number[];
 adjustedData: { date: string; rainfall: number }[];
 metrics: {
    nse: number; // Nash-Sutcliffe Efficiency
    pearsonR: number; // Correlation Coefficient
    pbias: number; // Percent Bias
    status: 'Excellent' | 'Good' | 'Satisfactory' | 'Unsatisfactory';
  };
}

/**
 * Calculates Bias Factor (BF) and applies adjustment with statistical validation
 * @param groundData Annual maximums or totals from ground stations
 * @param satelliteData Data from satellite (CHIRPS/GPM)
 */
export const calculateBiasCorrection = (
 groundAnnual: { tahun: number; hujan: number }[],
 satelliteAnnual: { tahun: number; hujan: number }[],
 satelliteDaily: { date: string; rainfall: number }[]
): BiasResult | null => {
 // 1. Find overlapping years
 const groundYears = new Set(groundAnnual.map(d => d.tahun));
 const satelliteYears = new Set(satelliteAnnual.map(d => d.tahun));
 const overlap = Array.from(groundYears).filter(y => satelliteYears.has(y)).sort();

 if (overlap.length === 0) return null;

 // 2. Prepare datasets for overlap
  const gVals: number[] = [];
  const sVals: number[] = [];
  let groundSum = 0;
  let satelliteSum = 0;

  overlap.forEach(year => {
    const g = groundAnnual.find(d => d.tahun === year)?.hujan || 0;
    const s = satelliteAnnual.find(d => d.tahun === year)?.hujan || 0;
    gVals.push(g);
    sVals.push(s);
    groundSum += g;
    satelliteSum += s;
  });

 if (satelliteSum === 0) return null;

 // 3. Calculate Bias Factor (Ground / Satellite)
 const biasFactor = groundSum / satelliteSum;

 // 4. Calculate Metrik Validasi
  // (a) Pearson R
  const n = gVals.length;
  const sumG = gVals.reduce((a, b) => a + b, 0);
  const sumS = sVals.reduce((a, b) => a + b, 0);
  const sumGS = gVals.reduce((a, b, i) => a + (b * sVals[i]), 0);
  const sumG2 = gVals.reduce((a, b) => a + (b * b), 0);
  const sumS2 = sVals.reduce((a, b) => a + (b * b), 0);
  
  const numeratorR = (n * sumGS) - (sumG * sumS);
  const denominatorR = Math.sqrt(((n * sumG2) - (sumG * sumG)) * ((n * sumS2) - (sumS * sumS)));
  const pearsonR = denominatorR === 0 ? 0 : numeratorR / denominatorR;

  // (b) NSE (Nash-Sutcliffe Efficiency)
  // NSE = 1 - [ Σ(g - s)^2 / Σ(g - mean_g)^2 ]
  const meanG = sumG / n;
  const numNSE = gVals.reduce((a, b, i) => a + Math.pow(b - sVals[i], 2), 0);
  const denNSE = gVals.reduce((a, b) => a + Math.pow(b - meanG, 2), 0);
  const nse = denNSE === 0 ? 0 : 1 - (numNSE / denNSE);

  // (c) PBIAS (Percent Bias)
  // PBIAS = [ Σ(s - g) * 100 / Σg ]
  const pbias = groundSum === 0 ? 0 : ((satelliteSum - groundSum) * 100) / groundSum;

  // Status classification based on Moriasi et al. (2007)
  let status: 'Excellent' | 'Good' | 'Satisfactory' | 'Unsatisfactory' = 'Unsatisfactory';
  const absPbias = Math.abs(pbias);
  if (nse > 0.75 && absPbias < 10) status = 'Excellent';
  else if (nse > 0.65 && absPbias < 15) status = 'Good';
  else if (nse > 0.50 && absPbias < 25) status = 'Satisfactory';

 // 5. Apply to daily satellite data
 const adjustedData = satelliteDaily.map(d => ({
 date: d.date,
 rainfall: parseFloat((d.rainfall * biasFactor).toFixed(2))
 }));

 return {
 biasFactor,
 groundTotal: groundSum,
 satelliteTotal: satelliteSum,
 overlapYears: overlap,
 adjustedData,
    metrics: {
      nse,
      pearsonR,
      pbias,
      status
    }
 };
};
