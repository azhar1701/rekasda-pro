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

export interface MultiYearMonthlyRainfall {
  years: number[];
  monthlyByYear: Record<number, number[]>; // 12 values per year (Jan-Dec)
  averageMonthly: number[]; // 12 average values across all years
}

/**
 * Aggregates daily rainfall series into monthly totals grouped by calendar year.
 * Standard hydrology practice for F.J. Mock input preparation.
 * 
 * @param data Array of daily rainfall records (DataHujan[])
 * @returns MultiYearMonthlyRainfall
 */
export function aggregateMonthlyRainfall(data: DataHujan[]): MultiYearMonthlyRainfall {
  if (!data || data.length === 0) {
    return { years: [], monthlyByYear: {}, averageMonthly: new Array(12).fill(0) };
  }

  const monthlySums: Record<number, number[]> = {};

  data.forEach(d => {
    const date = new Date(d.tanggal);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0 to 11

    if (isNaN(year) || isNaN(month) || month < 0 || month > 11) return;

    if (!monthlySums[year]) {
      monthlySums[year] = new Array(12).fill(0);
    }

    const rain = typeof d.curah_hujan === 'number' && !isNaN(d.curah_hujan) ? d.curah_hujan : 0;
    monthlySums[year][month] += rain;
  });

  const years = Object.keys(monthlySums).map(Number).sort((a, b) => a - b);

  // Round monthly sums to 2 decimals
  years.forEach(yr => {
    monthlySums[yr] = monthlySums[yr].map(v => Number(v.toFixed(2)));
  });

  // Calculate average for each month across all recorded years
  const averageMonthly = new Array(12).fill(0);
  if (years.length > 0) {
    for (let m = 0; m < 12; m++) {
      const sum = years.reduce((acc, yr) => acc + monthlySums[yr][m], 0);
      averageMonthly[m] = Number((sum / years.length).toFixed(2));
    }
  }

  return {
    years,
    monthlyByYear: monthlySums,
    averageMonthly,
  };
}
