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
}

/**
 * Calculates Bias Factor (BF) and applies adjustment
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
 const overlap = Array.from(groundYears).filter(y => satelliteYears.has(y));

 if (overlap.length === 0) return null;

 // 2. Sum totals for overlapping period
 let groundSum = 0;
 let satelliteSum = 0;

 overlap.forEach(year => {
 groundSum += groundAnnual.find(d => d.tahun === year)?.hujan || 0;
 satelliteSum += satelliteAnnual.find(d => d.tahun === year)?.hujan || 0;
 });

 if (satelliteSum === 0) return null;

 // 3. Calculate Bias Factor (Ground / Satellite)
 const biasFactor = groundSum / satelliteSum;

 // 4. Apply to daily satellite data
 const adjustedData = satelliteDaily.map(d => ({
 date: d.date,
 rainfall: parseFloat((d.rainfall * biasFactor).toFixed(2))
 }));

 return {
 biasFactor,
 groundTotal: groundSum,
 satelliteTotal: satelliteSum,
 overlapYears: overlap,
 adjustedData
 };
};
