import { StasiunHidrologi, DataHujan } from '@/stores/useHydrologyStore';

/**
 * Menghitung jarak Euclidean antara dua koordinat
 */
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Infill Missing Data menggunakan Inverse Distance Weighting (IDW)
 * Px = Σ (Pi / di^k) / Σ (1 / di^k)
 */
export function infillIDW(
  targetStation: StasiunHidrologi,
  surroundingStations: { stasiun: StasiunHidrologi; value: number }[],
  power: number = 2
): number {
  if (surroundingStations.length === 0) return 0;
  if (targetStation.koordinat_x === null || targetStation.koordinat_y === null) return 0;

  let numerator = 0;
  let denominator = 0;

  for (const { stasiun, value } of surroundingStations) {
    if (stasiun.koordinat_x === null || stasiun.koordinat_y === null) continue;
    
    const dist = calculateDistance(
      targetStation.koordinat_x,
      targetStation.koordinat_y,
      stasiun.koordinat_x,
      stasiun.koordinat_y
    );

    if (dist === 0) return value; // Jika lokasi sama persis

    const weight = 1 / Math.pow(dist, power);
    numerator += value * weight;
    denominator += weight;
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Infill Missing Data menggunakan Normal Ratio Method
 * Px = (1/n) * Σ (Nx / Ni * Pi)
 * Dimana Nx adalah hujan rata-rata tahunan stasiun target, Ni stasiun sekitar
 */
export function infillNormalRatio(
  targetAvg: number,
  surroundingData: { avg: number; value: number }[]
): { value: number; isLongTermMean: boolean } {
  if (surroundingData.length === 0 || targetAvg === 0) return { value: 0, isLongTermMean: false };

  let sum = 0;
  let count = 0;

  for (const { avg, value } of surroundingData) {
    if (avg === 0) continue;
    sum += (targetAvg / avg) * value;
    count++;
  }

  return { 
    value: count === 0 ? 0 : sum / count,
    isLongTermMean: false // Currently only supports on-the-fly dataset mean
  };
}

/**
 * Fungsi utama untuk mengisi data kosong
 */
export function infillMissingData(
  targetStation: StasiunHidrologi,
  allStations: StasiunHidrologi[],
  allData: DataHujan[],
  targetDate: string,
  method: 'normal_ratio' | 'idw' = 'idw'
): { value: number; method: string; metadata?: string } {
  // 1. Cari data stasiun lain pada tanggal yang sama
  const surroundingData = allStations
    .filter(s => s.id !== targetStation.id)
    .map(s => {
      const data = allData.find(d => d.stasiun_id === s.id && d.tanggal === targetDate);
      return { stasiun: s, value: data?.curah_hujan || 0 };
    })
    .filter(d => d.value > 0);

  if (surroundingData.length === 0) return { value: 0, method: 'None' };

  if (method === 'idw' && targetStation.koordinat_x !== null && targetStation.koordinat_y !== null) {
    return { 
      value: infillIDW(targetStation, surroundingData),
      method: 'IDW'
    };
  }

  // Fallback to Normal Ratio or Simple Average if coordinates missing
  // Untuk Normal Ratio, kita butuh rata-rata tahunan. 
  // Karena kita tidak punya data historis lengkap di sini, kita gunakan rata-rata dari data yang ada.
  const getAvg = (stasiunId: string) => {
    const vals = allData.filter(d => d.stasiun_id === stasiunId && d.curah_hujan > 0).map(d => d.curah_hujan);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const targetAvg = getAvg(targetStation.id);
  const surroundingWithAvg = surroundingData.map(d => ({
    avg: getAvg(d.stasiun.id),
    value: d.value
  })).filter(d => d.avg > 0);

  if (targetAvg > 0 && surroundingWithAvg.length > 0) {
    const res = infillNormalRatio(targetAvg, surroundingWithAvg);
    return {
      value: res.value,
      method: 'Normal Ratio',
      metadata: res.isLongTermMean ? 'Long-term Mean' : 'Short-term Dataset Mean'
    };
  }

  // Last fallback: Simple Average
  const validValues = surroundingData.map(d => d.value);
  return {
    value: validValues.reduce((a, b) => a + b, 0) / validValues.length,
    method: 'Simple Average'
  };
}
