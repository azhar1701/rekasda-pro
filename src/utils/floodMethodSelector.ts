/**
 * Flood Method Selection Logic - Recommender Engine
 * Compliant with SNI 2415:2016
 */

export interface MethodRecommendation {
  metode: 'Rasional' | 'HSS Nakayasu' | 'None';
  isRasional: boolean;
  alasan: string;
  status: 'ready' | 'not_ready';
}

/**
 * Menentukan metode perhitungan debit banjir berdasarkan Luas DAS (A).
 * Aturan Hidrologi SNI:
 * - A <= 3 km2: Metode Rasional (Asumsi intensitas hujan merata terpenuhi)
 * - A > 3 km2: Metode HSS (Efek routing saluran mulai signifikan)
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

  // SNI 2415:2016 Recommendation Logic
  if (area <= 3) {
    return {
      metode: 'Rasional',
      isRasional: true,
      alasan: `Luas DAS (${area.toFixed(2)} km²) ≤ 3 km². Asumsi intensitas hujan merata terpenuhi untuk penggunaan Metode Rasional sesuai SNI 2415:2016.`,
      status: 'ready'
    };
  }

  return {
    metode: 'HSS Nakayasu',
    isRasional: false,
    alasan: `Luas DAS (${area.toFixed(2)} km²) > 3 km². Wajib menggunakan penelusuran hidrograf satuan sintetis (HSS) karena efek routing saluran mulai signifikan.`,
    status: 'ready'
  };
}
