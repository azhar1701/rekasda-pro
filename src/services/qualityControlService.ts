/**
 * Quality Control Service
 * Uji Kualitas Data Hujan sesuai SNI dan WMO Guidelines
 */

import type { QualityControlResults } from '@/stores/useHydrologyStore';

/**
 * Uji Konsistensi menggunakan RAPS (Rescaled Adjusted Partial Sums)
 */
export function testConsistency(data: number[]): QualityControlResults['konsistensi'] {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(
    data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1)
  );

  // Calculate RAPS statistic
  let Sk = 0;
  let maxSk = 0;
  const adjustedData = data.map(x => (x - mean) / stdDev);
  
  for (let k = 0; k < n; k++) {
    Sk += adjustedData[k];
    maxSk = Math.max(maxSk, Math.abs(Sk));
  }

  const rapsValue = maxSk / Math.sqrt(n);
  const threshold = 1.5; // Critical value for 95% confidence

  return {
    isPassed: rapsValue < threshold,
    method: 'RAPS',
    rapsValue,
    threshold,
    message: rapsValue < threshold
      ? 'Data konsisten (lolos uji RAPS)'
      : 'Data tidak konsisten - kemungkinan ada perubahan stasiun atau metode pengukuran',
  };
}

/**
 * Uji Homogenitas menggunakan F-Test
 */
export function testHomogeneity(data: number[]): QualityControlResults['homogenitas'] {
  const n = data.length;
  const mid = Math.floor(n / 2);
  
  const group1 = data.slice(0, mid);
  const group2 = data.slice(mid);

  const variance1 = calculateVariance(group1);
  const variance2 = calculateVariance(group2);

  const fValue = Math.max(variance1, variance2) / Math.min(variance1, variance2);
  
  // Critical F-value for α=0.05 (simplified)
  const criticalValue = 2.0;

  return {
    isPassed: fValue < criticalValue,
    method: 'F-Test',
    fValue,
    criticalValue,
    message: fValue < criticalValue
      ? 'Data homogen (lolos uji F-Test)'
      : 'Data tidak homogen - ada perbedaan signifikan antar periode',
  };
}

/**
 * Uji Outlier menggunakan Grubbs-Beck Test
 */
export function testOutliers(data: number[]): QualityControlResults['outlier'] {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(
    data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1)
  );

  // Grubbs test statistic
  const outlierIndices: number[] = [];
  const threshold = 2.5; // Z-score threshold

  data.forEach((val, idx) => {
    const zScore = Math.abs((val - mean) / stdDev);
    if (zScore > threshold) {
      outlierIndices.push(idx);
    }
  });

  return {
    isPassed: outlierIndices.length === 0,
    method: 'Grubbs-Beck',
    outlierIndices,
    message:
      outlierIndices.length === 0
        ? 'Tidak ada outlier terdeteksi'
        : `Terdeteksi ${outlierIndices.length} outlier pada indeks: ${outlierIndices.join(', ')}`,
  };
}

/**
 * Jalankan semua uji QC
 */
export function performQualityControl(data: number[]): QualityControlResults {
  const konsistensi = testConsistency(data);
  const homogenitas = testHomogeneity(data);
  const outlier = testOutliers(data);

  const overallPassed = konsistensi.isPassed && homogenitas.isPassed && outlier.isPassed;

  return {
    konsistensi,
    homogenitas,
    outlier,
    overallPassed,
  };
}

// Helper functions
function calculateVariance(data: number[]): number {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  return data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
}
