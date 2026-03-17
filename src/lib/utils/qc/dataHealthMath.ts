import { DataHujan, StationHealth, QCStatus } from '@/types/hydrology.types';

/**
 * Professional Hydrology Data Health Engine
 * Calculates freshness, missing gaps, and overall engineering score.
 */

export const calculateStationHealth = (data: DataHujan[], qcStatus?: QCStatus): StationHealth => {
  if (!data || data.length === 0) {
    return {
      periodStart: null,
      periodEnd: null,
      totalDays: 0,
      missingDays: 0,
      missingPercentage: 100,
      healthScore: 0,
      status: 'POOR'
    };
  }

  // 1. Determine Period
  const dates = data.map(d => new Date(d.tanggal).getTime());
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  
  const periodStart = minDate.getFullYear();
  const periodEnd = maxDate.getFullYear();

  // 2. Calculate Theoretical Days vs Actual Days
  const now = new Date();
  const effectiveMaxDate = maxDate > now ? now : maxDate;
  
  const diffTime = Math.abs(effectiveMaxDate.getTime() - minDate.getTime());
  const theoreticalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const actualDaysWithData = new Set(data.map(d => d.tanggal)).size;
  
  const missingDays = theoreticalDays - actualDaysWithData;
  const missingPercentage = theoreticalDays > 0 ? (missingDays / theoreticalDays) * 100 : 100;

  // 3. Calculate Engineering Health Score (0-100)
  // Factors: 
  // - Data Length (Years) -> 40 points (Max if >= 20 years)
  // - Data Gaps (%) -> 60 points (Max if missing < 5%)
  
  const yearsCount = (periodEnd - periodStart) + 1;
  const lengthScore = Math.min(40, (yearsCount / 20) * 40);
  
  const gapScore = Math.max(0, 60 - (missingPercentage * 2)); // Aggressive penalty for gaps
  
  let healthScore = Math.round(lengthScore + gapScore);

  // 4. Apply QC Penalties (New)
  if (qcStatus) {
    // Penalize only if explicitly false (failed), not if undefined (not audited)
    if (qcStatus.konsisten === false) healthScore -= 25;   
    if (qcStatus.homogen === false) healthScore -= 15;     
    if (qcStatus.bebasOutlier === false) healthScore -= 10;
    
    // Safety check logging (visible in dev console)
    console.log(`[HealthEngine] Applying penalties for station. Final Score: ${healthScore}`, qcStatus);
  }

  healthScore = Math.max(0, Math.min(100, healthScore));

  // 5. Assign Status
  let status: StationHealth['status'] = 'POOR';
  if (healthScore >= 85) status = 'EXCELLENT';
  else if (healthScore >= 70) status = 'GOOD';
  else if (healthScore >= 50) status = 'FAIR';

  return {
    periodStart,
    periodEnd,
    totalDays: theoreticalDays,
    missingDays,
    missingPercentage: parseFloat(missingPercentage.toFixed(2)),
    healthScore,
    status
  };
};
