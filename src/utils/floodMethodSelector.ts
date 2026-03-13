/**
 * Flood Method Selection Logic - Recommender Engine
 * Compliant with SNI 2415:2016
 * 
 * NOTE: This is a legacy utility that now delegates to the Professional Decision Tree.
 * @deprecated Use @/utils/engineeringDecisionTree directly for new features.
 */

import { getEngineeringRecommendation } from './engineeringDecisionTree';

export interface MethodRecommendation {
  metode: string;
  isRasional: boolean;
  alasan: string;
  status: 'ready' | 'not_ready';
}

/**
 * Menentukan metode perhitungan debit banjir berdasarkan Luas DAS (A).
 * 
 * @param luasDasKm2 Luas DAS dalam kilometer persegi
 * @returns MethodRecommendation
 */
export function determineFloodMethod(luasDasKm2: number | null | undefined | string): MethodRecommendation {
  // Defensive Programming: Handle invalid or missing input
  if (luasDasKm2 === null || luasDasKm2 === undefined || luasDasKm2 === '') {
    return {
      metode: 'None',
      isRasional: false,
      alasan: 'Parameter Luas DAS (A) belum terdefinisi. Selesaikan delineasi di Modul Spasial.',
      status: 'not_ready'
    };
  }

  const area = typeof luasDasKm2 === 'string' ? parseFloat(luasDasKm2) : luasDasKm2;

  if (isNaN(area) || area <= 0) {
    return {
      metode: 'None',
      isRasional: false,
      alasan: 'Nilai Luas DAS tidak valid. Harap masukkan angka positif > 0.',
      status: 'not_ready'
    };
  }

  // DELEGATE to Professional Engineering Decision Tree
  const decision = getEngineeringRecommendation(area, 'peak_only');
  const primary = decision.primaryMethod;

  return {
    metode: primary.name,
    isRasional: primary.category === 'RATIONAL',
    alasan: `${primary.justification} Sesuai ${primary.standardReference}.`,
    status: 'ready'
  };
}
