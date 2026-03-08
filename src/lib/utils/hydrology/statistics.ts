/**
 * Modul Statistik Hidrologi Dasar (Metode Momen / Method of Moments)
 * 
 * Berisi fungsi-fungsi untuk mendeterminasi parameter deskriptif dari deret berkala
 * (time series) curah hujan/debit maksimum tahunan (Annual Maximum Series).
 */

export interface StatisticalParameters {
  mean: number;       // Rata-rata (X̄)
  stdDev: number;     // Standar Deviasi (S)
  skewness: number;   // Koefisien Kemencengan (Cs)
  kurtosis: number;   // Koefisien Puncak / Kurtosis (Ck)
  cv: number;         // Koefisien Variasi (Cv)
  n: number;          // Jumlah Data
}

/**
 * Menghitung Parameter Statistik Inti dari Array Angka
 * Sangat diperlukan untuk Analisis Frekuensi dan Uji Goodness-of-Fit.
 * 
 * @param data Array Data Curah Hujan atau Debit Maksimum
 * @returns Object StatisticalParameters
 */
export function calculateStatisticalParameters(data: number[]): StatisticalParameters {
  const n = data.length;
  
  if (n === 0) {
    return { mean: 0, stdDev: 0, skewness: 0, kurtosis: 0, cv: 0, n: 0 };
  }
  
  if (n === 1) {
    return { mean: data[0], stdDev: 0, skewness: 0, kurtosis: 0, cv: 0, n: 1 };
  }

  // 1. Rata - rata (Mean / X̄)
  const mean = data.reduce((acc, val) => acc + val, 0) / n;

  let sumSquares = 0;
  let sumCubes = 0;
  let sumQuads = 0;

  for (let i = 0; i < n; i++) {
    const diff = data[i] - mean;
    sumSquares += Math.pow(diff, 2);
    sumCubes += Math.pow(diff, 3);
    sumQuads += Math.pow(diff, 4);
  }

  // 2. Standar Deviasi (S) -> S = √[ Σ(Xi - X_mean)² / (n-1) ]
  let stdDev = 0;
  if (n > 1) {
    stdDev = Math.sqrt(sumSquares / (n - 1));
  }

  // 3. Koefisien Variasi (Cv) -> Cv = S / X̄
  const cv = mean !== 0 ? stdDev / mean : 0;

  // 4. Koefisien Kemencengan (Cs) -> Cs = [n * Σ(Xi-X_mean)³] / [(n-1)(n-2)*S³]
  let skewness = 0;
  if (n > 2 && stdDev > 0) {
    skewness = (n * sumCubes) / ((n - 1) * (n - 2) * Math.pow(stdDev, 3));
  }

  // 5. Koefisien Kurtosis (Ck) -> Ck = [n² * Σ(Xi-X_mean)⁴] / [(n-1)(n-2)(n-3)*S⁴]
  let kurtosis = 0;
  if (n > 3 && stdDev > 0) {
    kurtosis = (Math.pow(n, 2) * sumQuads) / ((n - 1) * (n - 2) * (n - 3) * Math.pow(stdDev, 4));
  }

  return {
    mean,
    stdDev,
    skewness,
    kurtosis,
    cv,
    n
  };
}
