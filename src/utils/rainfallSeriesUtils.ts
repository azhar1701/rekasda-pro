import { DataHujan } from '@/stores/useHydrologyStore';

export interface RainfallDataPoint {
 year: number;
 value: number;
}

/**
 * Calculates weighted-average daily rainfall series from multiple stations.
 * @param allData Flat array of Rainfall data from multiple stations
 * @param weights Record mapping stasiunId to its relative weight (fraction 0-1)
 */
export function calculateArealSeries(
 allData: DataHujan[],
 weights: Record<string, number>
): DataHujan[] {
 if (!allData || allData.length === 0) return [];
 
 // Group by date
 const dataByDate: Record<string, Record<string, number>> = {};
 allData.forEach(d => {
 if (!dataByDate[d.tanggal]) dataByDate[d.tanggal] = {};
 dataByDate[d.tanggal][d.stasiun_id] = d.curah_hujan;
 });

 const dates = Object.keys(dataByDate).sort();
 const result: DataHujan[] = [];

 dates.forEach(date => {
 let weightedSum = 0;
 let totalWeightInDate = 0;
 
 // Calculate based on weights of stations that HAVE data on this date
 Object.entries(weights).forEach(([stasiunId, weight]) => {
 const rainfall = dataByDate[date][stasiunId];
 if (rainfall !== undefined) {
 weightedSum += rainfall * weight;
 totalWeightInDate += weight;
 }
 });

 // Normalize if data is missing for some stations (Standard Hydrology Practice)
 // If totalWeightInDate is 0.7 (out of 1.0), it means 30% of the area is missing data.
 // We adjust the value: realValue = weightedSum / totalWeightInDate
 if (totalWeightInDate > 0) {
 result.push({
 id: `areal-${date}`,
 stasiun_id: 'areal-composite',
 tanggal: date,
 curah_hujan: Number((weightedSum / totalWeightInDate).toFixed(2))
 });
 }
 });

 return result;
}

/**
 * Extracts the maximum rainfall value for each year from a time series.
 * returns exactly the top value per calendar year.
 */
export function extractAnnualMaximums(data: DataHujan[]): RainfallDataPoint[] {
 if (!data || data.length === 0) return [];

 const byYear = new Map<number, number>();
 
 data.forEach(d => {
 const year = new Date(d.tanggal).getFullYear();
 if (isNaN(year)) return;
 
 const current = byYear.get(year) || 0;
 if (d.curah_hujan > current) {
 byYear.set(year, d.curah_hujan);
 }
 });

 return Array.from(byYear.entries())
 .map(([year, value]) => ({ year, value }))
 .sort((a, b) => b.year - a.year); // Sort descending (latest year first) or ascending?
 // Modal uses ascending: .sort((a, b) => a.year - b.year)
}
