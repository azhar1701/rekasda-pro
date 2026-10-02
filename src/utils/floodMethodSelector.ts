/**
 * Flood Method Selection Logic - Recommender Engine
 * Compliant with SNI 2415:2016
 *
 * CATATAN SNI: Batas keberlakuan Metode Rasional adalah 50 km² (5000 ha)
 * sesuai SNI 2415:2016 Pasal 5.2. Rekomendasi di sini menggunakan 3 km²
 * sebagai heuristik praktis lapangan (di bawah batas itu intensitas merata
 * dengan sangat baik). Nilai batas SNI resmi tersimpan di SNI_RATIONAL_AREA_LIMIT_KM2.
 */

import { SNI_RATIONAL_AREA_LIMIT_KM2 } from '@/lib/constants/sni';

/** Heuristik praktis (≤ 3 km²): asumsi curah hujan merata sangat terpenuhi */
const PRACTICAL_RATIONAL_THRESHOLD_KM2 = 3;

export interface MethodRecommendation {
  metode: 'Rasional' | 'HSS Nakayasu' | 'None';
  isRasional: boolean;
  alasan: string;
  status: 'ready' | 'not_ready';
}

/**
 * Menentukan metode perhitungan debit banjir berdasarkan Luas DAS (A).
 *
 * Rekomendasi praktis (berbeda dengan batas SNI resmi 50 km²):
 * - A ≤ 3 km²: Metode Rasional ideal (intensitas hujan merata sangat baik)
 * - 3 < A ≤ 50 km²: Rasional masih diizinkan SNI, namun HSS lebih akurat
 * - A > 50 km²: WAJIB HSS sesuai SNI 2415:2016 Pasal 5.2
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
      status: 'not_ready',
    };
  }

  const area = typeof luasDasKm2 === 'string' ? parseFloat(luasDasKm2) : luasDasKm2;

  if (isNaN(area) || area <= 0) {
    return {
      metode: 'None',
      isRasional: false,
      alasan: 'Nilai Luas DAS tidak valid. Harap masukkan angka positif > 0.',
      status: 'not_ready',
    };
  }

  // Pelanggaran batas SNI — WAJIB HSS
  if (area > SNI_RATIONAL_AREA_LIMIT_KM2) {
    return {
      metode: 'HSS Nakayasu',
      isRasional: false,
      alasan: `Luas DAS (${area.toFixed(2)} km²) melebihi batas SNI 2415:2016 Pasal 5.2 (${SNI_RATIONAL_AREA_LIMIT_KM2} km² / 5000 ha). WAJIB menggunakan Metode HSS.`,
      status: 'ready',
    };
  }

  // Heuristik praktis ≤ 3 km²: Rasional paling tepat
  if (area <= PRACTICAL_RATIONAL_THRESHOLD_KM2) {
    return {
      metode: 'Rasional',
      isRasional: true,
      alasan: `Luas DAS (${area.toFixed(2)} km²) ≤ ${PRACTICAL_RATIONAL_THRESHOLD_KM2} km². Asumsi intensitas hujan merata terpenuhi optimal. Metode Rasional direkomendasikan (SNI 2415:2016 Pasal 5.2).`,
      status: 'ready',
    };
  }

  // Zona 3–50 km²: Rasional valid per SNI, tapi HSS lebih akurat
  return {
    metode: 'HSS Nakayasu',
    isRasional: false,
    alasan: `Luas DAS (${area.toFixed(2)} km²) berada di zona ${PRACTICAL_RATIONAL_THRESHOLD_KM2}–${SNI_RATIONAL_AREA_LIMIT_KM2} km². Metode Rasional masih diizinkan SNI 2415:2016, namun HSS Nakayasu memberikan akurasi lebih baik untuk DAS ukuran ini.`,
    status: 'ready',
  };
}
