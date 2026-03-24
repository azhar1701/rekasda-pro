/**
 * Precision Constants — Standar Output Presisi Rekayasa Hidrologi
 *
 * Semua modul engine HARUS menggunakan konstanta ini untuk pembulatan output.
 * Konsisten di seluruh codebase mencegah inkonsistensi presisi antar modul.
 *
 * @standard SNI 2415:2016
 */

export const PRECISION = {
  /** Debit (m³/s) → 3 desimal */
  discharge: 3,
  /** Waktu (jam) → 2 desimal */
  time: 2,
  /** Luas (km²) → 4 desimal */
  area: 4,
  /** Curah hujan (mm) → 1 desimal */
  rainfall: 1,
  /** Koefisien dimensionless → 3 desimal */
  coefficient: 3,
  /** Volume (m³) → bilangan bulat */
  volume: 0,
  /** Kecepatan (m/s) → 3 desimal */
  velocity: 3,
  /** Elevasi (m) → 2 desimal */
  elevation: 2,
  /** Kemiringan (m/m) → 6 desimal */
  slope: 6,
} as const;

export type PrecisionKey = keyof typeof PRECISION;
